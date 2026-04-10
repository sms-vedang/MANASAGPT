import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireUser } from '@/lib/auth';
import Place from '@/models/Place';

export async function GET() {
  try {
    await dbConnect();
    const places = await Place.find({});
    return NextResponse.json(places);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireUser(request, ['admin']);
    if (error) return error;

    await dbConnect();
    const body = await request.json();
    const place = await Place.create(body);
    return NextResponse.json(place, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create place' }, { status: 500 });
  }
}
