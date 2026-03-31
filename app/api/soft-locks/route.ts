import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SoftLock from '@/models/SoftLock';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    
    await connectToDatabase();
    
    let query = SoftLock.find({ isActive: true, expiresAt: { $gt: new Date() } })
      .populate('leadId')
      .populate('lockedBy');
      
    if (roomId) query = query.where('roomId').equals(roomId);
    
    const locks = await query.sort({ createdAt: -1 });
    
    const transformedLocks = (locks as any[]).map(l => ({
      ...l.toObject(),
      id: l._id,
      leads: l.leadId,
      agents: l.lockedBy
    }));

    return NextResponse.json(transformedLocks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    // Fallbyck logic if lockedBy is missing (since admin auth isn't fully integrated here)
    if (!body.lockedBy) {
       const firstAdmin = await mongoose.model('Agent').findOne({ role: 'admin' }) as any;
       body.lockedBy = firstAdmin?._id || new mongoose.Types.ObjectId();
    }
    if (!body.lockType) body.lockType = 'visit';
    
    const lock = await SoftLock.create(body);
    return NextResponse.json(lock, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
