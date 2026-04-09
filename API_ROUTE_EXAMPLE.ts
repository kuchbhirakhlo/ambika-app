/**
 * EXAMPLE: Updated API Route with Real-Time Sync
 * 
 * Copy this pattern to your existing API routes to enable real-time sync.
 * Replace src/app/api/products/route.ts with this updated version.
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/product';
import { broadcastChange } from '@/lib/broadcast-sync';

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

// GET all products
export async function GET() {
  try {
    await connectMongo();

    const products = await Product.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST new product - WITH REAL-TIME SYNC
export async function POST(request: NextRequest) {
  try {
    await connectMongo();

    const data = await request.json();

    // Create a new product with the data
    const newProduct = await Product.create(data);

    // ✨ BROADCAST THE CHANGE IN REAL-TIME ✨
    broadcastChange(
      'products',
      'insert',
      newProduct._id.toString(),
      JSON.parse(JSON.stringify(newProduct)) // Convert to plain object
    );

    return NextResponse.json(
      { message: 'Product created successfully', product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);

    // Handle duplicate product code error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A product with this code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT update product - WITH REAL-TIME SYNC
export async function PUT(request: NextRequest) {
  try {
    await connectMongo();

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // ✨ BROADCAST THE CHANGE IN REAL-TIME ✨
    broadcastChange(
      'products',
      'update',
      id,
      JSON.parse(JSON.stringify(updatedProduct)),
      {
        updatedFields: updateData,
        removedFields: [],
      }
    );

    return NextResponse.json(
      { message: 'Product updated successfully', product: updatedProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE product - WITH REAL-TIME SYNC
export async function DELETE(request: NextRequest) {
  try {
    await connectMongo();

    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // ✨ BROADCAST THE CHANGE IN REAL-TIME ✨
    broadcastChange('products', 'delete', id);

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
