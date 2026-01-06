# Architecture Notes

Key decisions and implementation details for One Drop Threads.

## Core Principles

1. **KISS** (Keep It Simple, Stupid)
   - No unnecessary abstractions
   - Direct database queries
   - Minimal middleware
   - Single-purpose functions

2. **YAGNI** (You Aren't Gonna Need It)
   - No user accounts
   - No shopping cart
   - No inventory management
   - No recommendation engine
   - No reviews/ratings

3. **SOLID** (Single Responsibility, Open/Closed, etc.)
   - Separate concerns: DB, API, Stripe, Printful
   - Each module has one job
   - Easy to extend without breaking

## Race Condition Handling

**Problem**: Two users clicking "Buy" at the same time.

**Solution**: Database-level locking

```typescript
// In webhook handler (src/app/api/webhooks/stripe/route.ts)
const locked = await lockProductForPurchase(db, productId);
if (!locked) {
  throw new Error('Product no longer available');
}
```

The `lockProductForPurchase` function uses a SQL UPDATE with WHERE conditions:

```sql
UPDATE products 
SET status = 'sold' 
WHERE id = ? AND status = 'available'
```

This is atomic at the database level. Only ONE update will succeed.

**Edge Cases Covered**:
- Multiple simultaneous checkouts → First one wins
- Webhook retries → Idempotency check via `stripe_session_id`
- Network failures → Webhook will retry, order won't duplicate

## Webhook Idempotency

**Problem**: Stripe may send the same webhook multiple times.

**Solution**: Check for existing order before processing

```typescript
const existingOrder = await getOrderBySessionId(db, sessionId);
if (existingOrder) {
  return; // Already processed
}
```

This prevents:
- Double fulfillment
- Double billing
- Duplicate Printful orders

## Image Storage Strategy

**Why R2 over alternatives:**

| Option | Pros | Cons |
|--------|------|------|
| R2 | Cheap, S3-compatible, same provider | Requires setup |
| Cloudflare Images | Optimized delivery | More expensive |
| External CDN | Easy | Another vendor dependency |

**Decision**: R2 with public bucket
- Store full-res mockups
- Simple URL structure: `products/{productId}/{timestamp}.png`
- Optional: Set up custom domain for branding

## Printful Integration

**Design Flow**:

1. Admin uploads design → R2
2. Design also uploaded to Printful via API
3. Printful returns file ID
4. Create Printful product with file ID
5. Store product + variant IDs in database

**Why not create Printful products manually?**

Manual flow would require:
- Admin creates product in Printful
- Admin copies product ID to our system
- Prone to human error

Automated flow is:
- Upload once
- System handles rest
- Fewer steps to mess up

**Variant Mapping**:

Each Printful base product has specific variant IDs:
- Bella + Canvas 3001 Size M = Variant ID 4013
- These are hardcoded in `src/lib/printful.ts`

To add new products:
1. Get variant IDs from Printful API
2. Add to `variantMaps` object
3. Deploy

## Database Schema Decisions

**Why two tables instead of one?**

Could have done:
```sql
-- Single table
products (
  ...
  customer_email,
  shipping_address,
  ...
)
```

But separated because:
- Product is permanent (exists before/after sale)
- Order is transient (only exists after purchase)
- Cleaner queries
- Easier to add multiple orders per product later (if business model changes)

**Timestamps as Unix epochs**:
- `created_at INTEGER` instead of `TIMESTAMP`
- D1 handles this natively
- Easy to sort/filter
- JavaScript: `new Date(timestamp * 1000)`

## Why No Auth for Admin?

**Simple API key in URL params** instead of:
- OAuth
- JWT
- Sessions
- Password hashing

**Reasoning**:
- Solo operation
- Admin page is internal-only
- Simpler = fewer bugs
- Can always upgrade later if needed

**Security measure**:
- Use 32+ character random string
- Don't commit to git
- Rotate if compromised

## Stripe Checkout vs Payment Intents

**Used**: Checkout Sessions

**Why not Payment Intents?**

| Feature | Checkout | Payment Intents |
|---------|----------|-----------------|
| Complexity | Low | High |
| UI | Stripe-hosted | Custom |
| PCI compliance | Handled | You handle |
| Time to implement | 1 hour | 1 day |

For one-product-at-a-time model, Checkout is perfect.

## Cloudflare Edge Runtime

**All API routes use**:
```typescript
export const runtime = 'edge';
```

**Why?**
- Required for Cloudflare Pages Functions
- Access to D1 bindings
- Fast cold starts
- Global distribution

**Limitations**:
- Some Node.js APIs unavailable
- No fs, no process (except env vars)
- Use fetch instead of axios

## Static Export Considerations

**Next.js config**:
```javascript
output: 'export'
```

This generates static HTML/CSS/JS that Cloudflare Pages serves.

**Dynamic data** is fetched client-side via API routes:
- Homepage → `/api/products`
- Product page → `/api/products/[id]`

**Why not Server-Side Rendering (SSR)?**
- Cloudflare Pages supports it, but:
- Static export is simpler
- Fewer moving parts
- API routes handle dynamic data fine
- No need for ISR complexity

## Price Handling

**Hardcoded**: $35 in `src/lib/stripe.ts`

```typescript
unit_amount: 3500, // $35.00
```

**Why not configurable?**
- YAGNI principle
- All drops are same price
- Can make dynamic later if needed

**To change price**:
1. Edit `src/lib/stripe.ts`
2. Edit button text in `src/app/product/[id]/page.tsx`
3. Redeploy

## Error Handling Philosophy

**Fail loudly in development, gracefully in production**

```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error); // For logs
  return NextResponse.json(
    { error: 'Generic user-facing message' },
    { status: 500 }
  );
}
```

**User-facing errors are vague**:
- "Failed to create checkout" (not "Stripe API key invalid")
- "Upload failed" (not "R2 credentials wrong")

**Logs are detailed**:
- Check Cloudflare Dashboard → Functions → Logs
- Full error messages and stack traces

## Scalability Considerations

**Current system can handle**:
- 100s of products
- 1000s of orders
- Multiple concurrent users

**Bottlenecks**:
- D1 has limits (10GB free tier)
- R2 bandwidth (free tier: 10GB egress/month)

**When to upgrade**:
- If you're selling 50+ products/day consistently
- If you're storing 10GB+ of images
- If you need advanced features (coupons, bundles, etc.)

At that point, consider:
- Paid Cloudflare plans
- Separate fulfillment system
- Customer accounts
- Full e-commerce platform

## Testing Locally

**Run development server**:
```bash
npm run dev
```

**Limitations**:
- No D1 access (use `wrangler dev` instead)
- No R2 access
- Webhook won't work (use Stripe CLI)

**Recommended local testing**:
1. Use Cloudflare dev environment
2. Test webhooks with Stripe CLI
3. Test with real test credit cards

## Future Enhancements (If Needed)

Ideas that were intentionally left out:

- **Email notifications**: Add SendGrid/Mailgun integration
- **Waitlist**: When product sells, collect emails
- **Limited editions**: Sell 5 of each design instead of 1
- **Dynamic pricing**: Set price per product
- **Discount codes**: Add to Stripe session
- **Analytics**: Track views, conversion rates
- **SEO**: Add meta tags, sitemap

All of these are possible but add complexity. Start simple, add later if data shows it's needed.

## Key Files

| File | Purpose |
|------|---------|
| `schema.sql` | Database structure |
| `src/lib/db.ts` | All database operations |
| `src/lib/stripe.ts` | Stripe client and helpers |
| `src/lib/printful.ts` | Printful API integration |
| `src/lib/r2.ts` | Image upload to R2 |
| `src/app/api/webhooks/stripe/route.ts` | Critical: handles fulfillment |

## Common Pitfalls

1. **Forgetting to run migrations**: Always run on both local and remote
2. **Using test keys in production**: Triple check environment variables
3. **Not setting webhook secret**: Webhooks will fail silently
4. **Wrong Printful variant IDs**: Double check product IDs
5. **R2 not publicly accessible**: Images won't load

## Philosophy: Why This Tech Stack?

**Cloudflare Pages**:
- Cheap ($0-5/month)
- Fast (edge network)
- Simple (git push = deploy)

**Stripe**:
- Industry standard
- Easy integration
- Handles PCI compliance

**Printful**:
- Print-on-demand
- No inventory needed
- Automatic fulfillment

**Next.js**:
- React + TypeScript
- Static export works everywhere
- Good DX

**D1**:
- SQL (familiar)
- Serverless (scales to zero)
- Integrated with Cloudflare

This stack is optimized for:
- Solo operation
- Low costs
- Minimal maintenance
- Maximum reliability

## Questions?

Read the code! It's intentionally simple and well-commented.

Key principle: **If you can understand it in 30 minutes, it's good architecture.**
