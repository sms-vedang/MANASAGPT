import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Place from '@/models/Place';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const place = await Place.findByIdAndUpdate(id, body, { new: true });
    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }
    return NextResponse.json(place);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update place' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const place = await Place.findByIdAndDelete(id);
    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Place deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete place' }, { status: 500 });
  }
}