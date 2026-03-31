import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth-service';

export async function GET() {
  try {
     const authUser = await getAuthUser();
     await connectToDatabase();
     
     // 1. Check if ANY user exists to promote
     const users = await User.find({});
     if (users.length === 0) return NextResponse.json({ error: 'No users found in database' });

     // 2. Promote the current logged in user (if any) or just the first user
     const userToPromote = users.find(u => u.email === authUser?.email) || users[0];
     
     const oldRole = userToPromote.role;
     userToPromote.role = 'admin';
     await userToPromote.save();
     
     return NextResponse.json({ 
       email: userToPromote.email, 
       oldRole, 
       newRole: userToPromote.role, 
       jwtRole: authUser?.role,
       isAdmin: userToPromote.role === 'admin'
     });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
