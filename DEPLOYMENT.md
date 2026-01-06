# Deployment Guide

Complete step-by-step guide to deploy One Drop Threads to Cloudflare Pages.

## Prerequisites

- Cloudflare account with Workers paid plan ($5/month)
- Stripe account
- Printful account
- Node.js 18+ installed
- Git repository (GitHub, GitLab, etc.)

## Step 1: Set Up Cloudflare Resources

### 1.1 Create D1 Database

```bash
npx wrangler d1 create one-drop-threads-db
```

Copy the database ID and update `wrangler.toml`:

```toml
database_id = "YOUR_DATABASE_ID_HERE"
```

### 1.2 Run Database Migrations

```bash
# Local
npx wrangler d1 execute one-drop-threads-db --local --file=./schema.sql

# Production
npx wrangler d1 execute one-drop-threads-db --remote --file=./schema.sql
```

### 1.3 Create R2 Bucket

```bash
npx wrangler r2 bucket create one-drop-threads-images
```

Enable public access (optional but recommended):

1. Go to Cloudflare Dashboard → R2
2. Select `one-drop-threads-images`
3. Settings → Public Access → Enable
4. Note the public URL

### 1.4 Create R2 API Token

1. Cloudflare Dashboard → R2 → API Tokens
2. Create API Token
3. Permissions: Object Read & Write for your bucket
4. Save the Access Key ID and Secret Access Key

## Step 2: Configure Stripe

### 2.1 Get API Keys

1. Stripe Dashboard → Developers → API Keys
2. Copy Publishable key (starts with `pk_`)
3. Copy Secret key (starts with `sk_`)

### 2.2 Set Up Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.pages.dev/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
4. Copy webhook signing secret (starts with `whsec_`)

## Step 3: Configure Printful

### 3.1 Get API Key

1. Printful Dashboard → Settings → API
2. Create API Key
3. Copy the key

### 3.2 Note Product IDs

Common Printful products:
- **Bella + Canvas 3001** (Unisex T-shirt): Product ID `71`
  - Variants: S=4012, M=4013, L=4014, XL=4015, 2XL=4016

To find more products:
1. Use Printful API: `GET https://api.printful.com/products`
2. Or browse in Printful Dashboard → Product Catalog

## Step 4: Deploy to Cloudflare Pages

### 4.1 Build the Project

```bash
npm install
npm run build
```

### 4.2 Create Pages Project

Option A: Via Wrangler (CLI)

```bash
npx wrangler pages deploy ./out --project-name=one-drop-threads
```

Option B: Via Dashboard (Recommended)

1. Cloudflare Dashboard → Pages → Create application
2. Connect to Git
3. Select your repository
4. Build settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output: `/out`
5. Deploy

### 4.3 Configure Environment Variables

In Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables:

Add production variables:

```
# Database (already bound via wrangler.toml, but add if needed)
DATABASE_ID=your_d1_database_id

# R2
R2_BUCKET_NAME=one-drop-threads-images
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Printful
PRINTFUL_API_KEY=your_printful_api_key

# Admin
ADMIN_API_KEY=generate_secure_random_32_char_string

# App
NEXT_PUBLIC_BASE_URL=https://your-domain.pages.dev
```

**Important**: Use production keys for production environment!

### 4.4 Bind D1 Database

In `wrangler.toml`, ensure D1 binding is correct:

```toml
[[d1_databases]]
binding = "DB"
database_name = "one-drop-threads-db"
database_id = "YOUR_DATABASE_ID"
```

Then redeploy:

```bash
npx wrangler pages deploy ./out --project-name=one-drop-threads
```

## Step 5: Configure Custom Domain (Optional)

1. Cloudflare Dashboard → Pages → Your Project → Custom domains
2. Add custom domain
3. Follow DNS setup instructions
4. Update `NEXT_PUBLIC_BASE_URL` to your custom domain
5. Update Stripe webhook URL to your custom domain

## Step 6: Test the System

### 6.1 Test Product Creation

1. Visit `https://your-domain.pages.dev/admin?key=YOUR_ADMIN_API_KEY`
2. Upload a test design
3. Fill in details
4. Submit

### 6.2 Test Purchase Flow

1. Visit homepage
2. Click on product
3. Select size
4. Click "Buy This One"
5. Complete Stripe checkout (use test card: 4242 4242 4242 4242)
6. Verify:
   - Redirect to success page
   - Product marked as sold
   - Order appears in admin dashboard
   - Printful order created

### 6.3 Test Webhooks

Use Stripe CLI to test locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Or check webhook logs in Stripe Dashboard → Developers → Webhooks.

## Step 7: Go Live

### 7.1 Switch to Live Mode

1. Replace all test keys with live keys
2. Update webhook endpoint in Stripe to production URL
3. Verify all environment variables

### 7.2 Create First Real Drop

1. Prepare high-quality design (PNG, 2400x3200px recommended)
2. Upload via admin panel
3. Share on social media
4. Monitor sales in admin dashboard

## Troubleshooting

### Database Binding Issues

If you see "Database not available":
- Verify D1 binding in `wrangler.toml`
- Check that migrations ran successfully
- Redeploy: `npx wrangler pages deploy ./out`

### Webhook Not Firing

- Check Stripe webhook logs
- Verify webhook secret matches
- Ensure endpoint is HTTPS (required by Stripe)

### Printful Order Not Created

- Verify API key has correct permissions
- Check variant IDs match your product
- Review logs in Cloudflare Dashboard → Pages → Functions

### R2 Images Not Loading

- Verify R2 bucket has public access enabled
- Check R2 credentials
- Ensure image URLs are correct

## Monitoring

- **Cloudflare Dashboard**: Real-time metrics, logs
- **Stripe Dashboard**: Payment events, webhook status
- **Printful Dashboard**: Order status, fulfillment

## Costs

Approximate monthly costs (solo operation):
- Cloudflare Workers: $5/month
- Cloudflare R2: ~$0.36/GB stored + bandwidth
- Stripe: 2.9% + $0.30 per transaction
- Printful: Cost per item + shipping (no monthly fee)

**Total fixed costs**: ~$5-10/month + per-order fees

## Security Checklist

- ✅ Admin API key is strong (32+ random characters)
- ✅ Environment variables are set in Cloudflare, not in code
- ✅ Stripe webhook signature is verified
- ✅ Production keys are different from test keys
- ✅ R2 bucket access is restricted (or public with unique URLs)

## Next Steps

- Set up email notifications (optional)
- Add analytics (Cloudflare Web Analytics is free)
- Create social media presence
- Design your first drop!

---

**Need help?** Check logs in:
- Cloudflare Dashboard → Pages → Your Project → Functions
- Stripe Dashboard → Developers → Webhooks → Event logs
