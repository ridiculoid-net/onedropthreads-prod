import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="mb-8">
        <div className="inline-block bg-green-950 rounded-full p-6 mb-6">
          <svg
            className="w-16 h-16 text-green-400"
            fill="none"
            strokeWidth="2"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-4">It's Yours!</h1>

      <p className="text-zinc-400 text-lg mb-8">
        Congratulations! You now own a one-of-a-kind design.
      </p>

      <div className="bg-zinc-900 rounded-lg p-6 mb-8 text-left">
        <h2 className="font-semibold mb-3">What happens next?</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✓</span>
            <span>Your order has been sent to our fulfillment partner</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✓</span>
            <span>You'll receive a confirmation email with tracking info</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✓</span>
            <span>Your shirt will be printed and shipped within 3-5 business days</span>
          </li>
        </ul>
      </div>

      <p className="text-zinc-500 text-sm mb-8">
        This design has been permanently removed from our store. No one else will ever own it.
      </p>

      <Link
        href="/"
        className="inline-block bg-zinc-100 text-zinc-950 px-8 py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
      >
        Browse More Drops
      </Link>
    </div>
  );
}
