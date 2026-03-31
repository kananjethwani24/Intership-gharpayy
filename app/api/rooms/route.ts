import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Room from '@/models/Room';
import Property from '@/models/Property';

import { getAuthUser } from '@/lib/auth-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    
    await connectToDatabase();
    
    let query = Room.find({}).populate('propertyId');
    if (propertyId) {
      query = query.where('propertyId').equals(propertyId);
    }
    
    const rooms = await query.sort({ roomNumber: 1 });
    
    return NextResponse.json(rooms.map(r => ({ ...r.toObject(), id: r._id, properties: r.propertyId })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    // Verify property ownership if role is owner
    if (user.role === 'owner') {
      const property = await Property.findById(body.propertyId);
      if (!property || property.ownerId?.toString() !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const room = await Room.create(body);
    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
