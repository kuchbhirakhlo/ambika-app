import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Estimate from '@/models/estimate';
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

// GET a specific estimate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    
    const { id } = params;
    
    // First try to find by MongoDB _id
    let estimate = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      estimate = await Estimate.findById(id);
    }
    
    // If not found, try to find by estimate_id field
    if (!estimate) {
      estimate = await Estimate.findOne({ estimate_id: id });
    }
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ estimate }, { status: 200 });
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimate' },
      { status: 500 }
    );
  }
}

// PUT/PATCH to update an estimate
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    
    const { id } = params;
    const data = await request.json();
    
    // Find estimate by MongoDB _id or estimate_id
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { estimate_id: id };
    }
    
    const updatedEstimate = await Estimate.findOneAndUpdate(
      query,
      data,
      { new: true, runValidators: true }
    );
    
    if (!updatedEstimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }
    
    // If status changed to Completed, update the corresponding order
    if (data.status === 'Completed') {
      await Order.findOneAndUpdate(
        { order_id: updatedEstimate.order_id },
        { status: 'Completed' }
      );
    }
    
    return NextResponse.json(
      { message: 'Estimate updated successfully', estimate: updatedEstimate },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating estimate:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An estimate with this ID already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update estimate' },
      { status: 500 }
    );
  }
}

// DELETE an estimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    
    const { id } = params;
    
    // Find estimate by MongoDB _id or estimate_id
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { estimate_id: id };
    }
    
    const deletedEstimate = await Estimate.findOneAndDelete(query);
    
    if (!deletedEstimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }
    
    // Update the corresponding order to remove estimate reference
    await Order.findOneAndUpdate(
      { order_id: deletedEstimate.order_id },
      { 
        estimate_id: null,
        status: 'No Estimate'
      }
    );
    
    return NextResponse.json(
      { message: 'Estimate deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimate' },
      { status: 500 }
    );
  }
} 