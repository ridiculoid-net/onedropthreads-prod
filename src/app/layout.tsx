import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'One Drop Threads',
  description: 'Unique designs. Sold once. Never restocked.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm fixed top-0 w-full z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <a href="/" className="text-2xl font-bold tracking-tight">
              ONE DROP THREADS
            </a>
            <p className="text-xs text-zinc-500 mt-1">Each design exists only once</p>
          </div>
        </nav>
        <main className="pt-24 min-h-screen">{children}</main>
        <footer className="border-t border-zinc-800 mt-24">
          <div className="max-w-7xl mx-auto px-6 py-12 text-center text-zinc-500 text-sm">
            <p>© 2024 One Drop Threads. All designs are one-of-a-kind.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
