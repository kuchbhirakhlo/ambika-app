import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Estimate from '@/models/estimate';
import Order from '@/models/order';
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

// GET all estimates
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
    
    const estimates = await Estimate.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ estimates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimates' },
      { status: 500 }
    );
  }
}

// POST new estimate
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const data = await request.json();
    
    // Check if order exists
    const order = await Order.findOne({ order_id: data.order_id });
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Generate estimate ID if not provided
    if (!data.estimate_id) {
      // Use a retry loop to avoid duplicate IDs under concurrency
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        // Find the latest estimate_id and increment it
        const lastEstimate = await Estimate.findOne({}).sort({ estimate_id: -1 }).lean();
        const lastNumber = lastEstimate?.estimate_id
          ? parseInt(lastEstimate.estimate_id.replace(/[^\d]/g, ''), 10) || 0
          : 0;
        const nextNumber = lastNumber + 1;
        const nextId = `EST-${String(nextNumber).padStart(3, '0')}`;
        try {
          data.estimate_id = nextId;
          // Attempt create inside the loop so duplicate key throws here
          const newEstimate = await Estimate.create(data);

          // Update the order with the estimate ID and change status
          await Order.findOneAndUpdate(
            { order_id: data.order_id },
            { 
              estimate_id: newEstimate.estimate_id,
              status: 'Pending'
            }
          );
          
          // Broadcast the change to all connected clients
          broadcastChange('estimates', 'insert', newEstimate._id.toString(), newEstimate.toObject());

          return NextResponse.json(
            { message: 'Estimate created successfully', estimate: newEstimate },
            { status: 201 }
          );
        } catch (err: any) {
          // Retry only for duplicate key errors
          if (err?.code === 11000) {
            attempts += 1;
            continue;
          }
          throw err;
        }
      }
      // If we exhaust retries, return a conflict
      return NextResponse.json(
        { error: 'Could not generate a unique estimate ID after multiple attempts' },
        { status: 409 }
      );
    }
    
    // Create a new estimate with the provided estimate_id (if caller set it)
    const newEstimate = await Estimate.create(data);
    
    // Update the order with the estimate ID and change status
    await Order.findOneAndUpdate(
      { order_id: data.order_id },
      { 
        estimate_id: newEstimate.estimate_id,
        status: 'Pending'
      }
    );
    
    // Broadcast the change to all connected clients
    broadcastChange('estimates', 'insert', newEstimate._id.toString(), newEstimate.toObject());
    
    return NextResponse.json(
      { message: 'Estimate created successfully', estimate: newEstimate },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating estimate:', error);
    
    // Handle duplicate estimate ID error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An estimate with this ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create estimate' },
      { status: 500 }
    );
  }
} 