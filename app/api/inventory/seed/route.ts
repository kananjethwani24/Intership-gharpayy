import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/inventory/seed — Creates data seeded from GharPayy MEGA Database
export async function POST() {
  try {
    // Clear existing data in correct constraint order
    await prisma.actionLog.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.availabilityUpdate.deleteMany();
    await prisma.retailRoom.deleteMany();
    await prisma.roomMaster.deleteMany();
    await prisma.propertyMaster.deleteMany();
    await prisma.user.deleteMany();

    const password = await bcrypt.hash('password123', 12);

    // Create team users
    const admin = await prisma.user.create({
      data: { name: 'Gharpayy Admin', email: 'admin@gharpayy.com', phone: '9999999999', password, role: 'ADMIN' }
    });
    const sales1 = await prisma.user.create({
      data: { name: 'Ravi Sales', email: 'ravi@gharpayy.com', phone: '9888888888', password, role: 'SALES' }
    });

    // Create owners (one per cluster)
    const owners = await Promise.all([
      prisma.user.create({ data: { name: 'Suresh Patel', email: 'suresh@owner.com', phone: '9777777771', password, role: 'OWNER' } }),
      prisma.user.create({ data: { name: 'Meena Reddy', email: 'meena@owner.com', phone: '9777777772', password, role: 'OWNER' } }),
      prisma.user.create({ data: { name: 'Ramesh Nair', email: 'ramesh@owner.com', phone: '9777777773', password, role: 'OWNER' } }),
      prisma.user.create({ data: { name: 'Anita Shah', email: 'anita@owner.com', phone: '9777777774', password, role: 'OWNER' } }),
    ]);

    // Properties seeded from real Gharpayy data covering MEGA zone areas
    const propsList = [
      // Koramangala cluster
      { name: 'BELL KORAMANGALA BOYS', area: 'Koramangala', gender_allowed: 'Boys', ownerIdx: 0 },
      { name: 'BELL KORAMANGALA GIRLS', area: 'Koramangala', gender_allowed: 'Girls', ownerIdx: 0 },
      { name: 'ZILLION KORAMANGALA COED', area: 'Koramangala', gender_allowed: 'Co-ed', ownerIdx: 0 },
      // HSR Layout cluster
      { name: 'BELL HSR BOYS', area: 'HSR Layout', gender_allowed: 'Boys', ownerIdx: 1 },
      { name: 'BELL HSR GIRLS', area: 'HSR Layout', gender_allowed: 'Girls', ownerIdx: 1 },
      // Whitefield cluster
      { name: 'FORUM PRO WHITEFIELD', area: 'Whitefield', gender_allowed: 'Boys', ownerIdx: 2 },
      { name: 'FLEX WHITEFIELD COED', area: 'Whitefield', gender_allowed: 'Co-ed', ownerIdx: 2 },
      // Bellandur / ORR cluster
      { name: 'ZILLION BELLANDUR', area: 'Bellandur', gender_allowed: 'Boys', ownerIdx: 3 },
      { name: 'BELL BELLANDUR GIRLS', area: 'Bellandur', gender_allowed: 'Girls', ownerIdx: 3 },
      // Indiranagar cluster
      { name: 'PREMIUM INDIRANAGAR', area: 'Indiranagar', gender_allowed: 'Co-ed', ownerIdx: 0 },
      // Hebbal / Manyata cluster
      { name: 'BELL MANYATA BOYS', area: 'Hebbal', gender_allowed: 'Boys', ownerIdx: 1 },
      { name: 'FLEX THANISANDRA COED', area: 'Thanisandra', gender_allowed: 'Co-ed', ownerIdx: 1 },
      // BTM Layout cluster
      { name: 'BELL BTM BOYS', area: 'BTM Layout', gender_allowed: 'Boys', ownerIdx: 2 },
      { name: 'ZILLION BTM GIRLS', area: 'BTM Layout', gender_allowed: 'Girls', ownerIdx: 2 },
      // Electronic City cluster
      { name: 'ECITY PREMIUM BOYS', area: 'Electronic City', gender_allowed: 'Boys', ownerIdx: 3 },
      { name: 'ECITY GIRLS HOSTEL', area: 'Electronic City', gender_allowed: 'Girls', ownerIdx: 3 },
    ];

    // Price bands per area from MEGA database
    const priceBands: Record<string, { min: number; max: number }> = {
      'Koramangala': { min: 9000, max: 22000 },
      'HSR Layout': { min: 8000, max: 20000 },
      'Whitefield': { min: 7500, max: 16000 },
      'Bellandur': { min: 8500, max: 20000 },
      'Indiranagar': { min: 11000, max: 28000 },
      'Hebbal': { min: 7500, max: 16000 },
      'Thanisandra': { min: 7000, max: 15000 },
      'BTM Layout': { min: 6500, max: 14000 },
      'Electronic City': { min: 5500, max: 12000 },
    };

    const seededProps = [];
    const allRooms: any[] = [];
    let totalRooms = 0;

    for (let j = 0; j < propsList.length; j++) {
      const pData = propsList[j];
      const band = priceBands[pData.area] || { min: 7000, max: 14000 };

      const prop = await prisma.propertyMaster.create({
        data: {
          name: pData.name,
          area: pData.area,
          gender_allowed: pData.gender_allowed,
          ownerId: owners[pData.ownerIdx].id,
          amenities: 'WiFi, AC, Laundry, CCTV, Parking',
          room_config: 'Single, Double, Triple'
        }
      });
      seededProps.push(prop);

      // Create 4-7 rooms per property
      const numRooms = 4 + (j % 4);
      for (let i = 0; i < numRooms; i++) {
        const roomNum = `${(j + 1) * 100 + i + 1}`;
        const beds = (i % 3) + 1;
        const basePrice = Math.round((band.min + ((band.max - band.min) / numRooms * i)) / 100) * 100;

        const room = await prisma.roomMaster.create({
          data: {
            propertyId: prop.id,
            room_number: roomNum,
            capacity: beds,
            base_price: basePrice,
          }
        });
        allRooms.push({ room, propIndex: j, roomIndex: i });
        totalRooms++;

        // All but the last room in each property gets an availability update
        if (i < numRooms - 1) {
          await prisma.availabilityUpdate.create({
            data: {
              roomId: room.id,
              availability_type: 'available_now',
              expected_price: Math.round(basePrice * 1.05 / 100) * 100,
              confirmed_by: owners[pData.ownerIdx].id
            }
          });

          // Approve most rooms for retail visibility (APPROVED state = Live Units)
          const shouldApprove = i <= Math.floor((numRooms - 1) * 0.75); // 75% approval rate
          if (shouldApprove) {
            await prisma.retailRoom.create({
              data: {
                roomId: room.id,
                retail_status: 'APPROVED',
                retail_price: Math.round(basePrice * 1.15 / 100) * 100,
                pricing_tier: basePrice > 14000 ? 'PREMIUM' : basePrice > 9000 ? 'MID' : 'BUDGET',
                brand_notes: `Well-maintained ${beds}-bed unit in ${pData.area}. Close to major tech parks.`,
                approved_by: admin.id,
                approved_at: new Date(Date.now() - Math.random() * 7 * 86400000),
              }
            });
          } else {
            // Some rooms stay AVAILABLE (pending retail review)
            await prisma.retailRoom.create({
              data: {
                roomId: room.id,
                retail_status: 'AVAILABLE',
                pricing_tier: 'MID',
                brand_notes: '',
              }
            });
          }
        }
      }
    }

    // Add activity log entries
    const sampleRooms = allRooms.slice(0, 5);
    for (const { room } of sampleRooms) {
      await prisma.actionLog.create({
        data: {
          roomId: room.id,
          actionType: 'PITCH',
          salesUserId: sales1.id,
          notes: 'Pitched to fresh LinkedIn lead. Shared property walkthrough and pricing sheet.',
          timestamp: new Date(Date.now() - Math.random() * 3 * 86400000)
        }
      });
    }

    // Create a pending visit
    if (allRooms.length > 0) {
      await prisma.visit.create({
        data: {
          roomId: allRooms[2].room.id,
          customerName: 'Aman Sharma',
          visitType: 'Physical',
          scheduledTime: new Date(Date.now() + 86400000),
          status: 'PENDING'
        }
      });
    }

    const approvedCount = await prisma.retailRoom.count({ where: { retail_status: 'APPROVED' } });

    return NextResponse.json({
      message: '✅ GharPayy Inventory seeded from MEGA Database zone data',
      users: { admin: admin.email, sales: sales1.email, owners: owners.map(o => o.email) },
      properties: seededProps.length,
      rooms: totalRooms,
      liveUnits: approvedCount,
      password: 'password123',
    });
  } catch (e: any) {
    console.error('Seed error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
