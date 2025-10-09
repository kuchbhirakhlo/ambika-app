import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const vendors = await db.collection("vendors").find({}).toArray();
    
    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error getting vendors:", error);
    return NextResponse.json({ error: "Failed to get vendors" }, { status: 500 });
  }
}

// POST /api/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Add timestamps
    const now = new Date().toISOString();
    const vendorData = {
      ...body,
      created_at: now,
      updated_at: now
    };
    
    const { db } = await connectToDatabase();
    const result = await db.collection("vendors").insertOne(vendorData);
    
    // Return created vendor with ID
    const newVendor = {
      ...vendorData,
      id: result.insertedId.toString()
    };
    
    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error("Error adding vendor:", error);
    return NextResponse.json({ error: "Failed to add vendor" }, { status: 500 });
  }
} 