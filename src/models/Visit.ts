import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  leadId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  assignedStaffId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  tourType?: 'Online' | 'Physical';
  outcome?: 'completed' | 'no_show' | 'rescheduled' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema: Schema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    scheduledAt: { type: Date, required: true },
    tourType: { type: String, enum: ['Online', 'Physical'], default: 'Physical' },
    outcome: { type: String, enum: ['completed', 'no_show', 'rescheduled', 'cancelled'] },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
