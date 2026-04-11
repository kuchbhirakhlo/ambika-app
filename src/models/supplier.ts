import { Schema, model, models, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  category: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      trim: true,
      required: false,
    },
    contact: {
      type: String,
      trim: true,
      required: false,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      required: false,
    },
    phone: {
      type: String,
      trim: true,
      required: false,
    },
    category: {
      type: String,
      trim: true,
      required: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Supplier = models.Supplier || model<ISupplier>('Supplier', supplierSchema);

export default Supplier; 