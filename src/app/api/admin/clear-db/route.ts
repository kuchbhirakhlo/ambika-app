import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';
import Vendor from '@/models/vendor';
import Product from '@/models/product';
import Order from '@/models/order';
import Agent from '@/models/agent';
import Customer from '@/models/customer';
import Employee from '@/models/employee';
import Estimate from '@/models/estimate';
import Inventory from '@/models/inventory';
import Supplier from '@/models/supplier';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization header with Bearer token required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token using the auth utility
    const decodedToken = verifyToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required for this operation' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find admin user(s) to preserve
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No admin users found to preserve' },
        { status: 500 }
      );
    }
    
    const adminIds = adminUsers.map(admin => admin._id);
    
     // Clear all collections except admin users
     const userResult = await User.deleteMany({ _id: { $nin: adminIds } });
     const vendorResult = await Vendor.deleteMany({});
     const productResult = await Product.deleteMany({});
     const orderResult = await Order.deleteMany({});
     const agentResult = await Agent.deleteMany({});
     const customerResult = await Customer.deleteMany({});
     const employeeResult = await Employee.deleteMany({});
     const estimateResult = await Estimate.deleteMany({});
     const inventoryResult = await Inventory.deleteMany({});
     const supplierResult = await Supplier.deleteMany({});

     return NextResponse.json({
       success: true,
       message: 'Database cleared successfully while preserving admin users',
       details: {
         deletedUsers: userResult.deletedCount,
         deletedVendors: vendorResult.deletedCount,
         deletedProducts: productResult.deletedCount,
         deletedOrders: orderResult.deletedCount,
         deletedAgents: agentResult.deletedCount,
         deletedCustomers: customerResult.deletedCount,
         deletedEmployees: employeeResult.deletedCount,
         deletedEstimates: estimateResult.deletedCount,
         deletedInventory: inventoryResult.deletedCount,
         deletedSuppliers: supplierResult.deletedCount,
         preservedAdmins: adminIds.length
       }
     });
    
  } catch (error) {
    console.error('Clear database error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while clearing the database',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 