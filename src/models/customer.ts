import { Schema, model, models, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  contact: string;
  customer_ref_id: string;
  agent: string;
  address: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    customer_ref_id: {
      type: String,
      required: [true, 'Customer ID is required'],
      trim: true,
      unique: true,
    },
    agent: {
      type: String,
      required: [true, 'Agent is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address/City is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
  },
  {
    timestamps: true,
  }
);

const Customer = models.Customer || model<ICustomer>('Customer', customerSchema);

export default Customer; 