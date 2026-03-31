import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const properties = await prisma.propertyMaster.findMany({
      include: {
        owner: true,
        rooms: {
          include: {
            retail: true,
            availability: true,
            visits: {
                where: { status: 'PENDING' }
            }
          }
        }
      }
    });

    const results = properties.map(p => {
      const units = p.rooms.map(r => {
        let state = 'LOCKED';
        const retailStatus = r.retail?.retail_status?.toUpperCase();
        const lastUpdated = r.availability?.updated_at;
        // Daily confirmation check: must be updated in last 24h to be sellable
        const isConfirmed = lastUpdated && (new Date().getTime() - new Date(lastUpdated).getTime() < 24 * 60 * 60 * 1000);

        if (retailStatus === 'APPROVED' && isConfirmed) state = 'APPROVED';
        else if (r.availability?.availability_type === 'occupied' || r.availability?.availability_type === 'blocked') state = 'LOCKED';
        else if (r.availability?.availability_type === 'available_on_date' && isConfirmed) state = 'SOON';
        else if (r.availability?.availability_type && isConfirmed) state = 'AVAILABLE';
        else state = 'LOCKED'; // Failure to confirm = Locked
        
        if (r.visits.length > 0 && state === 'APPROVED') state = 'SOFT_LOCKED';
        if (r.isLocked && !r.visits.length) state = 'HARD_LOCKED';
        
        return {
          id: r.id,
          roomNumber: r.room_number,
          beds: r.capacity,
          state,
          whalePrice: r.base_price || 0,
          retailPrice: r.retail?.retail_price,
          wholesalePrice: r.base_price || 0, // for UI compatibility
          availableFrom: r.availability?.available_from,
          availabilityType: r.availability?.availability_type,
          remarks: r.availability?.remarks,
          hasPendingVisit: r.visits.length > 0
        };
      });

      return {
        propertyId: p.id,
        location: p.name,
        area: p.area,
        gender: p.gender_allowed,
        owner: { id: p.owner.id, name: p.owner.name, phone: p.owner.phone || '' },
        summary: {
            total: units.length,
            available: units.filter(u => u.state === 'AVAILABLE').length,
            approved: units.filter(u => u.state === 'APPROVED').length,
            upcoming: units.filter(u => u.state === 'SOON').length,
            locked: units.filter(u => u.state === 'LOCKED' || u.state === 'HARD_LOCKED').length
        },
        availableRooms: units.filter(u => u.state === 'AVAILABLE' || u.state === 'APPROVED' || u.state === 'SOFT_LOCKED'),
        upcomingRooms: units.filter(u => u.state === 'SOON'),
        lockedRooms: units.filter(u => u.state === 'LOCKED' || u.state === 'HARD_LOCKED')
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Sales view API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
