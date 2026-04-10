import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireUser } from '@/lib/auth';
import Shop from '@/models/Shop';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request, ['admin', 'shop_owner']);
    if (error || !user) return error;

    await dbConnect();
    const shops =
      user.role === 'shop_owner' && user.shopId
        ? await Shop.find({ _id: user.shopId })
        : await Shop.find({});
    return NextResponse.json(shops);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireUser(request, ['admin']);
    if (error) return error;

    await dbConnect();
    const body = await request.json();
    const shop = await Shop.create(body);
    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}
