import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Place from '@/models/Place';
import Ad from '@/models/Ad';
import User from '@/models/User';

export async function POST() {
  try {
    await dbConnect();

    // Clear existing data
    await Shop.deleteMany({});
    await Product.deleteMany({});
    await Place.deleteMany({});
    await Ad.deleteMany({});
    await User.deleteMany({});

    // Sample shops
    const shops = await Shop.insertMany([
      {
        name: 'Apollo Pharmacy',
        category: 'medical',
        address: 'Main Road, Manasa',
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
        address: 'Near Bus Stand, Manasa',
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
        address: 'Market Area, Manasa',
        phone: '1122334455',
        rating: 4.0,
        tags: ['food', 'dining'],
        sponsored: false,
        priorityScore: 3,
        verified: false,
      },
    ]);

    // Sample products
    const products = await Product.insertMany([
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
        description: 'Famous temple in Manasa',
        timing: '6 AM - 8 PM',
        location: 'Manasa Palace Complex',
      },
      {
        name: 'Manasa Palace',
        type: 'landmark',
        description: 'Historical palace and tourist spot',
        timing: '9 AM - 5 PM',
        location: 'Manasa Fort',
      },
      {
        name: 'City Hospital',
        type: 'government_office',
        description: 'Government hospital serving the city',
        timing: '24/7',
        location: 'Main Road, Manasa',
      },
    ]);

    // Sample ads
    await Ad.insertMany([
      {
        type: 'sponsored',
        priority: 5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        content: 'Best pharmacy in town with 24/7 service',
        shopId: shops[0]._id,
      },
      {
        type: 'banner',
        priority: 8,
        startDate: new Date(),
        content: 'Welcome to ManasaGPT - Your City Assistant',
        image: '/banner-welcome.jpg',
      },
      {
        type: 'featured',
        priority: 3,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        content: 'Premium hair care products now available',
        productId: products[1]._id,
      },
    ]);

    // Sample users
    await User.insertMany([
      {
        username: 'admin',
        password: 'admin123', // In production, hash this
        role: 'admin',
      },
      {
        username: 'shop_owner',
        password: 'shop123',
        role: 'shop_owner',
        shopId: shops[0]._id,
      },
      {
        username: 'data_entry',
        password: 'data123',
        role: 'data_entry',
      },
    ]);

    return NextResponse.json({ message: 'Sample data seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}