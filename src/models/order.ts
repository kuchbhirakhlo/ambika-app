import { Schema, model, models, Document } from 'mongoose';

interface OrderItem {
  product_code: string;
  product_name: string;
  category: string;
  size?: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface IOrder extends Document {
  order_id: string;
  date: Date;
  customer_name: string;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: string;
  estimate_id?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema({
  product_code: {
    type: String,
    required: [true, 'Product code is required'],
    trim: true,
  },
  product_name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  size: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1,
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: 0,
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: 0,
  },
});

const orderSchema = new Schema<IOrder>(
  {
    order_id: {
      type: String,
      required: [true, 'Order ID is required'],
      trim: true,
      unique: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    customer_name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    total_amount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    advance_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      trim: true,
      enum: ['No Estimate', 'Pending', 'Processing', 'Completed'],
      default: 'No Estimate',
    },
    estimate_id: {
      type: String,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Order = models.Order || model<IOrder>('Order', orderSchema);

export default Order; 