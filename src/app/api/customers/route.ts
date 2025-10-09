import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Customer from '@/models/customer';

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

// GET all customers
export async function GET() {
  try {
    await connectMongo();
    
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST new customer
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const data = await request.json();
    
    // Create a new customer with the data
    const newCustomer = await Customer.create(data);
    
    return NextResponse.json(
      { message: 'Customer created successfully', customer: newCustomer },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating customer:', error);
    
    // Handle duplicate customer ID error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A customer with this ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
} 