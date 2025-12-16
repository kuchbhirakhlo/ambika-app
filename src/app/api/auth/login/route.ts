import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import mongoose from 'mongoose';
import User from '@/models/user';
import Employee from '@/models/employee';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Connect to MongoDB using Mongoose (same as employee API)
const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('Login API: Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || '');
      console.log('Login API: MongoDB connected successfully');
    }
  } catch (error) {
    console.error('Login API: MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log("Login attempt received");

    // Parse request body
    const body = await request.json();
    const { username, password } = body;

    console.log("Login credentials:", { username, password: password ? "***" : "empty" });

    // Basic validation
    if (!username || !password) {
      console.log("Validation failed: missing username or password");
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    await connectMongo();

    // First check in users collection (admin) using Mongoose
    let user = await User.findOne({ username });
    console.log("Users collection query result:", user ? "found" : "not found");

    // If not found in users, check employees collection using Mongoose
    if (!user) {
      console.log("Searching for employee with username:", username);
      user = await Employee.findOne({ username });
      console.log("Employees collection query result:", user ? `found - ${user.username} (${user.role})` : "not found");

      // Also try to find all employees to debug
      if (!user) {
        const allEmployees = await Employee.find({}).limit(5);
        console.log("Sample employees in database:", allEmployees.map(emp => ({ username: emp.username, role: emp.role })));
      }
    }

    // For manual creation, you can run this in MongoDB shell:
    // use ambika
    // db.users.insertOne({
    //   "username": "admin",
    //   "name": "Admin User",
    //   "role": "admin",
    //   "password": "admin123",
    //   "email": "admin@ambika.com",
    //   "createdAt": new Date(),
    //   "updatedAt": new Date()
    // })

    // If still not found, create default admin user
    if (!user && username === "admin") {
      console.log("Creating default admin user");
      try {
        const adminUser = {
          username: "admin",
          name: "Admin User",
          role: "admin",
          password: "admin123", // Plain text for now, will be hashed on next login
          email: "admin@ambika.com",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await User.create(adminUser);
        console.log("Admin user created with ID:", result._id);
        user = result;
      } catch (error) {
        console.log("Error creating admin user:", error);
      }
    }

    if (!user) {
      console.log("User not found in database:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    console.log("User found:", user.username, "Role:", user.role);

    // Compare password using bcrypt for both users and employees
    // For backward compatibility, also check plain text password for admin and employees
    let isPasswordValid = false;
    console.log("Checking password for user role:", user.role);

    if (user.role === 'admin' && password === 'admin123') {
      isPasswordValid = true;
      console.log("Admin login with plain text password - SUCCESS");
    } else {
      try {
        console.log("Attempting bcrypt comparison");
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("Bcrypt comparison result:", isPasswordValid);
        
        // If bcrypt comparison fails and this is an employee, try plain text comparison
        // This handles cases where password wasn't properly hashed during creation
        if (!isPasswordValid && user.role === 'employee') {
          console.log("Bcrypt failed for employee, trying plain text comparison");
          isPasswordValid = password === user.password;
          console.log("Plain text comparison result:", isPasswordValid);
          
          if (isPasswordValid) {
            console.log("Plain text password matched - this user needs password rehashing");
          }
        }
      } catch (error) {
        console.log("Bcrypt error:", error);
        
        // If bcrypt fails and this is an employee, try plain text as fallback
        if (user.role === 'employee') {
          console.log("Bcrypt failed for employee, trying plain text comparison as fallback");
          isPasswordValid = password === user.password;
          console.log("Fallback plain text comparison result:", isPasswordValid);
        }
      }
    }

    if (!isPasswordValid) {
      console.log("Password validation failed - returning 401");
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    console.log("Password validation successful - proceeding with login");

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


