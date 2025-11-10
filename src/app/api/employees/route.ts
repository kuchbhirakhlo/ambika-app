import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Employee from '@/models/employee';

// Connect to MongoDB
const connectMongo = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGODB_URI || '');
            console.log('MongoDB connected successfully');
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
        console.log('Creating employee with data:', { ...data, password: '***' });

        // Ensure role is set to 'employee'
        const employeeData = {
            ...data,
            role: 'employee'
        };

        // Create a new employee with the data
        console.log('About to create employee in database...');
        const newEmployee = await Employee.create(employeeData);
        console.log('Employee created successfully:', newEmployee._id);
        console.log('Employee data saved:', {
            id: newEmployee._id,
            username: newEmployee.username,
            employeeId: newEmployee.employeeId,
            role: newEmployee.role
        });

        return NextResponse.json(
            { message: 'Employee created successfully', employee: newEmployee },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating employee:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name
        });

        // Handle duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Employee with this username or employee ID already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create employee: ' + error.message },
            { status: 500 }
        );
    }
}