import { NextResponse } from "next/server";
import mongoose from 'mongoose';
import User from '@/models/user';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Create Admin API: Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || '');
      console.log('Create Admin API: MongoDB connected successfully');
    }
  } catch (error) {
    console.error('Create Admin API: MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

export async function POST() {
  try {
    console.log('=== CREATE ADMIN API CALLED ===');

    await connectMongo();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    console.log('Existing admin check:', existingAdmin ? 'found' : 'not found');

    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin);
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        user: {
          id: existingAdmin._id,
          username: existingAdmin.username,
          role: existingAdmin.role,
          email: existingAdmin.email
        }
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = {
      username: 'admin',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@ambika.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await User.create(adminUser);
    console.log('Admin user created:', result);

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: result._id,
        username: result.username,
        role: result.role,
        email: result.email
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create admin user', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('=== CHECK ADMIN API CALLED ===');

    await connectMongo();

    // Get all users
    const users = await User.find({}, { password: 0 }); // Exclude password field
    console.log('All users in database:', users);

    return NextResponse.json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('Check admin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to check users', details: errorMessage },
      { status: 500 }
    );
  }
}
