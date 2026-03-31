import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Owner from '@/models/Owner';
import { setAuthCookie } from '@/lib/auth-service';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'gharpayy@123';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin!123admin@123admin';

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password } = await req.json();
    const emailOrUsername = rawEmail?.trim();

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required' }, { status: 400 });
    }

    // 1. Check hardcoded Admin credentials
    if (emailOrUsername === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const user = {
        id: 'admin-id-static',
        email: ADMIN_USERNAME,
        fullName: 'Administrator',
        role: 'admin' as const
      };
      
      await setAuthCookie({ 
        id: user.id, 
        email: user.email, 
        role: 'admin', 
        name: user.fullName 
      });

      return NextResponse.json({ message: 'Logged in as Admin', user });
    }

    await connectToDatabase();

    // 2. Check for Owner (searching by username OR email)
    const owner = await Owner.findOne({ 
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });

    if (owner) {
      const isMatch = await bcrypt.compare(password, owner.password);
      if (isMatch) {
         await setAuthCookie({ 
           id: owner._id.toString(), 
           email: owner.email, 
           role: 'owner', 
           name: owner.name,
           username: owner.username
         });

         return NextResponse.json({
           message: 'Logged in as Owner',
           user: {
             id: owner._id,
             email: owner.email,
             fullName: owner.name,
             username: owner.username,
             role: 'owner'
           }
         });
      }
    }

    // 3. Fallback to regular User (Admin/Staff DB)
    const user = await User.findOne({ email: emailOrUsername.toLowerCase() });
    if (user && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        await setAuthCookie({ 
          id: user._id.toString(), 
          email: user.email, 
          role: user.role, 
          name: user.fullName 
        });

        return NextResponse.json({
          message: 'Logged in successfully',
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }
        });
      }
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

