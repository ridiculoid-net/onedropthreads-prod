'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Product {
  id: string;
  title: string;
  description: string;
  mockup_image_url: string;
  printful_variant_ids: string;
  status: string;
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();

        if (!res.ok || !data.product) {
          router.push('/sold');
          return;
        }

        if (data.product.status !== 'available') {
          router.push('/sold');
          return;
        }

        setProduct(data.product);

        // Set default size
        const variants = JSON.parse(data.product.printful_variant_ids);
        if (variants.length > 0) {
          setSelectedSize(variants[0].size);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id, router]);

  async function handlePurchase() {
    if (!selectedSize || !product) return;

    setPurchasing(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          selectedSize,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError((err as Error).message || 'Purchase failed. Please try again.');
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="h-96 bg-zinc-800 rounded-lg mb-8"></div>
          <div className="h-8 bg-zinc-800 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const variants = JSON.parse(product.printful_variant_ids);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden">
          <Image
            src={product.mockup_image_url}
            alt={product.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Details */}
        <div>
          <div className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
            ONLY 1 EXISTS
          </div>

          <h1 className="text-4xl font-bold mb-4">{product.title}</h1>

          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="border-t border-zinc-800 pt-8 mb-8">
            <p className="text-sm text-zinc-500 mb-4">
              This design will <span className="text-zinc-300 font-semibold">never be sold again</span>.
              Once purchased, it's gone forever.
            </p>
          </div>

          {/* Size Selector */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3">Select Size</label>
            <div className="flex gap-2">
              {variants.map((variant: any) => (
                <button
                  key={variant.size}
                  onClick={() => setSelectedSize(variant.size)}
                  className={`px-6 py-3 border rounded-lg transition-all ${
                    selectedSize === variant.size
                      ? 'border-zinc-100 bg-zinc-100 text-zinc-950 font-semibold'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {variant.size}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-6 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Buy Button */}
          <button
            onClick={handlePurchase}
            disabled={purchasing || !selectedSize}
            className="w-full bg-zinc-100 text-zinc-950 py-4 rounded-lg font-bold text-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purchasing ? 'Processing...' : 'Buy This One — $35'}
          </button>

          <p className="text-xs text-zinc-600 mt-4 text-center">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
