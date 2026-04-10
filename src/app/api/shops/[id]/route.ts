import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shop from '@/models/Shop';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const shop = await Shop.findById(id);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    return NextResponse.json(shop);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const shop = await Shop.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    return NextResponse.json(shop);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update shop';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const shop = await Shop.findByIdAndDelete(id);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Shop deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
  }
}
