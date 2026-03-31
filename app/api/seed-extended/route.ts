import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';
import Property from '@/models/Property';
import IQProperty from '@/models/IQProperty';
import Room from '@/models/Room';
import Bed from '@/models/Bed';

export async function GET() {
  try {
    await connectToDatabase();
    const owner = await Owner.findOne({ email: 'admin@gharpayy.com' });
    if (!owner) return NextResponse.json({ error: 'Owner admin@gharpayy.com not found' });

    const ownerId = owner._id;
    const existingCount = await Property.countDocuments({ ownerId });

    // Skip the first few we already seeded
    const iqProps = await IQProperty.find().skip(existingCount).limit(2);
    
    for (const iq of iqProps) {
       const p = await Property.create({
          name: iq.name,
          city: iq.city || 'Bangalore',
          area: iq.area,
          address: iq.location || iq.area,
          description: iq.usp || 'Managed Premium Property',
          ownerId: ownerId,
          isActive: true,
          genderAllowed: iq.gender?.toLowerCase().includes('girl') ? 'female' : iq.gender?.toLowerCase().includes('boy') ? 'male' : 'any',
          isVerified: true,
          priceRange: iq.price,
          iqPropertyId: iq._id,
          locality: iq.locality,
          nearbyLandmarks: iq.nearbyLandmarks,
          furnishingDetails: iq.furnishingDetails,
          usp: iq.usp,
          amenities: iq.amenities || 'WiFi, Food, Cleaning',
          houseRules: iq.houseRules || 'No Smoking, No Outside Guests'
       });

       const roomTypes = ['Single', 'Double', 'Triple'];
       for (let i = 1; i <= 3; i++) {
           const bedCount = i;
           const room = await Room.create({
               propertyId: p._id,
               roomNumber: `${200 + i}`,
               bedCount: bedCount,
               status: 'available',
               roomType: `${roomTypes[i-1]} Sharing`,
               rentPerBed: 11000 + (3 - i) * 1500,
               actualRent: (11000 + (3 - i) * 1500) * bedCount,
           });
           for (let b = 1; b <= bedCount; b++) {
               await Bed.create({
                   roomId: room._id,
                   bedNumber: `${room.roomNumber}-${b}`,
                   status: 'available'
               });
           }
       }
    }

    return NextResponse.json({ message: `Added ${iqProps.length} new properties to total managed portfolio.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
