import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/db';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { DB } = (request as any).env || {};
    if (!DB) {
      throw new Error('Database not available');
    }

    const product = await getProductById(DB, params.id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
