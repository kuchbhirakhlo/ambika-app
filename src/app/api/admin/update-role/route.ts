import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import mongoose from 'mongoose';
import User from '@/models/user';
import Employee from '@/models/employee';

// Connect to MongoDB
const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Update Role API: Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || '');
      console.log('Update Role API: MongoDB connected successfully');
    }
  } catch (error) {
    console.error('Update Role API: MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('=== UPDATE USER ROLE API CALLED ===');

    const body = await request.json();
    const { username, newRole } = body;

    if (!username || !newRole) {
      return NextResponse.json(
        { error: 'Username and newRole are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'employee'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "employee"' },
        { status: 400 }
      );
    }

    await connectMongo();

    // Try to find user in both collections
    let user = await User.findOne({ username });
    let collection = 'users';

    if (!user) {
      user = await Employee.findOne({ username });
      collection = 'employees';
    }

    if (!user) {
      return NextResponse.json(
        { error: `User "${username}" not found` },
        { status: 404 }
      );
    }

    console.log(`Found user ${username} in ${collection} collection with role: ${user.role}`);

    // Update the role
    user.role = newRole;
    user.updatedAt = new Date();
    await user.save();

    console.log(`Updated user ${username} role to: ${newRole}`);

    return NextResponse.json({
      success: true,
      message: `User "${username}" role updated to "${newRole}"`,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        collection: collection
      }
    });

  } catch (error) {
    console.error('Update role error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update user role', details: errorMessage },
      { status: 500 }
    );
  }
}
