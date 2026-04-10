import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { canManageShop, requireUser } from '@/lib/auth';
import Product from '@/models/Product';
import '@/models/Shop';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireUser(request, ['admin', 'shop_owner']);
    if (error || !user) return error;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existingShopId = existingProduct.shopId?.toString();
    if (!canManageShop(user, existingShopId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nextShopId = user.role === 'shop_owner' ? user.shopId : body.shopId ?? existingShopId;
    const product = await Product.findByIdAndUpdate(
      id,
      {
        name: body.name,
        price: body.price,
        category: body.category,
        stock: body.stock ?? 0,
        featured: Boolean(body.featured),
        shopId: nextShopId,
        image: body.image,
      },
      { new: true, runValidators: true }
    ).populate('shopId', 'name');

    return NextResponse.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireUser(request, ['admin', 'shop_owner']);
    if (error || !user) return error;

    await dbConnect();
    const { id } = await params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!canManageShop(user, product.shopId?.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
