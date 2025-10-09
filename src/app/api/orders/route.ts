import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Order from '@/models/order';

// Connect to MongoDB
const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        console.error('MongoDB URI is not defined in environment variables');
        throw new Error('MongoDB URI is missing');
      }
      
      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully!');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

// GET all orders
export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    
    // Get query parameters for basic filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const customerName = url.searchParams.get('customer');
    
    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (customerName) query.customer_name = { $regex: customerName, $options: 'i' };
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST new order
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const data = await request.json();
    
    // Generate order ID if not provided
    if (!data.order_id) {
      // Get count of orders to generate a sequential ID
      const count = await Order.countDocuments();
      data.order_id = `ORD-${String(count + 1).padStart(3, '0')}`;
    }
    
    // Create a new order with the data
    const newOrder = await Order.create(data);
    
    return NextResponse.json(
      { message: 'Order created successfully', order: newOrder },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // Handle duplicate order ID error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An order with this ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 