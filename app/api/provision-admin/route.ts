import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';

export async function GET() {
  try {
    await connectToDatabase();
    let owner = await Owner.findOne({ email: 'admin@gharpayy.com' });
    
    if (!owner) {
       const hashedPassword = await bcrypt.hash('admin123', 10);
       owner = await Owner.create({
          name: 'The Admin Owner',
          email: 'admin@gharpayy.com',
          password: hashedPassword,
          role: 'owner',
          phone: '9876543210',
          companyName: 'GharPayy Management'
       });
       return NextResponse.json({ message: 'Owner admin@gharpayy.com successfully created for production!', owner });
    } else {
       // Just update password to be sure
       const hashedPassword = await bcrypt.hash('admin123', 10);
       owner.password = hashedPassword;
       await owner.save();
       return NextResponse.json({ message: 'Owner already exists. Credentials updated to admin123.', owner });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
