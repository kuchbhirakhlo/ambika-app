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
});

// Create a compound index on product_id and location
InventorySchema.index({ product_id: 1, location: 1 }, { unique: true });

// Avoid duplicate model compilation in development
const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory; 