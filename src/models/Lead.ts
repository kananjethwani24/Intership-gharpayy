import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  status: 'new' | 'contacted' | 'qualified' | 'visit_scheduled' | 'visit_completed' | 'negotiation' | 'booked' | 'lost';
  source: string;
  firstResponseTimeMin?: number;
  assignedAgentId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  preferredLocation?: string;
  address?: string;
  budget?: string;
  movingDate?: string;
  gender?: 'Male' | 'Female' | 'Other';
  occupation?: 'Student' | 'Working';
  stayDuration?: string;
  notes?: string;
  lostReason?: string;
  leadScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    status: { 
      type: String, 
      enum: ['new', 'contacted', 'qualified', 'visit_scheduled', 'visit_completed', 'negotiation', 'booked', 'lost', 'not_interested'],
      default: 'new' 
    },
    source: { type: String, required: true },
    firstResponseTimeMin: { type: Number },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    preferredLocation: { type: String },
    address: { type: String },
    budget: { type: String },
    movingDate: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    occupation: { type: String, enum: ['Student', 'Working'] },
    stayDuration: { type: String },
    notes: { type: String },
    lostReason: { type: String },
    leadScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
