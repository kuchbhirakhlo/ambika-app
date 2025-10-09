import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Supplier from '@/models/supplier';
import mongoose from 'mongoose';

// Connect to MongoDB
const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || '');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

// GET all suppliers
export async function GET() {
  try {
    await connectMongo();
    
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ suppliers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST new supplier
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const data = await request.json();
    
    // Create a new supplier with the data
    const newSupplier = await Supplier.create(data);
    
    return NextResponse.json(
      { message: 'Supplier created successfully', supplier: newSupplier },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A supplier with this email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
} 