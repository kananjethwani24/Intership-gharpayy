import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';
import { getAuthUser, isAdmin } from '@/lib/auth-service';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    const adminMode = user?.role === 'admin';
    console.log(`OWNERS API: Request from ${user?.email}, Role=${user?.role}, isAdmin=${adminMode}`);

    if (!adminMode) {
       return NextResponse.json({ error: `Unauthorized: Admin access required (Your role: ${user?.role || 'Guest'})` }, { status: 403 });
    }

    await connectToDatabase();
    const owners = await Owner.find({}).sort({ createdAt: -1 });
    return NextResponse.json(owners);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const adminMode = user?.role === 'admin';

    if (!adminMode) {
       return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { name, email, phone, username, password, exactPgName, gharpayyPgName, companyName, notes } = await req.json();

    if (!name || !email || !username || !password) {
       return NextResponse.json({ error: 'Missing required fields: name, email, username, password' }, { status: 400 });
    }

    await connectToDatabase();

    // Check uniqueness
    const existing = await Owner.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
       return NextResponse.json({ error: 'Email or Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const owner = await Owner.create({
      name,
      email: email.toLowerCase(),
      phone,
      username,
      password: hashedPassword,
      exactPgName,
      gharpayyPgName,
      companyName,
      notes,
      role: 'owner'
    });

    // AUTO-LINK: Assign ownerId to any existing properties matching these names
    const Property = (await import('@/models/Property')).default;
    const names = [exactPgName, gharpayyPgName].filter(Boolean);
    if (names.length > 0) {
      await Property.updateMany(
        { name: { $in: names } },
        { ownerId: owner._id }
      );
    }

    return NextResponse.json({ 
       message: 'Owner created successfully and properties linked', 
       id: owner._id 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
