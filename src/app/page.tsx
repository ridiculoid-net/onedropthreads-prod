'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  description: string;
  mockup_image_url: string;
  status: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-24">
          <p className="text-zinc-500 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">The Drop</h1>
        <p className="text-zinc-400 text-lg">
          Each shirt is a unique design. When it's gone, it's gone forever.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-zinc-500 text-xl">No drops available right now.</p>
          <p className="text-zinc-600 mt-2">Check back soon for new releases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group block animate-fade-in"
            >
              <div className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden mb-4">
                <Image
                  src={product.mockup_image_url}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  ONLY 1 EXISTS
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-1 group-hover:text-zinc-300 transition-colors">
                {product.title}
              </h3>
              <p className="text-zinc-500 text-sm line-clamp-2">{product.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}