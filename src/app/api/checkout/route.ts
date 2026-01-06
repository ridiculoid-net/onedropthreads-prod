import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { getProductById } from '@/lib/db';
import type { CheckoutRequest } from '@/types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { productId, selectedSize } = body;

    if (!productId || !selectedSize) {
      return NextResponse.json(
        { error: 'Missing productId or selectedSize' },
        { status: 400 }
      );
    }

    // Get product from database
    const { DB } = (request as any).env || {};
    if (!DB) {
      throw new Error('Database not available');
    }

    const product = await getProductById(DB, productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== 'available') {
      return NextResponse.json(
        { error: 'Product is no longer available' },
        { status: 410 }
      );
    }

    // Verify size is valid
    const variants = JSON.parse(product.printful_variant_ids);
    const validSize = variants.find((v: any) => v.size === selectedSize);

    if (!validSize) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      productId: product.id,
      productTitle: product.title,
      selectedSize,
      successUrl: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/product/${productId}`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
