import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  product_id: mongoose.Types.ObjectId;
  quantity: number;
  location?: string;
  last_updated: Date;
}

const InventorySchema: Schema = new Schema({
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_code: {
    type: String,
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  size: String,
  category: String,
  price: Number,
  quantity: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: 'Main Warehouse'
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
}, { collection: 'inventory' });

// Create a compound index on product_code and location
InventorySchema.index({ product_code: 1, location: 1 }, { unique: true });

// Avoid duplicate model compilation in development
const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory; 