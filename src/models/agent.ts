import { Schema, model, models, Document } from 'mongoose';

export interface IAgent extends Document {
  name: string;
  contact: string;
  email: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    city: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Agent = models.Agent || model<IAgent>('Agent', agentSchema);

export default Agent; 