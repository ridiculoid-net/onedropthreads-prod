# Quick Start Guide

Get One Drop Threads running in 15 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Cloudflare

```bash
# Create database
npx wrangler d1 create one-drop-threads-db

# Copy the database_id to wrangler.toml

# Run migrations
npx wrangler d1 execute one-drop-threads-db --remote --file=./schema.sql

# Create R2 bucket
npx wrangler r2 bucket create one-drop-threads-images
```

## 3. Get API Keys

### Stripe
1. https://dashboard.stripe.com/apikeys
2. Copy publishable and secret keys
3. Set up webhook: https://dashboard.stripe.com/webhooks

### Printful
1. https://www.printful.com/dashboard/settings#section_api
2. Create API key

### R2
1. Cloudflare Dashboard → R2 → API Tokens
2. Create token with read/write permissions

## 4. Configure Environment

Create `.env.local`:

```env
DATABASE_ID=your_d1_db_id
R2_BUCKET_NAME=one-drop-threads-images
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PRINTFUL_API_KEY=your_key

ADMIN_API_KEY=create_random_32_char_string

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 5. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000

## 6. Deploy

```bash
npm run build
npx wrangler pages deploy ./out --project-name=one-drop-threads
```

## 7. Add First Product

1. Visit https://your-site.pages.dev/admin?key=YOUR_ADMIN_API_KEY
2. Upload design (PNG recommended)
3. Fill form
4. Submit

## 8. Test Purchase

1. Visit homepage
2. Click product
3. Select size
4. Buy (use test card: 4242 4242 4242 4242)
5. Check admin dashboard for order

## Done!

Your store is live. Now:
- Add more designs
- Share on social media
- Watch orders roll in

For detailed instructions, see:
- **README.md** - Full documentation
- **DEPLOYMENT.md** - Production deployment
- **NOTES.md** - Architecture details

## Troubleshooting

**Can't see products?**
- Check D1 migrations ran successfully
- Verify product status is 'available'

**Webhook not working?**
- Verify webhook secret in .env
- Check webhook logs in Stripe Dashboard

**Images not loading?**
- Enable R2 public access
- Verify R2 credentials

**Admin page unauthorized?**
- Check ADMIN_API_KEY matches URL param

Need help? Review the logs:
```bash
npx wrangler pages deployment tail
```
