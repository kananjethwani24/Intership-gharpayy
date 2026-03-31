import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/inventory-auth';

// GET /api/inventory/properties — List properties for sales dashboard
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'SALES', 'ADMIN');
    
    // Get all properties with their rooms and current 3X statuses
    const rawProps = await prisma.propertyMaster.findMany({
      include: {
        owner: { select: { id: true, name: true, phone: true } },
        rooms: {
          include: {
            availability: true,
            retail: true,
            visits: { where: { status: 'PENDING' } },
            _count: { select: { actions: true } }
          }
        }
      }
    });

    const properties = rawProps.map(prop => ({
      propertyId: prop.id,
      location: prop.name,
      area: prop.area,
      owner: prop.owner,
      rooms: prop.rooms.map(r => {
        const lastUpd = r.availability?.updated_at;
        const isConfirmed = lastUpd && (new Date().getTime() - new Date(lastUpd).getTime() < 24 * 60 * 60 * 1000);
        const state = (r.retail?.retail_status === 'approved' && isConfirmed) ? 'APPROVED' : 
                      (r.availability?.availability_type && isConfirmed) ? 'AVAILABLE' : 'LOCKED';
        
        return {
          id: r.id,
          roomNumber: r.room_number,
          beds: r.capacity,
          wholesalePrice: r.base_price || 0,
          retailPrice: r.retail?.retail_price,
          state,
          youtubeLink: r.youtube_link,
          _count: { actionCount: r._count.actions, visits: r.visits.length }
        };
      })
    }));

    return NextResponse.json(properties);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/inventory/properties — Admin creates properties for an owner
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'ADMIN');
    const { name, area, ownerId } = await req.json();

    if (!name || !ownerId) {
      return NextResponse.json({ error: 'name and ownerId required' }, { status: 400 });
    }

    const prop = await prisma.propertyMaster.create({
      data: {
        name,
        area: area || 'Unknown',
        ownerId: Number(ownerId),
      }
    });

    return NextResponse.json(prop);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
