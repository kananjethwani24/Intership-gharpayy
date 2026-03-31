import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import Owner from '@/models/Owner';

export async function GET() {
  try {
    await connectToDatabase();
    const props = await Property.find({}, { name: 1, ownerId: 1 });
    const owners = await Owner.find({}, { name: 1, email: 1 });
    
    return NextResponse.json({
      properties_in_db: props,
      owners_in_db: owners
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
