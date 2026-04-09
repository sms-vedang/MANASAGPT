import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    const user = await User.findOne({ username, password }); // In production, verify hash

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Simple session - in production use JWT
    const response = NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        shopId: user.shopId,
      }
    });

    // Set session cookie
    response.cookies.set('user_session', JSON.stringify({
      id: user._id,
      username: user.username,
      role: user.role,
      shopId: user.shopId,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}