export interface Product {
  id: string;
  title: string;
  description: string;
  mockup_image_url: string;
  printful_product_id: string;
  printful_variant_ids: string; // JSON string: Array<{size: string, variantId: string}>
  status: 'available' | 'sold';
  created_at: number;
  sold_at: number | null;
}

export interface Order {
  id: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  product_id: string;
  customer_email: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string | null;
  shipping_postal_code: string;
  shipping_country: string;
  selected_size: string;
  status: 'paid' | 'fulfilled' | 'failed';
  printful_order_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface PrintfulVariant {
  size: string;
  variantId: string;
}

export interface CreateProductInput {
  title: string;
  description: string;
  designFile: File;
  printfulBaseProductId: string;
  availableSizes: string[];
}

export interface CheckoutRequest {
  productId: string;
  selectedSize: string;
}

export interface PrintfulOrderRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  zip: string;
}

export interface PrintfulOrderItem {
  variant_id: string;
  quantity: number;
}

export interface PrintfulCreateOrderRequest {
  recipient: PrintfulOrderRecipient;
  items: PrintfulOrderItem[];
}
