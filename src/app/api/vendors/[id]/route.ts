import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/vendors/[id] - Get a vendor by ID
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id;
    
    const { db } = await connectToDatabase();
    const vendor = await db.collection("vendors").findOne({ _id: new ObjectId(id) });
    
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    
    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error getting vendor:", error);
    return NextResponse.json({ error: "Failed to get vendor" }, { status: 500 });
  }
}

// PUT /api/vendors/[id] - Update a vendor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Add updated timestamp
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    const { db } = await connectToDatabase();
    const result = await db.collection("vendors").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    
    // Get updated vendor
    const updatedVendor = await db.collection("vendors").findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

// DELETE /api/vendors/[id] - Delete a vendor
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id;
    
    const { db } = await connectToDatabase();
    const result = await db.collection("vendors").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
} 