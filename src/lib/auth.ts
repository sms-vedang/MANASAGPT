import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export type AppRole = 'admin' | 'shop_owner' | 'data_entry';

export type SessionUser = {
  id: string;
  username: string;
  role: AppRole;
  shopId?: string;
};

function parseSessionCookie(request: NextRequest) {
  const session = request.cookies.get('user_session');

  if (!session?.value) {
    return null;
  }

  try {
    return JSON.parse(session.value) as Partial<SessionUser>;
  } catch {
    return null;
  }
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const sessionUser = parseSessionCookie(request);

  if (!sessionUser?.id) {
    return null;
  }

  await dbConnect();

  const user = await User.findById(sessionUser.id)
    .select('_id username role shopId')
    .lean<{
      _id: { toString(): string };
      username: string;
      role: AppRole;
      shopId?: { toString(): string } | string | null;
    } | null>();

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    shopId: user.shopId ? user.shopId.toString() : undefined,
  };
}

export async function requireUser(request: NextRequest, allowedRoles?: AppRole[]) {
  const user = await getSessionUser(request);

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user, error: null };
}

export function canManageShop(user: SessionUser, shopId?: string | null) {
  if (!shopId) return false;
  if (user.role === 'admin') return true;
  return user.role === 'shop_owner' && user.shopId === shopId;
}
