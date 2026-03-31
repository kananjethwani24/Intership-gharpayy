import { NextResponse } from 'next/server';
import { megaMatcher } from '@/lib/megaMatcher';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  
  if (!query) return NextResponse.json([]);

  try {
    // 1. Search for company/tech park/landmark metadata
    const megaResults = megaMatcher.search(query);
    
    // 2. Fetch all properties to match against
    const properties = await prisma.propertyMaster.findMany({
      include: {
        rooms: {
          include: {
            retail: true,
            availability: true
          }
        }
      }
    });

    // 3. Prepare results with refined distance intelligence
    const expanded = megaResults.map(res => {
        const matches = properties.map(p => {
            // First, check for exact sub-area/locality match in metadata if available
            // If not, use the road bridge distance matrix
            let distance = 99;
            const matrixDist = megaMatcher.getDistance(res.area, p.area);
            if (matrixDist !== null) distance = matrixDist;
            else if (res.area.toLowerCase() === p.area.toLowerCase()) distance = 1.5; // Same zone default road distance

            return {
                ...p,
                distance,
                matchSource: res.type,
                matchedAgainst: res.name
            };
        }).filter(p => p.distance < 12) // Show only reasonable commutes
        .sort((a,b) => a.distance - b.distance);

        return {
            ...res,
            properties: matches
        };
    });

    return NextResponse.json(expanded);
  } catch (error) {
    console.error('Mega matching error:', error);
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 });
  }
}
