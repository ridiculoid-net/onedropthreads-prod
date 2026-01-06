import Link from 'next/link';

export default function SoldPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="mb-8">
        <div className="inline-block bg-zinc-800 rounded-full p-6 mb-6">
          <svg
            className="w-16 h-16 text-zinc-500"
            fill="none"
            strokeWidth="2"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-4">This One's Gone</h1>

      <p className="text-zinc-400 text-lg mb-8">
        This design has been sold. It will never be available again.
      </p>

      <p className="text-zinc-500 mb-12">
        That's the beauty of One Drop Threads — each piece is truly one-of-a-kind.
      </p>

      <Link
        href="/"
        className="inline-block bg-zinc-100 text-zinc-950 px-8 py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
      >
        Browse Available Drops
      </Link>
    </div>
  );
}
