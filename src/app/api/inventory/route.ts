import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/inventory - Get all inventory items
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get inventory items
    const inventory = await db.collection("inventory").find({}).toArray();
    
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error("Error getting inventory:", error);
    return NextResponse.json({ error: "Failed to get inventory" }, { status: 500 });
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      product_id, 
      product_code, 
      product_name,
      size,
      category,
      quantity, 
      price,
      location 
    } = body;
    
    if (!product_id || !product_name || quantity == null) {
      return NextResponse.json(
        { error: "Product ID, product name and quantity are required" },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if product exists
    let productObjectId;
    try {
      productObjectId = new ObjectId(product_id);
    } catch (e) {
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
    }
    
    // Check if inventory item already exists
    const existingItem = await db.collection("inventory").findOne({ 
      product_id: product_id 
    });
    
    let result;
    let newItem;
    
    if (existingItem) {
      // Update existing inventory item
      result = await db.collection("inventory").updateOne(
        { product_id: product_id },
        { 
          $set: { 
            quantity: parseInt(existingItem.quantity || 0) + parseInt(quantity),
            updated_at: new Date().toISOString()
          } 
        }
      );
      
      newItem = await db.collection("inventory").findOne({ product_id: product_id });
    } else {
      // Create new inventory item
      const newInventoryItem = {
        product_id: product_id,
        product_code: product_code,
        product_name: product_name,
        size: size,
        category: category,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        location: location || "Main Warehouse",
        updated_at: new Date().toISOString()
      };
      
      result = await db.collection("inventory").insertOne(newInventoryItem);
      newItem = { _id: result.insertedId, ...newInventoryItem };
    }
    
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Error creating/updating inventory:", error);
    return NextResponse.json({ error: "Failed to create/update inventory" }, { status: 500 });
  }
} 