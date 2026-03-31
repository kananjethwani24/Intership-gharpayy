const mongoose = require('mongoose');

// MONGODB_URI
const MONGODB_URI = 'mongodb+srv://admin:admin@cluster0.pksps.mongodb.net/gharpayy?retryWrites=true&w=majority';
const OWNER_ID = '69b81ba58c5ac127a3a9f9aa';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  // Define schemas inline
  const IQProperty = mongoose.model('IQProperty', new mongoose.Schema({}, { strict: false }));
  const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
  const Room = mongoose.model('Room', new mongoose.Schema({}, { strict: false }));
  const Bed = mongoose.model('Bed', new mongoose.Schema({}, { strict: false }));

  // Take 5 IQProperties
  const iqProps = await IQProperty.find().limit(5);
  console.log(`Found ${iqProps.length} IQ Properties`);

  for (const iq of iqProps) {
    console.log(`Mapping ${iq.name}...`);
    
    // Create Managed Property
    const p = await Property.create({
      name: iq.name,
      city: iq.city || 'Bangalore',
      area: iq.area,
      address: iq.location || iq.area,
      description: iq.usp || 'Quality living at affordable price',
      ownerId: new mongoose.Types.ObjectId(OWNER_ID),
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

    // Create some Rooms for this property so the intelligence dashboard has real data
    const roomTypes = ['Single', 'Double', 'Triple'];
    for (let i = 1; i <= 3; i++) {
        const bedCount = i;
        const room = await Room.create({
            propertyId: p._id,
            roomNumber: `${100 + i}`,
            bedCount: bedCount,
            status: i === 1 ? 'occupied' : 'vacant', // status for UI
            roomType: `${roomTypes[i-1]} Sharing`,
            rentPerBed: 10000 + (3 - i) * 2000,
            actualRent: (10000 + (3 - i) * 2000) * bedCount,
            updatedAt: new Date(Date.now() - (i * 5) * 24 * 60 * 60 * 1000) // varying vacancy
        });

        // Create Beds
        for (let b = 1; b <= bedCount; b++) {
            await Bed.create({
                roomId: room._id,
                bedNumber: `${room.roomNumber}-${b}`,
                status: (i === 1) ? 'occupied' : 'available'
            });
        }
    }
  }

  console.log('Seeding complete');
  await mongoose.disconnect();
}

seed().catch(console.error);
