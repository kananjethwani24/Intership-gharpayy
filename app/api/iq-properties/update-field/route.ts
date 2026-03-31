import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { propertyId, field, value } = await request.json();

    if (!propertyId || !field) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const mongoose = await clientPromise();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Database not connected");

    const updateResult = await db.collection("iqproperties").updateOne(
      { _id: new ObjectId(propertyId) },
      { $set: { [field]: value } }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: 'Property not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating property field:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
