import type { PrintfulCreateOrderRequest } from '@/types';

const PRINTFUL_API_BASE = 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || '';

async function printfulRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!PRINTFUL_API_KEY) {
    throw new Error('PRINTFUL_API_KEY not configured');
  }
  
  const response = await fetch(`${PRINTFUL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Printful API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.result || data;
}

export async function uploadDesignFile(file: Buffer, fileName: string): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append('file', new Blob([file]), fileName);

  const response = await fetch(`${PRINTFUL_API_BASE}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload design: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

export async function createPrintfulProduct(
  title: string,
  printfulBaseProductId: string,
  designFileId: string,
  availableSizes: string[]
): Promise<{ productId: string; variants: Array<{ size: string; variantId: string }> }> {
  const product = await printfulRequest<any>('/store/products', {
    method: 'POST',
    body: JSON.stringify({
      sync_product: {
        name: title,
      },
      sync_variants: availableSizes.map(size => ({
        retail_price: '35.00',
        variant_id: getVariantIdForSize(printfulBaseProductId, size),
        files: [
          {
            id: designFileId,
            type: 'default',
          },
        ],
      })),
    }),
  });

  return {
    productId: product.sync_product.id,
    variants: product.sync_variants.map((v: any) => ({
      size: getSizeFromVariantId(v.variant_id),
      variantId: v.id,
    })),
  };
}

export async function createPrintfulOrder(orderData: PrintfulCreateOrderRequest): Promise<{ id: string }> {
  const order = await printfulRequest<any>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });

  return { id: order.id };
}

function getVariantIdForSize(baseProductId: string, size: string): string {
  const bellaCanvas3001: Record<string, string> = {
    'S': '4012',
    'M': '4013',
    'L': '4014',
    'XL': '4015',
    '2XL': '4016',
  };

  const variantMaps: Record<string, Record<string, string>> = {
    '71': bellaCanvas3001,
  };

  const map = variantMaps[baseProductId];
  if (!map || !map[size]) {
    throw new Error(`Unknown variant for product ${baseProductId}, size ${size}`);
  }

  return map[size];
}

function getSizeFromVariantId(variantId: string): string {
  const idToSize: Record<string, string> = {
    '4012': 'S',
    '4013': 'M',
    '4014': 'L',
    '4015': 'XL',
    '4016': '2XL',
  };

  return idToSize[variantId] || 'Unknown';
}