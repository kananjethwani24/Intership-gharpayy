import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  context: any
) {
  const { id } = context.params;
  try {
    const mongoose = await clientPromise();
    const db = mongoose.connection.db;
    
    if (!db) throw new Error("Database not connected");

    const property = await db.collection("iqproperties").findOne(
      { _id: new ObjectId(id) },
      { projection: { brochurePdf: 1, name: 1 } }
    );

    if (!property || !property.brochurePdf) {
      return NextResponse.json({ error: 'Brochure not found' }, { status: 404 });
    }

    // Parse the base64 data URL
    const dataUrl: string = property.brochurePdf;
    const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `${(property.name as string).replace(/\s+/g, '_')}_Brochure.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error serving brochure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
