import { Schema, model, models, Document } from 'mongoose';

export interface IProduct extends Document {
  code: string;
  name: string;
  size?: string;
  category: string;
  supplier: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    code: {
      type: String,
      required: [true, 'Product code is required'],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    supplier: {
      type: String,
      required: [true, 'Supplier is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for searching
productSchema.index({ name: 'text', code: 'text', category: 'text' });

const Product = models.Product || model<IProduct>('Product', productSchema);

export default Product; 