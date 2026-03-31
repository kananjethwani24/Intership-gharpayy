import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Visit from '@/models/Visit';
import Room from '@/models/Room';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    
    // First retrieve the existing visit
    const visit = await Visit.findById(id);
    if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

    // Enforce Room Lifecycle: Visit Done -> Booked OR -> Released back to Vacant
    if (body.outcome && visit.roomId) {
        const room = await Room.findById(visit.roomId);
        if (room) {
            // Negative Outcomes: Release back to Vacant
            if (['not_interested', 'cancelled', 'no_show'].includes(body.outcome)) {
                room.status = 'vacant';
            } 
            // Progression Outcomes: Visit Done or Booked
            else if (['considering', 'completed'].includes(body.outcome)) {
                room.status = 'visit_done';
            }
            else if (body.outcome === 'booked') {
                room.status = 'booked';
            }
            await room.save();
        }
    }

    const updatedVisit = await Visit.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updatedVisit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
