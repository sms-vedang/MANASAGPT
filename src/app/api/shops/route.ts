import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shop from '@/models/Shop';

export async function GET() {
  try {
    await dbConnect();
    const shops = await Shop.find({});
    return NextResponse.json(shops);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const shop = await Shop.create(body);
    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}