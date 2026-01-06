-- One Drop Threads Database Schema

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mockup_image_url TEXT NOT NULL,
  printful_product_id TEXT NOT NULL,
  printful_variant_ids TEXT NOT NULL, -- JSON array of {size: string, variantId: string}
  status TEXT NOT NULL CHECK(status IN ('available', 'sold')) DEFAULT 'available',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  sold_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  product_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_name TEXT NOT NULL,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  selected_size TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('paid', 'fulfilled', 'failed')) DEFAULT 'paid',
  printful_order_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
