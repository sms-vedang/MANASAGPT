import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Ad from '@/models/Ad';
// Import related models so Mongoose registers them before populate runs
import '@/models/Shop';
import '@/models/Product';

export async function GET() {
  try {
    await dbConnect();
    const ads = await Ad.find({}).populate('shopId', 'name').populate('productId', 'name');
    return NextResponse.json(ads);
  } catch (error) {
    console.error('[API /ads GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch ads', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const ad = await Ad.create(body);
    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}