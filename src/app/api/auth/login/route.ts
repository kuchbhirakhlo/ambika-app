import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { username, password } = body;

    // Basic validation
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Compare password (in a real app, use bcrypt.compare)
    const isPasswordValid = password === user.password; // Temporary for demo
    // For production: const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      { expiresIn: "1d" }
    );

    // Create user object without sensitive information
    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    };

    // Create response with token
    return NextResponse.json(
      { 
        success: true,
        user: userResponse,
        token,
        message: "Login successful"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server error during login" },
      { status: 500 }
    );
  }
} 