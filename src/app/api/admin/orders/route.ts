import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '@/lib/db';

export const runtime = 'edge';

function verifyAdminKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('key');
  return apiKey === process.env.ADMIN_API_KEY;
}

export async function GET(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { DB } = (request as any).env || {};
    if (!DB) {
      throw new Error('Database not available');
    }

    const orders = await getAllOrders(DB);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
