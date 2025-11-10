import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Employee from '@/models/employee';

// Connect to MongoDB
const connectMongo = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI || '');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('Failed to connect to MongoDB');
    }
};

// GET all employees
export async function GET() {
    try {
        await connectMongo();

        const employees = await Employee.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ employees }, { status: 200 });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employees' },
            { status: 500 }
        );
    }
}

// POST new employee
export async function POST(request: NextRequest) {
    try {
        await connectMongo();

        const data = await request.json();

        // Create a new employee with the data
        const newEmployee = await Employee.create(data);

        return NextResponse.json(
            { message: 'Employee created successfully', employee: newEmployee },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating employee:', error);

        return NextResponse.json(
            { error: 'Failed to create employee' },
            { status: 500 }
        );
    }
}