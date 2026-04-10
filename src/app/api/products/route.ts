import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import '@/models/Shop';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const shopId = request.nextUrl.searchParams.get('shopId');
    const query = shopId ? { shopId } : {};
    const products = await Product.find(query)
      .populate('shopId', 'name')
      .sort({ featured: -1, createdAt: -1, name: 1 });
    return NextResponse.json(products);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const product = await Product.create({
      name: body.name,
      price: body.price,
      shopId: body.shopId,
      category: body.category,
      featured: Boolean(body.featured),
      stock: body.stock ?? 0,
      image: body.image,
    });
    await product.populate('shopId', 'name');
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
