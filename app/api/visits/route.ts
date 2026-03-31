import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Room from '@/models/Room';

export async function GET() {
  try {
    await connectToDatabase();
    
    const visits = await Visit.find({})
      .populate('leadId')
      .populate('propertyId')
      .populate('roomId')
      .populate('assignedStaffId')
      .sort({ scheduledAt: 1 });

    const transformedVisits = visits.map(v => ({
      ...v.toObject(),
      id: v._id,
      leads: v.leadId,
      properties: v.propertyId,
      rooms: v.roomId,
      agents: v.assignedStaffId
    }));

    return NextResponse.json(transformedVisits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // System Law 1: No visit without Room ID
    if (!body.roomId) {
      return NextResponse.json({ error: 'System Law 1 Blocked: No visit can be scheduled without mapping to a specific Room ID.' }, { status: 400 });
    }

    const room = await Room.findById(body.roomId);
    if (!room || (room.status !== 'vacant' && room.status !== 'vacating_soon')) {
      return NextResponse.json({ error: 'Visit prohibited: The selected room must be strictly vacant or vacating soon.' }, { status: 400 });
    }
    
    const existingVisit = await Visit.findOne({ roomId: body.roomId, outcome: { $exists: false } });
    if (existingVisit) {
      return NextResponse.json({ error: 'Leakage blocked: This room already has an active, scheduled visit.' }, { status: 400 });
    }
    
    // Implicit Soft Lock
    room.status = 'visit_scheduled';
    await room.save();

    const visit = await Visit.create(body);
    return NextResponse.json(visit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
