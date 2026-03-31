import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password } = await req.json();
    const email = rawEmail?.trim()?.toLowerCase();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find owner by email
    const owner = await Owner.findOne({ email });
    if (!owner || !owner.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: owner._id,
        email: owner.email,
        role: 'owner',
        name: owner.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('owner_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      message: 'Owner logged in successfully',
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        companyName: owner.companyName,
        role: 'owner',
      },
    });
  } catch (error: any) {
    console.error('Owner login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
