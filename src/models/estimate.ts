import { Schema, model, models, Document } from 'mongoose';

interface EstimateItem {
  product_code: string;
  product_name: string;
  category: string;
  size?: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface IEstimate extends Document {
  estimate_id: string;
  order_id: string;
  date: Date;
  customer_name: string;
  agent_name: string;
  total_items: number;
  total_amount: number;
  status: string;
  items: EstimateItem[];
  createdAt: Date;
  updatedAt: Date;
}

const estimateItemSchema = new Schema({
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

const estimateSchema = new Schema<IEstimate>(
  {
    estimate_id: {
      type: String,
      required: [true, 'Estimate ID is required'],
      trim: true,
      unique: true,
    },
    order_id: {
      type: String,
      required: [true, 'Order ID is required'],
      trim: true,
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
    agent_name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
    },
    total_items: {
      type: Number,
      required: [true, 'Total items count is required'],
      min: 1,
    },
    total_amount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      trim: true,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
    items: {
      type: [estimateItemSchema],
      required: [true, 'Estimate items are required'],
      validate: {
        validator: function(items: any[]) {
          return items.length > 0;
        },
        message: 'At least one estimate item is required',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for searching
estimateSchema.index({ estimate_id: 'text', customer_name: 'text' });

const Estimate = models.Estimate || model<IEstimate>('Estimate', estimateSchema);

export default Estimate; 