import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/inventory-auth';

// POST /api/inventory/visits — Schedule a visit
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'SALES', 'ADMIN');
    const { roomId, customerName, visitType, scheduledTime } = await req.json();

    if (!roomId || !customerName || !visitType || !scheduledTime) {
      return NextResponse.json({ error: 'roomId, customerName, visitType, scheduledTime required' }, { status: 400 });
    }

    // Check room is unlocked
    const room = await prisma.roomMaster.findUnique({ 
      where: { id: Number(roomId) },
      include: { availability: true }
    });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (room.isLocked) {
      return NextResponse.json({ error: 'Room is locked — owner must confirm availability' }, { status: 423 });
    }
    const aType = room.availability?.availability_type;
    if (aType === 'occupied' || aType === 'blocked') {
      return NextResponse.json({ error: `Room is ${aType} — cannot schedule visit` }, { status: 400 });
    }

    // Check for conflicting visits
    const existingVisit = await prisma.visit.findFirst({
      where: {
        roomId: Number(roomId),
        status: 'PENDING',
      },
    });
    if (existingVisit) {
      return NextResponse.json({ error: 'Room already has a pending visit' }, { status: 409 });
    }

    // Create visit
    const visit = await prisma.visit.create({
      data: {
        roomId: Number(roomId),
        customerName,
        visitType: visitType.toUpperCase(),
        scheduledTime: new Date(scheduledTime),
        status: 'PENDING',
      },
    });

    // Soft-lock the room
    await prisma.roomMaster.update({
      where: { id: Number(roomId) },
      data: { isLocked: true, lockedAt: new Date() },
    });

    // Also log the action
    await prisma.actionLog.create({
      data: {
        roomId: Number(roomId),
        actionType: 'VISIT_SCHEDULED',
        salesUserId: user.id,
        notes: `Visit for ${customerName} (${visitType})`,
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sales/Admin only' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/inventory/visits — List visits
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'SALES', 'ADMIN', 'OWNER');
    const roomId = req.nextUrl.searchParams.get('roomId');
    const status = req.nextUrl.searchParams.get('status');

    const where: any = {};
    if (roomId) where.roomId = Number(roomId);
    if (status) where.status = status.toUpperCase();

    // For owners: only their rooms
    if (user.role === 'OWNER') {
      where.room = { property: { ownerId: user.id } };
    }

    const visitsRaw = await prisma.visit.findMany({
      where,
      include: {
        room: {
          select: { room_number: true, propertyId: true, property: { select: { name: true } } }
        }
      },
      orderBy: { scheduledTime: 'desc' },
      take: 100,
    });

    const visits = visitsRaw.map((v: any) => ({
      ...v,
      room: {
        roomNumber: v.room?.room_number,
        propertyId: v.room?.propertyId,
        property: { location: v.room?.property?.name }
      }
    }));

    return NextResponse.json(visits);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
