# How to Update API Routes - Step-by-Step Guide

This guide shows exactly how to update your existing API routes to enable real-time sync.

## The Two-Step Process

### Step 1: Add Import (One Time)
At the top of your API route file, add:
```typescript
import { broadcastChange } from '@/lib/broadcast-sync';
```

### Step 2: Add Broadcast After Operations
After creating, updating, or deleting data, add one line.

---

## Example 1: Products Route (Most Common)

### Current Code (Before)
```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/product';

const connectMongo = async () => { ... };

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    const data = await request.json();
    const newProduct = await Product.create(data);
    
    return NextResponse.json(
      { message: 'Product created successfully', product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A product with this code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
```

### Updated Code (After)
```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/product';
import { broadcastChange } from '@/lib/broadcast-sync'; // ← ADD THIS

const connectMongo = async () => { ... };

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    const data = await request.json();
    const newProduct = await Product.create(data);
    
    // ← ADD THESE 6 LINES
    broadcastChange(
      'products',
      'insert',
      newProduct._id.toString(),
      JSON.parse(JSON.stringify(newProduct))
    );
    
    return NextResponse.json(
      { message: 'Product created successfully', product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A product with this code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
```

---

## Pattern for All Routes

### Pattern 1: POST (Create)
```typescript
// After: const newItem = await Model.create(data)
broadcastChange(
  'collectionName',                    // ← Use exact name from db
  'insert',                            // ← Type: insert
  newItem._id.toString(),              // ← Convert ObjectId to string
  JSON.parse(JSON.stringify(newItem))  // ← Convert Mongoose doc to plain object
);
```

### Pattern 2: PUT (Update)
```typescript
// After: const updated = await Model.findByIdAndUpdate(id, data, { new: true })
broadcastChange(
  'collectionName',         // ← Use exact name from db
  'update',                 // ← Type: update
  id,                       // ← Document ID
  JSON.parse(JSON.stringify(updated)),  // ← Updated document
  {
    updatedFields: data,    // ← What changed
    removedFields: [],      // ← What was deleted (usually empty)
  }
);
```

### Pattern 3: DELETE
```typescript
// After: await Model.findByIdAndDelete(id)
broadcastChange(
  'collectionName',  // ← Use exact name from db
  'delete',          // ← Type: delete
  id                 // ← Document ID
  // No document data needed for deletes
);
```

---

## Mapping: Collection Names

Use these **exact names** in `broadcastChange()`:

```typescript
// API Route              Collection Name         Model
/api/products       →     'products'          ←   Product
/api/orders         →     'orders'            ←   Order
/api/customers      →     'customers'         ←   Customer
/api/suppliers      →     'suppliers'         ←   Supplier
/api/inventory      →     'inventory'         ←   Inventory
/api/employees      →     'employees'         ←   Employee
/api/agents         →     'agents'            ←   Agent
/api/vendors        →     'vendors'           ←   Vendor
/api/estimates      →     'estimates'         ←   Estimate
```

**⚠️ Important:** Collection names must match exactly (case-sensitive)

---

## Complete Example: Orders Route

```typescript
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Order from '@/models/order';
import { broadcastChange } from '@/lib/broadcast-sync'; // ← ADD

const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) throw new Error('MongoDB URI is missing');
      await mongoose.connect(mongoUri);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

// GET all orders
export async function GET() {
  try {
    await connectMongo();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST new order
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    const data = await request.json();
    const newOrder = await Order.create(data);

    // ← ADD: Broadcast the change
    broadcastChange(
      'orders',
      'insert',
      newOrder._id.toString(),
      JSON.parse(JSON.stringify(newOrder))
    );

    return NextResponse.json(
      { message: 'Order created successfully', order: newOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// PUT update order (if you have a dynamic route)
export async function PUT(request: NextRequest) {
  try {
    await connectMongo();

    const { id, ...updateData } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ← ADD: Broadcast the change
    broadcastChange(
      'orders',
      'update',
      id,
      JSON.parse(JSON.stringify(updatedOrder)),
      {
        updatedFields: updateData,
        removedFields: [],
      }
    );

    return NextResponse.json(
      { message: 'Order updated successfully', order: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE order
export async function DELETE(request: NextRequest) {
  try {
    await connectMongo();

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ← ADD: Broadcast the change
    broadcastChange('orders', 'delete', id);

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
```

---

## Common Issues & Fixes

### Issue 1: "Cannot find module 'broadcast-sync'"
**Solution:** Make sure file exists at `src/lib/broadcast-sync.ts`
```bash
ls -la src/lib/broadcast-sync.ts
```

### Issue 2: "Socket.io server not initialized"
**Solution:** You're running `npm run dev` instead of `npm run dev:sync`
```bash
npm run dev:sync  # Use this, not npm run dev
```

### Issue 3: Changes Not Appearing
**Checklist:**
1. ✓ Added `import { broadcastChange }...` at top
2. ✓ Called `broadcastChange()` after create/update/delete
3. ✓ Using correct collection name (case-sensitive)
4. ✓ Server running with `npm run dev:sync`
5. ✓ Browser console shows "Connected to real-time sync server"

### Issue 4: Type Errors with Mongoose
**Solution:** Convert Mongoose document to plain object:
```typescript
// Wrong:
broadcastChange('products', 'insert', newProduct._id, newProduct);

// Right:
broadcastChange('products', 'insert', newProduct._id.toString(), JSON.parse(JSON.stringify(newProduct)));
```

---

## Testing Your Updates

### Test 1: Check Broadcast Call
Add a console.log before broadcastChange:
```typescript
console.log('About to broadcast:', {
  collection: 'products',
  operation: 'insert',
  id: newProduct._id.toString(),
  data: newProduct,
});
broadcastChange(...);
```

### Test 2: Use Curl to Test
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST001",
    "name": "Test Product",
    "price": 99.99,
    "category": "Test",
    "supplier": "Test"
  }'
```

### Test 3: Watch Browser Console
Open DevTools Console and look for:
- "Connected to real-time sync server"
- "Change received: ..." (when you create items)

### Test 4: Check Server Logs
Watch your terminal and look for:
```
[products] Broadcasted insert: 60d5ec49c21d5a001f5e3c2a
```

---

## Quick Copy-Paste Templates

### For CREATE (POST)
```typescript
import { broadcastChange } from '@/lib/broadcast-sync';

export async function POST(request: NextRequest) {
  try {
    // ... your existing code ...
    const newItem = await Model.create(data);
    
    // ADD THESE 5 LINES:
    broadcastChange(
      'collectionName',
      'insert',
      newItem._id.toString(),
      JSON.parse(JSON.stringify(newItem))
    );
    
    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    // ... error handling ...
  }
}
```

### For UPDATE (PUT)
```typescript
import { broadcastChange } from '@/lib/broadcast-sync';

export async function PUT(request: NextRequest) {
  try {
    // ... your existing code ...
    const updated = await Model.findByIdAndUpdate(id, data, { new: true });
    
    // ADD THESE 8 LINES:
    broadcastChange(
      'collectionName',
      'update',
      id,
      JSON.parse(JSON.stringify(updated)),
      {
        updatedFields: data,
        removedFields: [],
      }
    );
    
    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (error) {
    // ... error handling ...
  }
}
```

### For DELETE
```typescript
import { broadcastChange } from '@/lib/broadcast-sync';

export async function DELETE(request: NextRequest) {
  try {
    // ... your existing code ...
    await Model.findByIdAndDelete(id);
    
    // ADD THIS 1 LINE:
    broadcastChange('collectionName', 'delete', id);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## Checklist: Route by Route

Update in this order (by priority):

### Priority 1 - Core Operations
- [ ] `src/app/api/products/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/orders/route.ts` - Add broadcast to POST/PUT/DELETE

### Priority 2 - Important
- [ ] `src/app/api/customers/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/suppliers/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/inventory/route.ts` - Add broadcast to POST/PUT/DELETE

### Priority 3 - Nice to Have
- [ ] `src/app/api/employees/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/agents/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/vendors/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/estimates/route.ts` - Add broadcast to POST/PUT/DELETE

Each file takes ~5 minutes to update. Total time: ~40 minutes for all routes.

---

That's it! Following these patterns, you can update all your API routes to support real-time sync. 🚀
