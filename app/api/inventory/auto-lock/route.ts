import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/inventory/auto-lock — Called on a schedule (or manually)
// Locks all rooms that haven't been confirmed today by the owner
export async function POST() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get all rooms that are currently shown as available in the portal
    const allRooms = await prisma.roomMaster.findMany({
      where: {
        isLocked: false,
        availability: {
            availability_type: { in: ['available_now', 'available_on_date'] }
        }
      },
      select: { id: true },
    });

    const roomIds = allRooms.map(r => r.id);

    // Find rooms that HAVE been updated by the owner today (Actions Ledger)
    const confirmedToday = await prisma.actionLog.findMany({
      where: {
        roomId: { in: roomIds },
        timestamp: { gte: todayStart },
        actionType: 'owner_update',
      },
      select: { roomId: true },
    });
    const confirmedIds = new Set(confirmedToday.map(l => l.roomId));

    // Lock unconfirmed rooms
    const unconfirmedIds = roomIds.filter(id => !confirmedIds.has(id));

    if (unconfirmedIds.length > 0) {
      await prisma.roomMaster.updateMany({
        where: { id: { in: unconfirmedIds } },
        data: { isLocked: true, lockedAt: new Date() },
      });
    }

    return NextResponse.json({
      message: 'Auto-lock complete',
      totalChecked: roomIds.length,
      locked: unconfirmedIds.length,
      alreadyConfirmed: confirmedIds.size,
    });
  } catch (e: any) {
    console.error('Auto-lock error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
