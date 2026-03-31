import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/inventory-auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'OWNER', 'ADMIN');
    const { propertyId } = await req.json();

    if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 });

    // Verify ownership
    if (user.role !== 'ADMIN') {
        const prop = await prisma.propertyMaster.findFirst({
            where: { id: Number(propertyId), ownerId: user.id }
        });
        if (!prop) return NextResponse.json({ error: 'Not your property' }, { status: 403 });
    }

    // Get all vacant/available rooms for this property
    const rooms = await prisma.roomMaster.findMany({
        where: { propertyId: Number(propertyId) },
        include: { availability: true }
    });

    // Update updated_at for all availability records to "Now"
    // This confirms they are still vacant/available as of today
    const now = new Date();
    
    for (const room of rooms) {
        if (room.availability) {
            await prisma.availabilityUpdate.update({
                where: { id: room.availability.id },
                data: { updated_at: now, confirmed_by: user.id }
            });
        }
    }

    // Log the event
    await prisma.actionLog.create({
        data: {
            roomId: rooms[0]?.id || 0, // log against the property's first room as a proxy if no better place
            actionType: 'bulk_confirm',
            salesUserId: user.id,
            notes: `Owner performed bulk confirmation of all units for property ${propertyId}`
        }
    });

    return NextResponse.json({ success: true, count: rooms.length });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
