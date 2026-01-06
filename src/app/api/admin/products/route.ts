import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getAvailableProducts } from '@/lib/db';
import { uploadDesignFile, createPrintfulProduct } from '@/lib/printful';
import { uploadImage, generateImageKey } from '@/lib/r2';

export const runtime = 'edge';

function verifyAdminKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('key');
  return apiKey === process.env.ADMIN_API_KEY;
}

// GET: List all available products (for admin view)
export async function GET(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { DB } = (request as any).env || {};
    if (!DB) {
      throw new Error('Database not available');
    }

    const products = await getAvailableProducts(DB);
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: Create new product
export async function POST(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const designFile = formData.get('designFile') as File;
    const printfulBaseProductId = formData.get('printfulBaseProductId') as string;
    const availableSizes = JSON.parse(formData.get('availableSizes') as string);

    if (!title || !description || !designFile || !printfulBaseProductId || !availableSizes?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get database binding
    const { DB } = (request as any).env || {};
    if (!DB) {
      throw new Error('Database not available');
    }

    // Generate product ID
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 1. Upload design to Printful
    const fileBuffer = Buffer.from(await designFile.arrayBuffer());
    const printfulFile = await uploadDesignFile(fileBuffer, designFile.name);

    // 2. Create Printful product with variants
    const printfulProduct = await createPrintfulProduct(
      title,
      printfulBaseProductId,
      printfulFile.id,
      availableSizes
    );

    // 3. Upload mockup image to R2
    const imageKey = generateImageKey(productId, designFile.name);
    const mockupUrl = await uploadImage(fileBuffer, imageKey, designFile.type);

    // 4. Create product in database
    const product = await createProduct(DB, {
      id: productId,
      title,
      description,
      mockup_image_url: mockupUrl,
      printful_product_id: printfulProduct.productId,
      printful_variant_ids: JSON.stringify(printfulProduct.variants),
      status: 'available',
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: (error as Error).message },
      { status: 500 }
    );
  }
}
