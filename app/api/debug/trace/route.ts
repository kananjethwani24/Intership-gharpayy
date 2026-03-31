import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import IQProperty from '@/models/IQProperty';
import { normalizeAreaName, resolveLocationToCoords } from '@/lib/areaCoordinates';
import { parseRoomEntries } from '@/lib/parseRoomEntries';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { location = '', budget = 0, gender = '', occupation = '' } = body;

    await connectToDatabase();
    const properties = await IQProperty.find({});
    const searchAreaNorm = normalizeAreaName(location || '');
    
    const trace = properties.map(p => {
       const pgAreaNorm = normalizeAreaName(p.area || '');
       const pgLocalityNorm = normalizeAreaName(p.locality || '');
       const pgNameNorm = normalizeAreaName(p.name || '');
       const pgNearbyNorm = normalizeAreaName(p.nearbyLandmarks || '');

       const isDirectMatch = (
         pgAreaNorm.includes(searchAreaNorm) || 
         searchAreaNorm.includes(pgAreaNorm) || 
         pgLocalityNorm.includes(searchAreaNorm) ||
         pgNearbyNorm.includes(searchAreaNorm)
       );

       let status = "OK";
       let reason = "";

       const pgGender = (p.gender || '').toLowerCase();
       const leadGenderStr = (gender || '').toLowerCase();
       if (leadGenderStr) {
         const isM = leadGenderStr === 'male' || leadGenderStr.includes('boy');
         const isF = leadGenderStr === 'female' || leadGenderStr.includes('girl');
         const pgM = pgGender.includes('boy') || pgGender.includes('male');
         const pgF = pgGender.includes('girl') || pgGender.includes('female');
         const pgCo = pgGender.includes('coed') || pgGender.includes('co-ed') || pgGender.includes('both') || pgGender.includes('co-live');
         
         if (isF && pgM && !pgCo) { status = "SKIP"; reason = "Gender Mismatch (Male PG for Female Lead)"; }
         else if (isM && pgF && !pgCo) { status = "SKIP"; reason = "Gender Mismatch (Female PG for Male Lead)"; }
       }

       const roomEntries = parseRoomEntries(p.price || '', p.lows, p.priceMin, p.priceMax);
       const prices = roomEntries.map(e => e.price);
       if (budget > 0 && prices.length > 0) {
         if (Math.min(...prices) > budget) { status = "SKIP"; reason = `Over Budget (Min: ${Math.min(...prices)})`; }
       }

       return {
         name: p.name,
         area: p.area,
         isDirectMatch,
         status,
         reason,
         raw: { gender: p.gender, price: p.price, audience: p.targetAudience }
       };
    });

    return NextResponse.json({ 
       total: properties.length, 
       searchArea: searchAreaNorm, 
       trace 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
