'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Order {
  id: string;
  customer_email: string;
  product_id: string;
  selected_size: string;
  status: string;
  created_at: number;
}

export default function AdminPage() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('key');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);

  useEffect(() => {
    if (!apiKey) {
      setError('Unauthorized: Missing API key');
      setLoading(false);
      return;
    }

    async function fetchOrders() {
      try {
        const res = await fetch(`/api/admin/orders?key=${apiKey}`);
        if (!res.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [apiKey]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!apiKey) {
      setError('Unauthorized');
      return;
    }

    if (!title || !description || !designFile) {
      setError('Please fill all fields');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('designFile', designFile);
      formData.append('printfulBaseProductId', '71'); // Bella + Canvas 3001
      formData.append('availableSizes', JSON.stringify(sizes));

      const res = await fetch(`/api/admin/products?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setDesignFile(null);
      setSizes(['S', 'M', 'L', 'XL']);

      alert('Product created successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (!apiKey) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-6 text-red-200">
          <h2 className="font-bold mb-2">Unauthorized</h2>
          <p>Access this page with: <code>/admin?key=YOUR_API_KEY</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Upload New Product */}
      <div className="bg-zinc-900 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">Add New Drop</h2>

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500"
              placeholder="Cosmic Dreams #1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500"
              placeholder="A unique design inspired by..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Design File (PNG)</label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-zinc-700 file:text-zinc-100 hover:file:bg-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Available Sizes</label>
            <div className="flex gap-2">
              {['S', 'M', 'L', 'XL', '2XL'].map((size) => (
                <label key={size} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sizes.includes(size)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSizes([...sizes, size]);
                      } else {
                        setSizes(sizes.filter((s) => s !== size));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{size}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-zinc-100 text-zinc-950 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Creating Product...' : 'Create Product'}
          </button>
        </form>
      </div>

      {/* Orders List */}
      <div className="bg-zinc-900 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Orders</h2>

        {loading ? (
          <p className="text-zinc-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-zinc-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="pb-3 text-sm font-semibold">Order ID</th>
                  <th className="pb-3 text-sm font-semibold">Customer</th>
                  <th className="pb-3 text-sm font-semibold">Product</th>
                  <th className="pb-3 text-sm font-semibold">Size</th>
                  <th className="pb-3 text-sm font-semibold">Status</th>
                  <th className="pb-3 text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-800/50">
                    <td className="py-4 text-sm font-mono text-zinc-400">
                      {order.id.substring(0, 12)}...
                    </td>
                    <td className="py-4 text-sm">{order.customer_email}</td>
                    <td className="py-4 text-sm font-mono text-zinc-400">
                      {order.product_id.substring(0, 12)}...
                    </td>
                    <td className="py-4 text-sm">{order.selected_size}</td>
                    <td className="py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'fulfilled'
                            ? 'bg-green-950 text-green-300'
                            : order.status === 'paid'
                            ? 'bg-blue-950 text-blue-300'
                            : 'bg-red-950 text-red-300'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-zinc-400">
                      {new Date(order.created_at * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
