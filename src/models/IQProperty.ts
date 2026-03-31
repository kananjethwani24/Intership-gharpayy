import mongoose, { Schema, Document } from 'mongoose';

export interface IIQProperty extends Document {
  name: string;              // Gharpayy's Name of PG
  actualName?: string;       // Actual Name of PG
  area?: string;
  locality?: string;
  nearbyLandmarks?: string;
  location?: string;
  price?: string;            // Price/Monthly (raw string, e.g. "8000-12000")
  priceMin?: number;         // parsed min
  priceMax?: number;         // parsed max
  managerName?: string;
  managerContact?: string;
  ownerName?: string;
  ownerNumber?: string;
  groupName?: string;
  googleMapsLink?: string;
  gender?: string;           // Boys / Girls / Co-live
  targetAudience?: string;   // Students / Working Professionals / Both
  propertyType?: string;     // Premium / Mid / Budget
  roomType?: string;
  furnishingDetails?: string;
  walkingDistance?: string;
  accessibility?: string;
  noiseLevel?: string;
  surroundingVibe?: string;
  foodType?: string;
  commonAreaFeatures?: string;
  amenities?: string;
  safetyFeatures?: string;
  mealsIncluded?: string;
  foodTimings?: string;
  eBillUtilities?: string;
  cleaningFrequency?: string;
  usp?: string;
  houseRules?: string;
  lows?: string;
  securityDeposit?: string;
  minimumStay?: string;
  brochureLink?: string;
  photosLink?: string;
  videosLink?: string;
  extractedPhotos?: string[]; // Local storage for images from PDF
  brochurePdf?: string;        // Base64 encoded PDF brochure
  whatsappPromo?: string;      // Manual WhatsApp Marketing
  zone?: string;           // KORA | MWB | YPR | MTP
  subzone?: string;
  lat?: number;
  lng?: number;
  importedAt: Date;
}

const IQPropertySchema: Schema = new Schema(
  {
    name:               { type: String, required: true },
    actualName:         { type: String },
    area:               { type: String },
    locality:           { type: String },
    nearbyLandmarks:    { type: String },
    location:           { type: String },
    price:              { type: String },
    priceMin:           { type: Number },
    priceMax:           { type: Number },
    managerName:        { type: String },
    managerContact:     { type: String },
    ownerName:          { type: String },
    ownerNumber:        { type: String },
    groupName:          { type: String },
    googleMapsLink:     { type: String },
    gender:             { type: String },
    targetAudience:     { type: String },
    propertyType:       { type: String },
    roomType:           { type: String },
    furnishingDetails:  { type: String },
    walkingDistance:    { type: String },
    accessibility:      { type: String },
    noiseLevel:         { type: String },
    surroundingVibe:    { type: String },
    foodType:           { type: String },
    commonAreaFeatures: { type: String },
    amenities:          { type: String },
    safetyFeatures:     { type: String },
    mealsIncluded:      { type: String },
    foodTimings:        { type: String },
    eBillUtilities:     { type: String },
    cleaningFrequency:  { type: String },
    usp:                { type: String },
    houseRules:         { type: String },
    lows:               { type: String },
    securityDeposit:    { type: String },
    minimumStay:        { type: String },
    brochureLink:       { type: String },
    photosLink:         { type: String },
    videosLink:         { type: String },
    extractedPhotos:    { type: [String] },
    brochurePdf:        { type: String },  // Base64 PDF brochure
    whatsappPromo:      { type: String },  // Manual WhatsApp Marketing Text
    zone:               { type: String }, // KORA | MWB | YPR | MTP
    subzone:            { type: String },
    lat:                { type: Number },
    lng:                { type: Number },
    importedAt:         { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.IQProperty ||
  mongoose.model<IIQProperty>('IQProperty', IQPropertySchema);
