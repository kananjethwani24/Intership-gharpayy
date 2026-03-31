import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import IQProperty from '@/models/IQProperty';
import { heuristicExtract } from '@/lib/heuristicExtractor';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { images, text, propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
    }

    await connectToDatabase();
    const updateFields: any = {};

    // 1. Handle Images (Extracted from PDF on client)
    if (images && Array.isArray(images)) {
      const publicExtractedDir = path.join(process.cwd(), 'public', 'extracted', propertyId);
      if (!fs.existsSync(publicExtractedDir)) {
        fs.mkdirSync(publicExtractedDir, { recursive: true });
      }

      const savedPhotoPaths: string[] = [];
      images.slice(0, 10).forEach((base64: string, idx: number) => {
        const parts = base64.split(',');
        if (parts.length < 2) return;
        const fileName = `page_${idx + 1}.jpg`;
        const filePath = path.join(publicExtractedDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(parts[1], 'base64'));
        savedPhotoPaths.push(`/extracted/${propertyId}/${fileName}`);
      });
      
      updateFields.extractedPhotos = savedPhotoPaths;
    }

    // 2. Handle Text (Pasted in dialog)
    if (text) {
      const extracted = heuristicExtract(text);
      if (extracted.price) updateFields.price = extracted.price;
      if (extracted.priceMin) updateFields.priceMin = extracted.priceMin;
      if (extracted.priceMax) updateFields.priceMax = extracted.priceMax;
      if (extracted.area) updateFields.area = extracted.area;
      if (extracted.gender) updateFields.gender = extracted.gender;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const updated = await IQProperty.findByIdAndUpdate(propertyId, { $set: updateFields }, { new: true });

    return NextResponse.json({ success: true, property: updated });
  } catch (error: any) {
    console.error('Local Sync Error:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}
