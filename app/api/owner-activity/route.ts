import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import { getAuthUser } from '@/lib/auth-service';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    
    // Explicit Authorization: Owner checking only
    if (!user || user.role !== 'owner') {
       return NextResponse.json({ error: 'Unauthorized: Trust Layer strictly requires specific Owner Authorization.' }, { status: 401 });
    }

    await connectToDatabase();
    
    // 1. Identify owner's ecosystem
    const properties = await Property.find({ ownerId: user.id }).lean();
    const propertyIds = properties.map(p => p._id);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 2. Strict Aggregation (No customer data exposure)
    
    const visitsScheduledToday = await Visit.countDocuments({ 
        propertyId: { $in: propertyIds },
        scheduledAt: { $gte: startOfToday }
    });

    const visitsCompleted = await Visit.countDocuments({
        propertyId: { $in: propertyIds },
        outcome: { $in: ['completed', 'booked'] }
    });

    const roomsBlocked = await Visit.countDocuments({
        propertyId: { $in: propertyIds },
        outcome: { $exists: false }
    });

    const bookingsConfirmed = await Booking.countDocuments({
        propertyId: { $in: propertyIds },
        bookingStatus: { $in: ['checked_in', 'confirmed'] }
    });

    return NextResponse.json({
        visitsScheduledToday,
        visitsCompleted,
        roomsBlocked,
        bookingsConfirmed
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
