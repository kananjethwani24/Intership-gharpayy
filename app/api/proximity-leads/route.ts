import { NextRequest, NextResponse } from 'next/server';
import { ProximityMatcher } from '@/lib/proximityMatcher';

export async function POST(req: NextRequest) {
  try {
    const { searchAddress, range, gender, minScore } = await req.json();

    if (!searchAddress) {
      return NextResponse.json({ error: 'Search address is required' }, { status: 400 });
    }

    const matcher = ProximityMatcher.getInstance();
    const resolvedOrigin = matcher.resolveLocation(searchAddress);

    if (!resolvedOrigin) {
      return NextResponse.json({ 
        error: 'Location could not be resolved. Please try a more specific area or landmark.',
        score: 0 
      }, { status: 404 });
    }

    const rangeVal = range && range !== 'any' ? parseFloat(range) : null;
    const leads = matcher.getFilteredLeads(
      { lat: resolvedOrigin.node.lat, lng: resolvedOrigin.node.lng },
      rangeVal,
      { gender, minScore: minScore ? parseInt(minScore) : 0 }
    );

    return NextResponse.json({
      leads,
      resolvedOrigin: {
        name: resolvedOrigin.node.name,
        lat: resolvedOrigin.node.lat,
        lng: resolvedOrigin.node.lng,
        score: resolvedOrigin.score
      }
    });

  } catch (error: any) {
    console.error('Proximity Leads API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
