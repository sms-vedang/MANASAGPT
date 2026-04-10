import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireUser } from '@/lib/auth';
import Product from '@/models/Product';
import '@/models/Shop';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request, ['admin', 'shop_owner']);
    if (error || !user) return error;

    await dbConnect();
    const requestedShopId = request.nextUrl.searchParams.get('shopId');
    const shopId = user.role === 'shop_owner' ? user.shopId : requestedShopId;
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
    const { user, error } = await requireUser(request, ['admin', 'shop_owner']);
    if (error || !user) return error;

    await dbConnect();
    const body = await request.json();
    const shopId = user.role === 'shop_owner' ? user.shopId : body.shopId;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    if (user.role === 'shop_owner' && body.shopId && body.shopId !== user.shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await Product.create({
      name: body.name,
      price: body.price,
      shopId,
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
