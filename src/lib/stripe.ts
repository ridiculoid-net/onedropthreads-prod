import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

export const stripe = STRIPE_SECRET_KEY 
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

export interface CreateCheckoutSessionParams {
  productId: string;
  productTitle: string;
  selectedSize: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  return await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.productTitle,
            description: `Size: ${params.selectedSize}`,
          },
          unit_amount: 3500,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      productId: params.productId,
      selectedSize: params.selectedSize,
    },
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES'],
    },
  });
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}