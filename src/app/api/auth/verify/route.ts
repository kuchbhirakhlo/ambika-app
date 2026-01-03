import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import mongoose from 'mongoose';
import User from '@/models/user';
import Employee from '@/models/employee';
import jwt from "jsonwebtoken";

// Connect to MongoDB using Mongoose
const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Verify API: Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || '');
      console.log('Verify API: MongoDB connected successfully');
    }
  } catch (error) {
    console.error('Verify API: MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log("Token verification request received");

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No authorization header or invalid format");
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log("Token received for verification");

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-key-change-in-production") as any;
      console.log("Token decoded successfully:", { id: decoded.id, username: decoded.username, role: decoded.role });
    } catch (error) {
      console.log("Token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    await connectMongo();

    // Find user by ID and role
    let user;
    if (decoded.role === 'admin') {
      user = await User.findById(decoded.id);
    } else if (decoded.role === 'employee') {
      user = await Employee.findById(decoded.id);
    }

    if (!user) {
      console.log("User not found in database:", decoded.id);
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    console.log("User verified successfully:", user.username, "Role:", user.role);

    // Return user data
    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    };

    return NextResponse.json(
      {
        success: true,
        user: userResponse
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Server error during token verification" },
      { status: 500 }
    );
  }
}
