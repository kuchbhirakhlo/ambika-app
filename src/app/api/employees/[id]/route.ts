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

// GET a specific employee
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectMongo();

        const employee = await Employee.findById(params.id);

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ employee }, { status: 200 });
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employee' },
            { status: 500 }
        );
    }
}

// PUT (update) an employee
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectMongo();

        const data = await request.json();
        console.log('Updating employee', params.id, 'with data:', { ...data, password: data.password ? '***' : 'unchanged' });

        // If password is provided and not empty, it will be hashed by the pre-save hook
        // If password is empty or undefined, it won't be updated
        const updateData = { ...data };
        if (!updateData.password || updateData.password.trim() === '') {
            delete updateData.password; // Don't update password if empty
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        console.log('Employee updated successfully:', updatedEmployee._id);
        return NextResponse.json(
            { message: 'Employee updated successfully', employee: updatedEmployee },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error updating employee:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Employee with this username or employee ID already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update employee' },
            { status: 500 }
        );
    }
}

// DELETE an employee
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectMongo();

        const deletedEmployee = await Employee.findByIdAndDelete(params.id);

        if (!deletedEmployee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Employee deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json(
            { error: 'Failed to delete employee' },
            { status: 500 }
        );
    }
}