# One Drop Threads

E-commerce platform where each design is sold exactly once. Built for Cloudflare Pages with Stripe + Printful.

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Hosting**: Cloudflare Pages
- **Storage**: Cloudflare D1 (SQLite), R2 (images)
- **Payments**: Stripe Checkout
- **Fulfillment**: Printful API

## Setup

### 1. Prerequisites

- Node.js 18+
- Cloudflare account
- Stripe account
- Printful account

### 2. Install Dependencies

```bash
npm install
```

### 3. Cloudflare Setup

#### Create D1 Database

```bash
npx wrangler d1 create one-drop-threads-db
```

Copy the database ID to `wrangler.toml`.

#### Run Migrations

```bash
npx wrangler d1 execute one-drop-threads-db --local --file=./schema.sql
npx wrangler d1 execute one-drop-threads-db --remote --file=./schema.sql
```

#### Create R2 Bucket

```bash
npx wrangler r2 bucket create one-drop-threads-images
```

### 4. Environment Variables

Create `.env.local`:

```env
# Cloudflare
DATABASE_ID=your_d1_database_id
R2_BUCKET_NAME=one-drop-threads-images
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Printful
PRINTFUL_API_KEY=your_printful_api_key

# Admin
ADMIN_API_KEY=your_secure_random_string

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 5. Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.pages.dev/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 6. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### 7. Deployment

```bash
npm run build
npx wrangler pages deploy ./out
```

Set environment variables in Cloudflare Pages dashboard.

## Usage

### Adding a New Design

1. Prepare your design file (PNG, transparent background recommended)
2. Go to `/admin?key=YOUR_ADMIN_API_KEY`
3. Upload design and fill form:
   - Title
   - Description
   - Select Printful base product (e.g., Bella + Canvas 3001)
   - Choose available sizes
4. Submit → Product goes live immediately

### How It Works

1. **Customer browses** → sees only available products
2. **Customer selects size** → on product page
3. **Customer clicks "Buy This One"** → Stripe Checkout
4. **Payment completes** → Stripe webhook fires
5. **System automatically**:
   - Marks product as SOLD
   - Creates Printful order
   - Removes from storefront
6. **Printful fulfills** → ships directly to customer

### Race Condition Handling

- Database transaction locks product during checkout
- Webhook is idempotent (won't duplicate orders)
- If two users hit "buy" simultaneously, second user gets error

### Printful Product Mapping

When you add a design:
1. System uploads design to Printful
2. Creates product with all size variants
3. Stores `printfulProductId` + `printfulVariantIds` in database
4. Customer selects size → system uses correct variant ID for order

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage (grid of available products)
│   ├── product/[id]/         # Product detail page
│   ├── sold/                 # Generic "sold out" page
│   ├── admin/                # Admin dashboard
│   └── api/
│       ├── checkout/         # Create Stripe session
│       ├── webhooks/stripe/  # Handle Stripe events
│       └── admin/            # Admin CRUD endpoints
├── lib/
│   ├── db.ts                 # D1 database utilities
│   ├── stripe.ts             # Stripe client
│   ├── printful.ts           # Printful API client
│   └── r2.ts                 # R2 image storage
└── types/
    └── index.ts              # TypeScript types
```

## Troubleshooting

### Webhook not firing

- Check Stripe dashboard webhook logs
- Verify webhook secret matches
- Ensure endpoint is accessible (HTTPS required in production)

### Printful order not created

- Check logs in Cloudflare Pages dashboard
- Verify API key has correct permissions
- Ensure variant IDs are valid

### Product not appearing

- Check `status` field in database (must be 'available')
- Verify image uploaded to R2

## Support

Open an issue or check Cloudflare/Stripe/Printful documentation.
