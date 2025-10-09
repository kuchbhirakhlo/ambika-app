import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  status: string;
  notes?: string;
  created_at: Date;
  updated_at?: Date;
}

const VendorSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  contact_person: { 
    type: String 
  },
  email: { 
    type: String 
  },
  phone: { 
    type: String 
  },
  address: { 
    type: String 
  },
  tax_id: { 
    type: String 
  },
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'inactive']
  },
  notes: { 
    type: String 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date 
  }
});

// Add text index for searching
VendorSchema.index({ name: 'text', contact_person: 'text', email: 'text' });

// Avoid duplicate model compilation in development
const Vendor = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor; 