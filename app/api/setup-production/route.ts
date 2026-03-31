import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';
import Property from '@/models/Property';
import IQProperty from '@/models/IQProperty';
import Room from '@/models/Room';
import Bed from '@/models/Bed';

export async function GET() {
  try {
    await connectToDatabase();
    
    // 1. Provision Admin
    let owner = await Owner.findOne({ email: 'admin@gharpayy.com' });
    if (!owner) {
       const hashedPassword = await bcrypt.hash('admin123', 10);
       owner = await Owner.create({
          name: 'The Admin Owner',
          email: 'admin@gharpayy.com',
          password: hashedPassword,
          role: 'owner',
          phone: '9876543210',
          companyName: 'GharPayy Management'
       });
    } else {
       const hashedPassword = await bcrypt.hash('admin123', 10);
       owner.password = hashedPassword;
       await owner.save();
    }

    const ownerId = owner._id;

    // 2. Clean start for this admin's props
    await Property.deleteMany({ ownerId });

    // 3. Seed 7 properties
    const iqProps = await IQProperty.find().limit(7);
    
    if (iqProps.length === 0) {
       return NextResponse.json({ error: 'No IQProperties found in production DB. Please seed IQProperties first.' });
    }

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
               roomNumber: `${300 + i}`,
               bedCount: bedCount,
               status: 'available',
               roomType: `${roomTypes[i-1]} Sharing`,
               rentPerBed: 10000 + (3 - i) * 2000,
               actualRent: (10000 + (3 - i) * 2000) * bedCount,
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

    return NextResponse.json({ 
      status: 'Setup Complete (v3)', 
      ownerId: ownerId,
      properties_seeded: iqProps.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
