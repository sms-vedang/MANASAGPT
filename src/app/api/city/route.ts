import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import City from '@/models/City';

export async function GET() {
  try {
    await dbConnect();
    const city = await City.findOne({}); // Assuming one city for now
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }
    return NextResponse.json(city);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch city' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    // For simplicity, update the existing city or create new
    const existingCity = await City.findOne({});
    let city;
    if (existingCity) {
      city = await City.findByIdAndUpdate(existingCity._id, body, { new: true });
    } else {
      city = await City.create(body);
    }
    return NextResponse.json(city, { status: existingCity ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save city' }, { status: 500 });
  }
}