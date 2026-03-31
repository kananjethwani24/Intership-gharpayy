import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/inventory-auth';

// GET /api/inventory/effort?propertyId=X — Effort visibility for owners
// Shows: leads pitched, virtual tours, visits scheduled, visits done, feedback
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const propertyId = req.nextUrl.searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    // If owner, verify ownership
    if (user.role === 'OWNER') {
      const prop = await prisma.propertyMaster.findFirst({
        where: { id: Number(propertyId), ownerId: user.id }
      });
      if (!prop) return NextResponse.json({ error: 'Not your property' }, { status: 403 });
    }

    // Get all rooms for this property
    const rooms = await prisma.roomMaster.findMany({
      where: { propertyId: Number(propertyId) },
      select: { id: true }
    });
    const roomIds = rooms.map(r => r.id);

    // Count actions by type
    const pitchCount = await prisma.actionLog.count({
      where: { roomId: { in: roomIds }, actionType: 'PITCH' }
    });
    const virtualTourCount = await prisma.actionLog.count({
      where: { roomId: { in: roomIds }, actionType: 'VIRTUAL_TOUR' }
    });
    const visitScheduledCount = await prisma.actionLog.count({
      where: { roomId: { in: roomIds }, actionType: 'VISIT_SCHEDULED' }
    });
    const visitDoneCount = await prisma.actionLog.count({
      where: { roomId: { in: roomIds }, actionType: 'VISIT_DONE' }
    });

    // Visit stats
    const totalVisits = await prisma.visit.count({
      where: { roomId: { in: roomIds } }
    });
    const pendingVisits = await prisma.visit.count({
      where: { roomId: { in: roomIds }, status: 'PENDING' }
    });
    const completedVisits = await prisma.visit.count({
      where: { roomId: { in: roomIds }, status: 'COMPLETED' }
    });

    // Recent actions (last 20)
    const recentActionsRaw = await prisma.actionLog.findMany({
      where: { roomId: { in: roomIds } },
      include: { room: { select: { room_number: true } } },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    const recentActions = recentActionsRaw.map((a: any) => ({
      ...a,
      room: { roomNumber: a.room?.room_number }
    }));

    return NextResponse.json({
      propertyId: Number(propertyId),
      effort: {
        pitchCount,
        virtualTourCount,
        visitScheduledCount,
        visitDoneCount,
        totalVisits,
        pendingVisits,
        completedVisits,
      },
      recentActions,
    });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
