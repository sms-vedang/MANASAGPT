import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

// POST /api/orders — place a new order
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      productId, productName, productPrice,
      shopId, shopName,
      customerName, customerPhone, customerAddress,
      quantity = 1, note,
    } = body;

    if (!productName || !shopName || !customerName || !customerPhone || !customerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const totalPrice = (Number(productPrice) || 0) * qty;

    const order = await Order.create({
      productId: productId || undefined,
      productName,
      productPrice: Number(productPrice) || 0,
      shopId: shopId || undefined,
      shopName,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      quantity: qty,
      totalPrice,
      note: note?.trim() || undefined,
      status: 'pending',
    });

    return NextResponse.json({ success: true, orderId: order._id, order }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

// GET /api/orders — list all orders (admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

    const filter: Record<string, string> = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// PATCH /api/orders?id=xxx — update order status
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

    const { status } = await request.json();
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
