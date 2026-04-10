import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { canManageShop, requireUser } from '@/lib/auth';
import Shop from '@/models/Shop';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireUser(request, ['admin', 'shop_owner']);
    if (error || !user) return error;

    await dbConnect();
    const { id } = await params;

    if (!canManageShop(user, id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    const { user, error } = await requireUser(request, ['admin', 'shop_owner']);
    if (error || !user) return error;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    if (!canManageShop(user, id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedUpdates =
      user.role === 'admin'
        ? body
        : {
            name: body.name,
            category: body.category,
            address: body.address,
            phone: body.phone,
            website: body.website,
            tags: body.tags,
          };

    const shop = await Shop.findByIdAndUpdate(id, allowedUpdates, {
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
    const { error } = await requireUser(request, ['admin']);
    if (error) return error;

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
