import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Owner from '@/models/Owner';

export async function GET() {
  try {
    await connectToDatabase();
    const owners = await Owner.find({}, { name: 1, email: 1, role: 1 });
    const adminExists = !!(await Owner.findOne({ email: 'admin@gharpayy.com' }));
    
    return NextResponse.json({
      db_status: 'Connected',
      total_owners: owners.length,
      owners_list: owners,
      admin_gharpayy_exists: adminExists
    });
  } catch (error: any) {
    return NextResponse.json({ db_status: 'Error', error: error.message });
  }
}
