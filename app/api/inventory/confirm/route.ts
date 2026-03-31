import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/inventory-auth';

// POST /api/inventory/confirm — Owner updates availability (Wholesale layer)
// Body: { rooms: [{ roomId, status, vacantDate?, expectedRent? }] }
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'OWNER');
    const { rooms } = await req.json();

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return NextResponse.json({ error: 'rooms array required' }, { status: 400 });
    }

    const results = [];

    for (const r of rooms) {
      const { roomId, status, vacantDate, expectedRent } = r;

      // Verify owner owns this room
      const room = await prisma.roomMaster.findFirst({
        where: { id: Number(roomId) },
        include: { property: true }
      });

      if (!room || room.property.ownerId !== user.id) {
        results.push({ roomId, error: 'Not authorized or room not found' });
        continue;
      }

      // Map old status to new availability types
      let mappedType = 'occupied';
      if (status === 'VACANT') mappedType = 'available_now';
      else if (status === 'VACATING') mappedType = 'available_on_date';
      else if (status === 'BLOCKED') mappedType = 'blocked';

      // Update or Create AvailabilityUpdate
      const availability = await prisma.availabilityUpdate.upsert({
        where: { roomId: Number(roomId) },
        update: {
            availability_type: mappedType,
            available_from: vacantDate ? new Date(vacantDate) : null,
            expected_price: expectedRent ? Number(expectedRent) : undefined,
            confirmed_by: user.id
        },
        create: {
            roomId: Number(roomId),
            availability_type: mappedType,
            available_from: vacantDate ? new Date(vacantDate) : null,
            expected_price: expectedRent ? Number(expectedRent) : undefined,
            confirmed_by: user.id
        }
      });

      results.push({ roomId, status, confirmed: true });
    }

    return NextResponse.json({ message: 'Inventory updated', results });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Owner only' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/inventory/confirm?propertyId=X — Check today's confirmation status
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'OWNER', 'ADMIN');
    const propertyId = req.nextUrl.searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const rooms = await prisma.roomMaster.findMany({
      where: { propertyId: Number(propertyId) },
      include: {
        availability: true
      },
    });

    const summary = rooms.map(room => {
      let mappedStatus = 'OCCUPIED';
      if (room.availability?.availability_type === 'available_now') mappedStatus = 'VACANT';
      if (room.availability?.availability_type === 'available_on_date') mappedStatus = 'VACATING';
      if (room.availability?.availability_type === 'blocked') mappedStatus = 'BLOCKED';

      // Was it updated today?
      const confirmedToday = room.availability ? (new Date(room.availability.updated_at) >= todayStart) : false;

      return {
        roomId: room.id,
        roomNumber: room.room_number,
        status: mappedStatus,
        beds: room.capacity,
        expectedRent: room.availability?.expected_price || room.base_price,
        confirmedToday,
        isLocked: room.isLocked,
        youtubeLink: room.youtube_link,
      };
    });

    const totalRooms = rooms.length;
    const confirmedCount = summary.filter(r => r.confirmedToday).length;

    return NextResponse.json({
      propertyId: Number(propertyId),
      totalRooms,
      confirmedCount,
      pendingCount: totalRooms - confirmedCount,
      rooms: summary,
    });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Owner/Admin only' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
