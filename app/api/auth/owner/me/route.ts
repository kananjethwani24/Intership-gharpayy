import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('owner_auth_token')?.value;

    if (!token) {
      return NextResponse.json({ owner: null }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    await connectToDatabase();
    const owner = await Owner.findById(decoded.userId).select('-password');

    if (!owner) {
      return NextResponse.json({ owner: null }, { status: 401 });
    }

    return NextResponse.json({
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        companyName: owner.companyName,
        role: 'owner',
      },
    });
  } catch (error) {
    return NextResponse.json({ owner: null }, { status: 401 });
  }
}
