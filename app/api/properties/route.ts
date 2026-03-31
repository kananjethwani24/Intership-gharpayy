import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { initModels } from '@/lib/init-models';
import Property from '@/models/Property';
import IQProperty from '@/models/IQProperty';
import Owner from '@/models/Owner';
import Visit from '@/models/Visit';
import { executeAntiLeakageEngine } from '@/lib/autoReleaseLocks';
import { getAuthUser } from '@/lib/auth-service';

/**
 * UNIFIED PROPERTIES API
 * This API now merges traditional Database Properties with IQ Sheet Data
 * ensuring Owners see every single PG they manage regardless of source.
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    initModels();

    // 0. Anti-Leakage SLA Execution
    await executeAntiLeakageEngine().catch(e => console.error('Leakage SLA Engine failed:', e));

    const { searchParams } = new URL(req.url);
    const ownerIdParam = searchParams.get('ownerId');

    // 1. Resolve target Owner logic
    let targetOwnerId = '';
    let pgNames: string[] = [];

    if (user.role === 'owner') {
      targetOwnerId = user.id;
      // Fetch the owner record to get linked PG names as fallbacks
      const ownerRecord = await Owner.findById(user.id);
      if (ownerRecord) {
        if (ownerRecord.exactPgName) pgNames.push(ownerRecord.exactPgName);
        if (ownerRecord.gharpayyPgName) pgNames.push(ownerRecord.gharpayyPgName);
      }
    } else if (user.role === 'admin') {
      if (ownerIdParam) {
        targetOwnerId = ownerIdParam;
        const oRec = await Owner.findById(ownerIdParam);
        if (oRec) {
          if (oRec.exactPgName) pgNames.push(oRec.exactPgName);
          if (oRec.gharpayyPgName) pgNames.push(oRec.gharpayyPgName);
        }
      }
    }

    // 2. Query Properties tagged with ownerId
    let dbPropertiesQuery: any = { isActive: true };
    if (targetOwnerId) {
      dbPropertiesQuery.ownerId = targetOwnerId;
    }

    const dbProperties = await Property.find(dbPropertiesQuery)
      .populate('ownerId', 'name exactPgName gharpayyPgName') // System Law 4: Strip PII Contacts
      .populate({
        path: 'rooms',
        populate: { path: 'beds' }
      })
      .lean();

    // 2.5 Attach Ongoing Soft Locks (Active Visits) directly to the rooms payload
    if (dbProperties.length > 0) {
      const activeVisits = await Visit.find({
        propertyId: { $in: dbProperties.map((p: any) => p._id) },
        outcome: { $exists: false }
      }).lean();

      dbProperties.forEach((p: any) => {
        // Explicitly stringify IDs since .lean() strips virtual 'id' field
        p.id = p._id.toString();
        (p.rooms || []).forEach((r: any) => {
          r.id = r._id.toString(); // ← Critical: ensures room.id is always a valid string
          const activeVisit = activeVisits.find((v: any) => v.roomId?.toString() === r._id.toString());
          if (activeVisit) {
            r.activeVisit = activeVisit;
          }
        });
      });
    }

    // 3. Query IQ Sheet for matching PG names (to capture spreadsheet imports)
    let iqProperties: any[] = [];
    if (pgNames.length > 0) {
      iqProperties = await IQProperty.find({
        name: { $in: pgNames }
      }).lean();
    }

    // 4. Merge results into a unified format for the Owner Portal
    const finalResults = [
      ...dbProperties.map(p => ({
        ...p,
        id: p._id.toString(),
        source: 'db'
      }))
    ];

    // Avoid duplicates if same PG name exists in both
    const existingNames = new Set(finalResults.map(p => p.name.toLowerCase()));

    iqProperties.forEach(iq => {
      if (!existingNames.has(iq.name.toLowerCase())) {
        finalResults.push({
          ...iq,
          ownerContact: undefined, // System Law 4: Strip PII from IQ Sheet fallback
          id: iq._id.toString(),
          source: 'iq',
          priceRange: iq.price,
          genderAllowed: iq.gender?.toLowerCase().includes('girls') ? 'female' : (iq.gender?.toLowerCase().includes('boys') ? 'male' : 'any')
        });
      }
    });

    return NextResponse.json(finalResults);
  } catch (error: any) {
    console.error('Properties API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    await connectToDatabase();
    
    // Create actual Property document
    const property = await Property.create(body);
    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    console.error('Property Creation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
