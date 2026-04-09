import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Place from '@/models/Place';

export async function POST() {
  try {
    await dbConnect();

    // Clear existing data
    await Shop.deleteMany({});
    await Product.deleteMany({});
    await Place.deleteMany({});

    // Sample shops
    const shops = await Shop.insertMany([
      {
        name: 'Apollo Pharmacy',
        category: 'medical',
        address: 'Main Road, Datia',
        phone: '1234567890',
        rating: 4.5,
        tags: ['pharmacy', 'medicines'],
        sponsored: true,
        priorityScore: 10,
        verified: true,
      },
      {
        name: 'City Salon',
        category: 'salon',
        address: 'Near Bus Stand, Datia',
        phone: '0987654321',
        rating: 4.2,
        tags: ['haircut', 'beauty'],
        sponsored: false,
        priorityScore: 5,
        verified: true,
      },
      {
        name: 'Tasty Bites Restaurant',
        category: 'restaurant',
        address: 'Market Area, Datia',
        phone: '1122334455',
        rating: 4.0,
        tags: ['food', 'dining'],
        sponsored: false,
        priorityScore: 3,
        verified: false,
      },
    ]);

    // Sample products
    await Product.insertMany([
      {
        name: 'Paracetamol Tablets',
        price: 50,
        shopId: shops[0]._id,
        category: 'medicine',
        featured: true,
        stock: 100,
      },
      {
        name: 'Hair Shampoo',
        price: 200,
        shopId: shops[1]._id,
        category: 'beauty',
        featured: false,
        stock: 50,
      },
      {
        name: 'Chicken Biryani',
        price: 150,
        shopId: shops[2]._id,
        category: 'food',
        featured: true,
        stock: null,
      },
    ]);

    // Sample places
    await Place.insertMany([
      {
        name: 'Pitambara Peeth',
        type: 'temple',
        description: 'Famous temple in Datia',
        timing: '6 AM - 8 PM',
        location: 'Datia Palace Complex',
      },
      {
        name: 'Datia Palace',
        type: 'landmark',
        description: 'Historical palace and tourist spot',
        timing: '9 AM - 5 PM',
        location: 'Datia Fort',
      },
      {
        name: 'City Hospital',
        type: 'government_office',
        description: 'Government hospital serving the city',
        timing: '24/7',
        location: 'Main Road, Datia',
      },
    ]);

    return NextResponse.json({ message: 'Sample data seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}