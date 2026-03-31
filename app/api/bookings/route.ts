import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Visit from '@/models/Visit';
import Room from '@/models/Room';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const propertyIds = searchParams.get('propertyIds')?.split(',').filter(Boolean);
    
    await connectToDatabase();
    
    let query: any = {};
    if (leadId) query.leadId = leadId;
    if (propertyIds && propertyIds.length > 0) query.propertyId = { $in: propertyIds };
    
    const bookings = await Booking.find(query)
      .populate('propertyId')
      .populate('roomId')
      .populate('bedId')
      .populate('leadId')
      .sort({ createdAt: -1 });


    const transformedBookings = bookings.map(b => ({
      ...b.toObject(),
      id: b._id,
      properties: b.propertyId,
      rooms: b.roomId,
      beds: b.bedId,
      bookingStatus: b.bookingStatus,
      monthlyRent: b.monthlyRent,
      securityDeposit: b.securityDeposit,
      checkInDate: b.checkInDate,
    }));

    return NextResponse.json(transformedBookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Critical Architecture: Zero Leakage Validation
    if (!body.visitId || !body.roomId) {
       return NextResponse.json({ error: 'Leakage Blocked: Cannot instantiate a booking without a verified physical visit trail and Room ID.' }, { status: 400 });
    }

    const linkedVisit = await Visit.findById(body.visitId);
    if (!linkedVisit || linkedVisit.roomId?.toString() !== body.roomId?.toString()) {
       return NextResponse.json({ error: 'Leakage Blocked: Visit trail mismatch. Booking denied.' }, { status: 400 });
    }

    // Provision the booking and establish the Hard Lock
    const booking = await Booking.create(body);
    
    // Establishing Hard Lock on the Room
    await Room.findByIdAndUpdate(body.roomId, { status: 'booked' });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
