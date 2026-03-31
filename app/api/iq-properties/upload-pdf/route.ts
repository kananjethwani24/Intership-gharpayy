import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import IQProperty from '@/models/IQProperty';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

const LOG_FILE = path.join(process.cwd(), 'api_logs.txt');

async function logToFile(msg: string) {
  const timestamp = new Date().toISOString();
  await fs.appendFile(LOG_FILE, `[${timestamp}] ${msg}\n`);
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { propertyId, pdfBase64 } = await req.json();

    if (!propertyId || !pdfBase64) {
      await logToFile(`FAILED: Missing input ID: ${propertyId}`);
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    const sizeInMb = (pdfBase64.length) / (1024 * 1024);
    await logToFile(`FORCE-UPLOAD: ID ${propertyId}, size: ${sizeInMb.toFixed(2)}MB`);

    // Use RAW MongoDB collection update to bypass ANY schema restrictions
    const db = mongoose.connection.db;
    const collection = db.collection('iqproperties');
    
    // Find the current name for logging
    const current = await collection.findOne({ _id: new mongoose.Types.ObjectId(propertyId) });
    if (!current) {
        await logToFile(`CRITICAL: ID ${propertyId} not found in raw collection`);
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    await logToFile(`RAW UPDATING: Property ${current.name} (${propertyId})`);

    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(propertyId) },
      { $set: { brochurePdf: pdfBase64 } }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      await logToFile("RAW-FAILED: No document was modified or matched.");
      return NextResponse.json({ success: false, error: 'Update failed in DB' }, { status: 500 });
    }

    // Verify raw data IMMEDIATELY
    const verified = await collection.findOne({ _id: new mongoose.Types.ObjectId(propertyId) });
    const exists = !!verified?.brochurePdf;
    const len = verified?.brochurePdf?.length || 0;
    
    await logToFile(`RAW-VERIFIED: Success? ${exists}. DB-Field Length: ${len}`);

    return NextResponse.json({ 
        success: true, 
        property: verified,
        status: { exists, len } 
    });
  } catch (err: any) {
    await logToFile(`CRITICAL-ERROR: ${err.message}`);
    console.error('[API] POST Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) return NextResponse.json({ success: false });

    const db = mongoose.connection.db;
    await db.collection('iqproperties').updateOne(
        { _id: new mongoose.Types.ObjectId(propertyId) },
        { $unset: { brochurePdf: "" } }
    );

    await logToFile(`RAW-DELETE: ID ${propertyId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
     return NextResponse.json({ success: false });
  }
}
