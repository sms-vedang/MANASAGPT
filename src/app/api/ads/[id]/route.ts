import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireUser } from '@/lib/auth';
import Ad from '@/models/Ad';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireUser(request, ['admin']);
    if (error) return error;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const ad = await Ad.findByIdAndUpdate(id, body, { new: true });
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    return NextResponse.json(ad);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireUser(request, ['admin']);
    if (error) return error;

    await dbConnect();
    const { id } = await params;
    const ad = await Ad.findByIdAndDelete(id);
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Ad deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
  }
}
