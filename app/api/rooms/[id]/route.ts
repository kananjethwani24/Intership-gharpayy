import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Room from '@/models/Room';
import Property from '@/models/Property';
import AdminLog from '@/models/AdminLog';
import { getAuthUser } from '@/lib/auth-service';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gharpayy_owner_secret_key_2026_xyz';

async function getAnyAuthUser() {
  const cookieStore = await cookies();
  // Try team auth first
  let token = cookieStore.get('auth_token')?.value;
  // Fallback to owner auth token
  if (!token) token = cookieStore.get('owner_auth_token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Normalize: owner JWT uses 'userId', team JWT uses 'id'
    return { ...decoded, id: decoded.id || decoded.userId?.toString() };
  } catch { return null; }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAnyAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const roomId = id;
    const body = await req.json();

    console.log('[PATCH /api/rooms]', { roomId, userId: user.id, role: user.role, body });

    await connectToDatabase();

    // Verify room belongs to a property owned by the user (if owner)
    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (user.role === 'owner') {
      const property = await Property.findById(room.propertyId);
      if (!property || property.ownerId?.toString() !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    const changes: any = {};
    
    if (body.status !== undefined && body.status !== room.status) {
       updateData.status = body.status;
       changes.status = { from: room.status, to: body.status };
    }
    if (body.roomType !== undefined && body.roomType !== room.roomType) {
       updateData.roomType = body.roomType;
       changes.roomType = { from: room.roomType, to: body.roomType };
    }
    if (body.expectedRent !== undefined && parseFloat(body.expectedRent) !== room.expectedRent) {
       updateData.expectedRent = parseFloat(body.expectedRent);
       changes.expectedRent = { from: room.expectedRent, to: updateData.expectedRent };
    }
    if (body.bedCount !== undefined && parseInt(body.bedCount) !== room.bedCount) {
       updateData.bedCount = parseInt(body.bedCount);
       changes.bedCount = { from: room.bedCount, to: updateData.bedCount };
    }
    if (body.isLocked !== undefined && body.isLocked !== room.isLocked) {
       updateData.isLocked = body.isLocked;
       changes.isLocked = { from: room.isLocked, to: body.isLocked };
    }
    if (body.vacatingDate !== undefined) {
       updateData.vacatingDate = body.vacatingDate ? new Date(body.vacatingDate) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Logging ANY Manual Override outside standard Visit closures (Law 3)
    if (Object.keys(changes).length > 0) {
      await AdminLog.create({
         initiatorId: user.id,
         initiatorRole: user.role,
         action: 'MANUAL_INVENTORY_OVERRIDE',
         targetId: roomId,
         targetModel: 'Room',
         changes
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(roomId, { $set: updateData }, { new: true });

    return NextResponse.json(updatedRoom);
  } catch (error: any) {
    console.error('Room Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
     const user = await getAuthUser();
     if (!user || user.role !== 'owner') {
        return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
     }

     const body = await req.json();
     await connectToDatabase();

     // Verify property belongs to owner
     const property = await Property.findById(body.propertyId);
     if (!property || property.ownerId?.toString() !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

     const newRoom = await Room.create({
        ...body,
        status: 'vacant',
        lastConfirmedAt: new Date()
     });

     return NextResponse.json(newRoom, { status: 201 });
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
