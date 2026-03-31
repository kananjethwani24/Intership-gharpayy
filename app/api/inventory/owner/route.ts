import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/inventory-auth';
import connectToDatabase from '@/lib/mongodb';
import Tour from '@/models/Visit';
import MongoProperty from '@/models/Property';

// GET /api/inventory/owner — Owner's full view for the 3X portal
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'OWNER', 'ADMIN');

    const properties = await prisma.propertyMaster.findMany({
      where: user.role === 'ADMIN' ? {} : { ownerId: user.id },
      include: {
        rooms: {
          include: {
            availability: true,
            retail: true,
            visits: { where: { status: 'PENDING' }, take: 5 },
            _count: { select: { actions: true } }
          }
        }
      }
    });

    const result = properties.map(prop => {
      const roomStates = prop.rooms.map(r => {
        let state = 'LOCKED';
        if (r.availability?.availability_type === 'available_now' || r.availability?.availability_type === 'available_on_date') {
            state = 'AVAILABLE';
        }
        if (r.retail?.retail_status?.toUpperCase() === 'APPROVED') {
            state = 'APPROVED';
        }
        if (r.visits.length > 0) {
            state = 'SOFT_LOCKED';
        }
        if (r.isLocked && !r.visits.length) {
            state = 'HARD_LOCKED';
        }
        if (r.availability?.availability_type === 'occupied') {
            state = 'OCCUPIED';
        }

        return {
          id: r.id,
          roomNumber: r.room_number,
          beds: r.capacity,
          expectedRent: r.availability?.expected_price || r.base_price,
          retailPrice: r.retail?.retail_price,
          state,
          availabilityType: r.availability?.availability_type,
          availableFrom: r.availability?.available_from?.toISOString().split('T')[0],
          remarks: r.availability?.remarks,
          tier: r.retail?.pricing_tier,
          actionCount: r._count.actions,
          updatedAt: r.availability?.updated_at ? r.availability.updated_at.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : undefined
        };
      });

      return {
        propertyId: prop.id,
        location: prop.name,
        area: prop.area,
        rooms: roomStates
      };
    });

    // 2. Fetch live tours from MongoDB for these properties (Dynamic Sync)
    await connectToDatabase();
    // Get all MongoDB properties that match our Prisma property names
    const propNames = result.map(p => p.location);
    const mongoProps = await MongoProperty.find({ name: { $in: propNames } }).select('_id name');
    const mongoPropIds = mongoProps.map(mp => mp._id);
    
    // Fetch active tours (visits) from MongoDB
    const liveTours = await Tour.find({ 
      propertyId: { $in: mongoPropIds },
      outcome: { $exists: false } // Only active/pending tours
    }).populate('leadId', 'name').populate('roomId', 'roomNumber').sort({ scheduledAt: -1 }).lean();

    // Attach tours to the result and sync room statuses
    const finalResult = result.map(p => {
      const match = mongoProps.find(mp => mp.name === p.location);
      const propertyTours = liveTours
        .filter((v: any) => v.propertyId.toString() === match?._id.toString());
      
      // Update room statuses based on live tours
      const updatedRooms = p.rooms.map(r => {
        const hasTour = propertyTours.some((v: any) => v.roomId?.roomNumber === r.roomNumber);
        return hasTour ? { ...r, state: 'SOFT_LOCKED' } : r;
      });

      return { 
        ...p, 
        rooms: updatedRooms,
        liveTours: propertyTours.map((v: any) => ({
          id: v._id.toString(),
          customer: v.leadId?.name || 'Anonymous',
          tourAt: v.scheduledAt,
          tourType: v.tourType || 'Physical',
          notes: v.notes
        }))
      };
    });

    return NextResponse.json(finalResult);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Owner only' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/inventory/owner — Update a single room's availability (Owner Truth)
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'OWNER', 'ADMIN');
    const { roomId, availabilityType, availableFrom, expectedPrice, remarks } = await req.json();

    if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

    // Verify ownership
    const room = await prisma.roomMaster.findFirst({
      where: { id: Number(roomId) },
      include: { property: true }
    });

    if (!room || (user.role !== 'ADMIN' && room.property.ownerId !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Upsert availability
    await prisma.availabilityUpdate.upsert({
      where: { roomId: Number(roomId) },
      update: {
        availability_type: availabilityType,
        available_from: availableFrom ? new Date(availableFrom) : null,
        expected_price: expectedPrice ? Number(expectedPrice) : undefined,
        remarks: remarks || undefined,
        confirmed_by: user.id
      },
      create: {
        roomId: Number(roomId),
        availability_type: availabilityType,
        available_from: availableFrom ? new Date(availableFrom) : null,
        expected_price: expectedPrice ? Number(expectedPrice) : undefined,
        remarks: remarks || '',
        confirmed_by: user.id
      }
    });

    // Automatically trigger a log action
    await prisma.actionLog.create({
      data: {
        roomId: Number(roomId),
        actionType: 'owner_update',
        salesUserId: user.id, // using the owner's ID as the actor
        notes: `Owner updated Room ${room.room_number}: ${availabilityType}${remarks ? ' · ' + remarks : ''}`
      }
    });

    return NextResponse.json({ success: true, message: 'Truth updated' });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
