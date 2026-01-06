# Project Structure

Complete file tree with descriptions.

```
one-drop-threads/
├── README.md                          # Main documentation
├── QUICKSTART.md                      # 15-minute setup guide
├── DEPLOYMENT.md                      # Production deployment guide
├── NOTES.md                           # Architecture decisions & notes
│
├── Configuration Files
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript configuration
├── next.config.js                     # Next.js config (static export)
├── tailwind.config.js                 # Tailwind CSS config
├── postcss.config.js                  # PostCSS config
├── wrangler.toml                      # Cloudflare config
│
├── Database
├── schema.sql                         # D1 database schema
│
├── src/
│   ├── types/
│   │   └── index.ts                   # TypeScript type definitions
│   │
│   ├── lib/                           # Core business logic
│   │   ├── db.ts                      # Database operations (D1)
│   │   ├── stripe.ts                  # Stripe client & helpers
│   │   ├── printful.ts                # Printful API integration
│   │   └── r2.ts                      # R2 image storage
│   │
│   └── app/                           # Next.js App Router
│       ├── globals.css                # Global styles (Tailwind)
│       ├── layout.tsx                 # Root layout (nav, footer)
│       ├── page.tsx                   # Homepage (product grid)
│       │
│       ├── product/[id]/
│       │   └── page.tsx               # Product detail page (size selector)
│       │
│       ├── sold/
│       │   └── page.tsx               # "Sold out" page
│       │
│       ├── success/
│       │   └── page.tsx               # Post-purchase success page
│       │
│       ├── admin/
│       │   └── page.tsx               # Admin dashboard (upload, orders)
│       │
│       └── api/                       # API routes (Edge runtime)
│           ├── products/
│           │   ├── route.ts           # GET all available products
│           │   └── [id]/
│           │       └── route.ts       # GET single product by ID
│           │
│           ├── checkout/
│           │   └── route.ts           # POST create Stripe session
│           │
│           ├── webhooks/
│           │   └── stripe/
│           │       └── route.ts       # POST Stripe webhook handler
│           │                          # ⚠️ CRITICAL: Fulfillment logic
│           │
│           └── admin/
│               ├── products/
│               │   └── route.ts       # POST create product
│               │                      # GET list products
│               └── orders/
│                   └── route.ts       # GET list all orders
│
└── public/                            # Static assets (if needed)
```

## Key File Responsibilities

### Critical Files (Don't break these!)

**`src/app/api/webhooks/stripe/route.ts`**
- Handles Stripe payment confirmations
- Creates Printful orders
- Marks products as sold
- Race condition handling
- Idempotency checks

**`src/lib/db.ts`**
- All database operations
- Transaction handling
- Product locking logic

**`schema.sql`**
- Database structure
- Must be applied to D1

### Configuration

**`.env.example`** → Copy to `.env.local`
- All API keys
- Environment-specific settings

**`wrangler.toml`**
- Cloudflare bindings (D1, R2)
- Must update `database_id` after creating D1

### API Routes

All routes use Cloudflare Edge runtime:
```typescript
export const runtime = 'edge';
```

**Public Routes** (no auth):
- `GET /api/products` - List available products
- `GET /api/products/[id]` - Get single product
- `POST /api/checkout` - Create Stripe session
- `POST /api/webhooks/stripe` - Stripe webhooks

**Admin Routes** (API key required):
- `GET /api/admin/orders?key=xxx`
- `POST /api/admin/products?key=xxx`

### Pages

**Public Pages**:
- `/` - Homepage (product grid)
- `/product/[id]` - Product detail
- `/sold` - Generic "sold out" page
- `/success` - Post-purchase confirmation

**Admin Page**:
- `/admin?key=xxx` - Dashboard for uploads & orders

### Libraries

**`src/lib/db.ts`**
- `getAvailableProducts()` - Fetch all available
- `getProductById()` - Fetch single product
- `createProduct()` - Insert new product
- `markProductAsSold()` - Update status
- `lockProductForPurchase()` - Atomic lock
- `createOrder()` - Insert order
- `getOrderBySessionId()` - Find existing order

**`src/lib/stripe.ts`**
- `createCheckoutSession()` - Create payment session
- `constructWebhookEvent()` - Verify webhook signature

**`src/lib/printful.ts`**
- `uploadDesignFile()` - Upload to Printful
- `createPrintfulProduct()` - Create product + variants
- `createPrintfulOrder()` - Submit order for fulfillment

**`src/lib/r2.ts`**
- `uploadImage()` - Store mockup in R2
- `generateImageKey()` - Create unique filename

## File Count

- **Total files**: 31
- **TypeScript files**: 16
- **Config files**: 8
- **Documentation**: 4
- **CSS**: 1
- **SQL**: 1
- **Other**: 1

## Lines of Code (Approximate)

| Category | LOC |
|----------|-----|
| TypeScript (src/) | ~2000 |
| Config files | ~100 |
| SQL | ~50 |
| CSS | ~50 |
| Documentation | ~2000 |
| **Total** | **~4200** |

## Adding New Features

### Add a new page
1. Create `src/app/your-page/page.tsx`
2. Export default component
3. Access at `/your-page`

### Add a new API route
1. Create `src/app/api/your-route/route.ts`
2. Export `GET`, `POST`, etc. functions
3. Add `export const runtime = 'edge';`

### Add a new database table
1. Edit `schema.sql`
2. Run migration: `npx wrangler d1 execute ... --file=./schema.sql`
3. Add TypeScript types to `src/types/index.ts`
4. Add DB functions to `src/lib/db.ts`

### Modify styling
- Global styles: `src/app/globals.css`
- Component styles: Inline Tailwind classes
- Theme config: `tailwind.config.js`

## Important Notes

### Don't Modify
- `/out` folder (auto-generated by build)
- `node_modules/` (managed by npm)
- `.next/` (Next.js cache)

### Always Check Before Deploy
- Environment variables set in Cloudflare
- Database migrations applied
- Webhook endpoint configured in Stripe
- API keys are production keys

### Recommended IDE Setup
- VSCode with:
  - TypeScript extension
  - Tailwind CSS IntelliSense
  - Prettier
  - ESLint

## Getting Help

1. Check logs: `npx wrangler pages deployment tail`
2. Read `NOTES.md` for architecture details
3. Review `DEPLOYMENT.md` for setup issues
4. Test locally: `npm run dev`

---

**Remember**: This is a production-ready, solo-operated system. Every file has a purpose. Nothing is over-engineered.
