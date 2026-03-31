import mongoose, { Schema, Document } from 'mongoose';

export interface IZone extends Document {
  name: string;
  city: string;
  areas: string[];
  manager_id?: mongoose.Types.ObjectId;
  color?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, default: 'Bangalore' },
    areas: [{ type: String }],
    manager_id: { type: Schema.Types.ObjectId, ref: 'User' },
    color: { type: String, default: '#6366f1' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Zone || mongoose.model<IZone>('Zone', ZoneSchema);
