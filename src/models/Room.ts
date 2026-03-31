import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  propertyId: mongoose.Types.ObjectId;
  roomNumber: string;
  floor?: string;
  bedCount?: number;
  status: 'vacant' | 'visit_scheduled' | 'visit_done' | 'booked' | 'occupied' | 'vacating_soon';
  actualRent?: number;
  expectedRent?: number;
  roomType?: string;
  notes?: string;
  rentPerBed?: number;
  isLocked: boolean;
  vacatingDate?: Date;
  bathroomType?: 'attached' | 'common';
  furnishing?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    roomNumber: { type: String, required: true },
    floor: { type: String },
    bedCount: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['vacant', 'visit_scheduled', 'visit_done', 'booked', 'occupied', 'vacating_soon'],
      default: 'vacant'
    },
    isLocked: { type: Boolean, default: false },
    vacatingDate: { type: Date },
    actualRent: { type: Number },
    expectedRent: { type: Number },
    roomType: { type: String },
    notes: { type: String },
    rentPerBed: { type: Number },
    bathroomType: { type: String, enum: ['attached', 'common'], default: 'common' },
    furnishing: { type: String, enum: ['unfurnished', 'semi-furnished', 'fully-furnished'], default: 'unfurnished' },
    lastConfirmedAt: { type: Date },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

RoomSchema.virtual('beds', {
  ref: 'Bed',
  localField: '_id',
  foreignField: 'roomId'
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
