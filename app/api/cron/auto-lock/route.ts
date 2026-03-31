import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Determine the SLA threshold: 24 hours ago
    const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find rooms where the availability update was not confirmed in the last 24 hours
    // And They are currently 'APPROVED' or 'AVAILABLE'
    const expiredUpdates = await prisma.availabilityUpdate.findMany({
      where: {
        updated_at: {
          lt: thresholdDate
        },
        room: {
          isLocked: false,
          retail: {
             retail_status: {
                in: ['APPROVED', 'AVAILABLE']
             }
          }
        }
      },
      include: {
        room: true
      }
    });

    if (expiredUpdates.length === 0) {
      return NextResponse.json({ message: 'No rooms to lock. All good.' });
    }

    const roomIdsToLock = expiredUpdates.map(u => u.roomId);

    // Hard lock them
    await prisma.roomMaster.updateMany({
      where: { id: { in: roomIdsToLock } },
      data: { isLocked: true, lockedAt: new Date() }
    });

    // Option: also mark their availability_type as "blocked"
    await prisma.availabilityUpdate.updateMany({
      where: { roomId: { in: roomIdsToLock } },
      data: { availability_type: 'blocked', remarks: 'Auto-locked due to SLA gap (>24h)' }
    });

    const sysUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const sysId = sysUser ? sysUser.id : 0;

    // Log the automated lock for transparency
    const logsData = roomIdsToLock.map(id => ({
      roomId: id,
      actionType: 'AUTO_LOCK',
      salesUserId: sysId,
      notes: 'System enforced auto-lock: No owner confirmation within 24h SLA.'
    }));

    await prisma.actionLog.createMany({
      data: logsData
    });

    console.log(`[Auto-Lock] Locked ${roomIdsToLock.length} units.`);

    return NextResponse.json({ 
      success: true, 
      lockedCount: roomIdsToLock.length,
      message: 'SLA rule enforced: Unconfirmed inventory locked.'
    });

  } catch (error: any) {
    console.error('Auto-lock cron failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
