import { NextRequest, NextResponse } from 'next/server';
import { getAvailableProducts } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { DB } = (request as any).env || {};
    if (!DB) {
      throw new Error('Database not available');
    }

    const products = await getAvailableProducts(DB);
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
