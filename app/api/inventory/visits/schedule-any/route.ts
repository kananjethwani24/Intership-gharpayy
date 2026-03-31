import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sourceData, customerName, scheduledTime } = await req.json();

    if (!sourceData || !customerName || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if property exists in Prisma
    let property = await prisma.propertyMaster.findFirst({
      where: { name: sourceData.name }
    });

    if (!property) {
      // Get a default owner (the first one)
      const defaultOwner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
      if (!defaultOwner) return NextResponse.json({ error: 'No owner found to assign property' }, { status: 500 });

      // Create property
      property = await prisma.propertyMaster.create({
        data: {
          name: sourceData.name,
          area: sourceData.area,
          gender_allowed: sourceData.gender || 'Any',
          ownerId: defaultOwner.id,
          amenities: 'Sync from Master',
          room_config: 'Sync from Master'
        }
      });
    }

    // 2. Check if a room exists
    let room = await prisma.roomMaster.findFirst({
      where: { propertyId: property.id }
    });

    if (!room) {
      // Create a default room
      room = await prisma.roomMaster.create({
        data: {
          propertyId: property.id,
          room_number: '101 (Master)',
          capacity: 1,
          base_price: sourceData.minPrice || 10000,
        }
      });
      
      // Ensure it's marked as available in availability_update
      await prisma.availabilityUpdate.create({
        data: {
          roomId: room.id,
          availability_type: 'available_now',
          expected_price: sourceData.minPrice || 10000,
        }
      });
    }

    // 3. Create the visit
    const visit = await prisma.visit.create({
      data: {
        roomId: room.id,
        customerName,
        visitType: 'PHYSICAL',
        scheduledTime: new Date(scheduledTime),
        status: 'PENDING',
      },
    });

    // 4. Soft-lock the room
    await prisma.roomMaster.update({
      where: { id: room.id },
      data: { isLocked: true, lockedAt: new Date() },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error: any) {
    console.error('Shadow Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
