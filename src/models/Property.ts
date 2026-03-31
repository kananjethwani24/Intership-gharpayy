import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  city: string;
  area: string;
  address: string;
  description?: string;
  photos: string[];
  ownerId: mongoose.Types.ObjectId;
  isActive: boolean;
  rating?: number;
  genderAllowed: 'any' | 'male' | 'female';
  isVerified: boolean;
  priceRange?: string;
  iqPropertyId?: mongoose.Types.ObjectId;
  locality?: string;
  nearbyLandmarks?: string;
  furnishingDetails?: string;
  usp?: string;
  amenities?: string;
  houseRules?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    photos: [{ type: String }],
    ownerId: { type: Schema.Types.ObjectId, ref: 'Owner', required: true },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    genderAllowed: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
    isVerified: { type: Boolean, default: false },
    priceRange: { type: String },
    iqPropertyId: { type: Schema.Types.ObjectId, ref: 'IQProperty' },
    locality: { type: String },
    nearbyLandmarks: { type: String },
    furnishingDetails: { type: String },
    usp: { type: String },
    amenities: { type: String },
    houseRules: { type: String },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

PropertySchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'propertyId'
});

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);
