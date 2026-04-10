import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireUser } from '@/lib/auth';
import User from '@/models/User';
import '@/models/Shop';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireUser(request, ['admin']);
    if (error) return error;

    await dbConnect();
    const users = await User.find({}).populate('shopId', 'name category').select('-password');
    return NextResponse.json(users);
  } catch (error) {
    console.error('[API /users GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireUser(request, ['admin']);
    if (error) return error;

    await dbConnect();
    const body = await request.json();

    // Check for existing username
    const exists = await User.findOne({ username: body.username });
    if (exists) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const user = await User.create(body);
    const { password, ...safeUser } = user.toObject();
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error('[API /users POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create user', details: String(error) }, { status: 500 });
  }
}
