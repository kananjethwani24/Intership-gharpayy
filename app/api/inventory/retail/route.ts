import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/inventory-auth';

// POST /api/inventory/retail — Sales team approves inventory & sets retail price
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'SALES', 'ADMIN');
    const { roomId, retailPrice, pricingTier, brandNotes } = await req.json();

    if (!roomId || !retailPrice) {
      return NextResponse.json({ error: 'roomId and retailPrice required' }, { status: 400 });
    }

    const room = await prisma.roomMaster.findUnique({ where: { id: Number(roomId) } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // Upsert RetailRoom entry
    const retail = await prisma.retailRoom.upsert({
      where: { roomId: Number(roomId) },
      update: {
        retail_status: 'approved',
        retail_price: Number(retailPrice),
        pricing_tier: pricingTier,
        brand_notes: brandNotes,
        approved_by: user.id,
        approved_at: new Date(),
      },
      create: {
        roomId: Number(roomId),
        retail_status: 'approved',
        retail_price: Number(retailPrice),
        pricing_tier: pricingTier,
        brand_notes: brandNotes,
        approved_by: user.id,
        approved_at: new Date(),
      }
    });

    // Also update RoomMaster to make sure it's not locked if it was previously
    await prisma.roomMaster.update({
        where: { id: Number(roomId) },
        data: { isLocked: false }
    });

    return NextResponse.json({ message: 'Room approved for sales', retail });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Sales/Admin only' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
