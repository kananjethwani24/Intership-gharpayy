import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/inventory-auth';

// POST /api/inventory/actions — Sales logs an action (pitch, tour, visit scheduled, visit done)
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'SALES', 'ADMIN');
    const { roomId, actionType, notes } = await req.json();

    if (!roomId || !actionType) {
      return NextResponse.json({ error: 'roomId and actionType required' }, { status: 400 });
    }

    const validActions = ['PITCH', 'VIRTUAL_TOUR', 'VISIT_SCHEDULED', 'VISIT_DONE'];
    if (!validActions.includes(actionType)) {
      return NextResponse.json({ error: `actionType must be one of: ${validActions.join(', ')}` }, { status: 400 });
    }

    // Check room exists and is not locked
    const room = await prisma.roomMaster.findUnique({ where: { id: Number(roomId) } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (room.isLocked) return NextResponse.json({ error: 'Room is locked. Owner must confirm availability first.' }, { status: 423 });

    // Log the action
    const action = await prisma.actionLog.create({
      data: {
        roomId: Number(roomId),
        actionType,
        salesUserId: user.id,
        notes: notes || null,
      },
    });

    // If visit scheduled, apply soft-lock to room
    if (actionType === 'VISIT_SCHEDULED') {
      await prisma.roomMaster.update({
        where: { id: Number(roomId) },
        data: { isLocked: true, lockedAt: new Date() },
      });
    }

    return NextResponse.json(action, { status: 201 });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sales/Admin only' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/inventory/actions?roomId=X — Get action history for a room
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'SALES', 'ADMIN', 'OWNER');
    const roomId = req.nextUrl.searchParams.get('roomId');
    const propertyId = req.nextUrl.searchParams.get('propertyId');

    const where: any = {};
    if (roomId) where.roomId = Number(roomId);
    if (propertyId) {
      where.room = { propertyId: Number(propertyId) };
    }

    const actionsRaw = await prisma.actionLog.findMany({
      where,
      include: {
        room: { select: { room_number: true, propertyId: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const actions = actionsRaw.map((a: any) => ({
      ...a,
      room: {
        roomNumber: a.room?.room_number,
        propertyId: a.room?.propertyId
      }
    }));

    return NextResponse.json(actions);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
