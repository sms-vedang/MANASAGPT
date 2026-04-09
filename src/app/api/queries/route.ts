import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Query from '@/models/Query';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Place from '@/models/Place';
import Ad from '@/models/Ad';

export async function GET() {
  try {
    await dbConnect();

    // Get counts
    const totalShops = await Shop.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalPlaces = await Place.countDocuments();
    const totalQueries = await Query.countDocuments();

    // Get recent queries
    const recentQueries = await Query.find({}).sort({ timestamp: -1 }).limit(10);

    // Get top searched keywords (simple aggregation)
    const topKeywords = await Query.aggregate([
      { $group: { _id: '$userQuery', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get top categories
    const topCategories = await Shop.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get top performing shops (by sponsored or rating)
    const topShops = await Shop.find({ sponsored: true }).limit(5);

    return NextResponse.json({
      metrics: {
        totalShops,
        totalProducts,
        totalPlaces,
        totalQueries,
      },
      recentQueries,
      topKeywords,
      topCategories,
      topShops,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}