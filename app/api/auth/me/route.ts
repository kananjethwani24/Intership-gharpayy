import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Owner from '@/models/Owner';
import { getAuthUser } from '@/lib/auth-service';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ user: null });

    // Handle static admin
    if (authUser.id === 'admin-id-static') {
      return NextResponse.json({
        user: {
          id: 'admin-id-static',
          email: authUser.email,
          fullName: 'Administrator',
          role: 'admin'
        }
      });
    }

    await connectToDatabase();

    // Fetch full data based on role
    if (authUser.role === 'owner') {
      const owner = await Owner.findById(authUser.id).select('-password');
      if (!owner) return NextResponse.json({ user: null });
      
      return NextResponse.json({ 
        user: {
          id: owner._id,
          email: owner.email,
          fullName: owner.name,
          username: owner.username,
          role: 'owner'
        }
      });
    }

    const user = await User.findById(authUser.id).select('-password');
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Me Auth Error:', error);
    return NextResponse.json({ user: null });
  }
}

