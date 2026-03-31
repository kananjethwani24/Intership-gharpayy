import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
     await connectToDatabase();
     const users = await User.find({});
     return NextResponse.json({ 
       count: users.length,
       users: users.map(u => ({ email: u.email, role: u.role }))
     });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
