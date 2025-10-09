import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Agent from '@/models/agent';

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

// GET all agents
export async function GET() {
  try {
    await connectMongo();
    
    const agents = await Agent.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ agents }, { status: 200 });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST new agent
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const data = await request.json();
    
    // Create a new agent with the data
    const newAgent = await Agent.create(data);
    
    return NextResponse.json(
      { message: 'Agent created successfully', agent: newAgent },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating agent:', error);
    
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
} 