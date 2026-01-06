import type { Product, Order } from '@/types';

// Note: In Cloudflare Pages, getRequestContext() is used to access bindings
// This file provides helper functions that accept the DB binding directly

export async function getAvailableProducts(db: D1Database): Promise<Product[]> {
  const results = await db
    .prepare('SELECT * FROM products WHERE status = ? ORDER BY created_at DESC')
    .bind('available')
    .all();

  return results.results as Product[];
}

export async function getProductById(db: D1Database, id: string): Promise<Product | null> {
  const result = await db
    .prepare('SELECT * FROM products WHERE id = ?')
    .bind(id)
    .first();

  return result as Product | null;
}

export async function createProduct(db: D1Database, product: Omit<Product, 'created_at' | 'sold_at'>): Promise<Product> {
  await db
    .prepare(`
      INSERT INTO products (id, title, description, mockup_image_url, printful_product_id, printful_variant_ids, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      product.id,
      product.title,
      product.description,
      product.mockup_image_url,
      product.printful_product_id,
      product.printful_variant_ids,
      product.status
    )
    .run();

  return getProductById(db, product.id) as Promise<Product>;
}

export async function markProductAsSold(db: D1Database, productId: string): Promise<void> {
  await db
    .prepare('UPDATE products SET status = ?, sold_at = unixepoch() WHERE id = ?')
    .bind('sold', productId)
    .run();
}

export async function createOrder(db: D1Database, order: Omit<Order, 'created_at' | 'updated_at'>): Promise<Order> {
  await db
    .prepare(`
      INSERT INTO orders (
        id, stripe_session_id, stripe_payment_intent_id, product_id,
        customer_email, shipping_name, shipping_line1, shipping_line2,
        shipping_city, shipping_state, shipping_postal_code, shipping_country,
        selected_size, status, printful_order_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      order.id,
      order.stripe_session_id,
      order.stripe_payment_intent_id,
      order.product_id,
      order.customer_email,
      order.shipping_name,
      order.shipping_line1,
      order.shipping_line2,
      order.shipping_city,
      order.shipping_state,
      order.shipping_postal_code,
      order.shipping_country,
      order.selected_size,
      order.status,
      order.printful_order_id
    )
    .run();

  const result = await db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(order.id)
    .first();

  return result as Order;
}

export async function getOrderBySessionId(db: D1Database, sessionId: string): Promise<Order | null> {
  const result = await db
    .prepare('SELECT * FROM orders WHERE stripe_session_id = ?')
    .bind(sessionId)
    .first();

  return result as Order | null;
}

export async function updateOrderPrintfulId(db: D1Database, orderId: string, printfulOrderId: string): Promise<void> {
  await db
    .prepare('UPDATE orders SET printful_order_id = ?, status = ?, updated_at = unixepoch() WHERE id = ?')
    .bind(printfulOrderId, 'fulfilled', orderId)
    .run();
}

export async function getAllOrders(db: D1Database): Promise<Order[]> {
  const results = await db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC')
    .all();

  return results.results as Order[];
}

// Lock product for purchase (prevents race conditions)
export async function lockProductForPurchase(db: D1Database, productId: string): Promise<boolean> {
  const result = await db
    .prepare('UPDATE products SET status = ? WHERE id = ? AND status = ?')
    .bind('sold', productId, 'available')
    .run();

  return result.meta.changes > 0;
}
