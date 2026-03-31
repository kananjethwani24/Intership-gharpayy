import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/inventory-auth';

// GET /api/inventory/rooms?propertyId=X — Get rooms for a property
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const propertyId = req.nextUrl.searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    // If owner, verify they own this property
    if (user.role === 'OWNER') {
      const prop = await prisma.propertyMaster.findFirst({
        where: { id: Number(propertyId), ownerId: user.id }
      });
      if (!prop) return NextResponse.json({ error: 'Not your property' }, { status: 403 });
    }

    const rooms = await prisma.roomMaster.findMany({
      where: { propertyId: Number(propertyId) },
      include: {
        availability: true,
        retail: true,
        visits: { where: { status: 'PENDING' }, take: 5 },
        _count: { select: { actions: true, visits: true } }
      },
      orderBy: { room_number: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/inventory/rooms — Admin/Owner adds rooms to a property
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'ADMIN', 'OWNER');
    const { propertyId, roomNumber, beds, basePrice } = await req.json();

    if (!propertyId || !roomNumber) {
      return NextResponse.json({ error: 'propertyId and room_number required' }, { status: 400 });
    }

    // Owner can only add to their own property
    if (user.role === 'OWNER') {
      const prop = await prisma.propertyMaster.findFirst({
        where: { id: Number(propertyId), ownerId: user.id }
      });
      if (!prop) return NextResponse.json({ error: 'Not your property' }, { status: 403 });
    }

    const room = await prisma.roomMaster.create({
      data: {
        propertyId: Number(propertyId),
        room_number: roomNumber,
        capacity: Number(beds) || 1,
        base_price: basePrice ? Number(basePrice) : null,
      }
    });

    return NextResponse.json(room);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/inventory/rooms — Admin/Sales update room status
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(req, 'SALES', 'ADMIN');
    const { roomId, action } = await req.json();

    if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

    const room = await prisma.roomMaster.findUnique({
      where: { id: Number(roomId) }
    });

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    let updateData: any = {};
    if (action === 'SOFT_LOCK') {
      updateData = { isLocked: true, lockedAt: new Date() };
    } else if (action === 'APPROVE') {
      updateData = { isLocked: false };
      
      // Upsert retail room to approved
      await prisma.retailRoom.upsert({
         where: { roomId: Number(roomId) },
         update: { retail_status: 'APPROVED', approved_by: user.id, approved_at: new Date() },
         create: { roomId: Number(roomId), retail_status: 'APPROVED', approved_by: user.id, approved_at: new Date(), pricing_tier: 'MID' }
      });
    } else if (action === 'CONFIRM_TRUTH') {
        // Confirmation check
        await prisma.availabilityUpdate.updateMany({
            where: { roomId: Number(roomId) },
            data: { updated_at: new Date() }
        });
    }

    const updated = await prisma.roomMaster.update({
      where: { id: Number(roomId) },
      data: updateData
    });

    // Log the action
    await prisma.actionLog.create({
      data: {
        roomId: Number(roomId),
        actionType: action,
        salesUserId: user.id
      }
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
