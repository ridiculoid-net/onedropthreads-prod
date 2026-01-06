import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { createPrintfulOrder } from '@/lib/printful';
import {
  getProductById,
  lockProductForPurchase,
  createOrder,
  getOrderBySessionId,
  updateOrderPrintfulId,
} from '@/lib/db';
import type { PrintfulVariant } from '@/types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Verify webhook signature
    const event = constructWebhookEvent(body, signature, webhookSecret);

    // Get database binding
    const { DB } = (request as any).env || {};
    if (!DB) {
      throw new Error('Database not available');
    }

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await handleCheckoutCompleted(DB, session);
        break;
      }

      case 'payment_intent.succeeded': {
        // Optional: Add additional logging or processing
        console.log('Payment succeeded:', event.data.object.id);
        break;
      }

      case 'payment_intent.failed': {
        // Optional: Handle failed payments
        console.error('Payment failed:', event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(db: D1Database, session: any) {
  const { id: sessionId, metadata, customer_details, shipping_details, payment_intent } = session;

  // Idempotency check: don't process if order already exists
  const existingOrder = await getOrderBySessionId(db, sessionId);
  if (existingOrder) {
    console.log(`Order already exists for session ${sessionId}`);
    return;
  }

  const productId = metadata.productId;
  const selectedSize = metadata.selectedSize;

  // Lock product (prevents race conditions)
  const locked = await lockProductForPurchase(db, productId);
  if (!locked) {
    throw new Error(`Product ${productId} is no longer available`);
  }

  // Get product details
  const product = await getProductById(db, productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Get correct Printful variant for selected size
  const variants: PrintfulVariant[] = JSON.parse(product.printful_variant_ids);
  const variant = variants.find((v) => v.size === selectedSize);
  if (!variant) {
    throw new Error(`Variant for size ${selectedSize} not found`);
  }

  // Create Printful order
  const printfulOrder = await createPrintfulOrder({
    recipient: {
      name: shipping_details.name,
      address1: shipping_details.address.line1,
      address2: shipping_details.address.line2 || undefined,
      city: shipping_details.address.city,
      state_code: shipping_details.address.state || undefined,
      country_code: shipping_details.address.country,
      zip: shipping_details.address.postal_code,
    },
    items: [
      {
        variant_id: variant.variantId,
        quantity: 1,
      },
    ],
  });

  // Create order in database
  await createOrder(db, {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    stripe_session_id: sessionId,
    stripe_payment_intent_id: payment_intent,
    product_id: productId,
    customer_email: customer_details.email,
    shipping_name: shipping_details.name,
    shipping_line1: shipping_details.address.line1,
    shipping_line2: shipping_details.address.line2 || null,
    shipping_city: shipping_details.address.city,
    shipping_state: shipping_details.address.state || null,
    shipping_postal_code: shipping_details.address.postal_code,
    shipping_country: shipping_details.address.country,
    selected_size: selectedSize,
    status: 'fulfilled',
    printful_order_id: printfulOrder.id,
  });

  console.log(`Order created successfully for product ${productId}`);
}
