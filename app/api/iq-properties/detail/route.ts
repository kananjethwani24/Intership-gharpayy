import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import IQProperty from '@/models/IQProperty';
import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'api_logs.txt');

async function logToFile(msg: string) {
  const timestamp = new Date().toISOString();
  await fs.appendFile(LOG_FILE, `[${timestamp}] ${msg}\n`);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
       return NextResponse.json({ success: false, error: 'Missing property ID' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Explicitly select brochurePdf to ensure it is not excluded by any global filters
    const property = await IQProperty.findById(id).select('+brochurePdf').lean();

    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    await logToFile(`FETCH: Property '${property.name}' requested. hasPdf: ${!!property.brochurePdf}`);

    return NextResponse.json({ success: true, property });
  } catch (err: any) {
    console.error('Fetch property detail error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
