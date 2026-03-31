import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, companyName } = await req.json();

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, phone' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if owner already exists
    const existingOwner = await Owner.findOne({ email: email.trim().toLowerCase() });
    if (existingOwner) {
      return NextResponse.json(
        { error: 'An owner with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create owner
    const newOwner = await Owner.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone,
      companyName: companyName || undefined,
    });

    return NextResponse.json(
      {
        message: 'Owner registered successfully',
        owner: {
          id: newOwner._id,
          name: newOwner.name,
          email: newOwner.email,
          phone: newOwner.phone,
          companyName: newOwner.companyName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Owner registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
