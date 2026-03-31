import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PG_DATA } from '../../../../src/data/pgMasterData';

export async function POST() {
  try {
    // We will assign all imported master data to a specific "Master" owner, or the first owner in DB
    let masterOwner = await prisma.user.findFirst({ where: { role: 'OWNER', email: 'master@owner.com' } });
    if (!masterOwner) {
      masterOwner = await prisma.user.create({
        data: { name: 'Master Vendor', email: 'master@owner.com', phone: '9999999999', password: 'password123', role: 'OWNER' }
      });
    }

    // Get an admin user for auto-approving
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const adminId = adminUser ? adminUser.id : masterOwner.id;

    let propsCreated = 0;
    let roomsCreated = 0;

    for (const pg of PG_DATA) {
      // Check if this property already exists
      const existing = await prisma.propertyMaster.findFirst({
        where: { name: pg.name, area: pg.area }
      });

      if (!existing) {
        const prop = await prisma.propertyMaster.create({
          data: {
            name: pg.name,
            area: pg.area,
            gender_allowed: pg.gender,
            amenities: pg.amenities.join(', ') || 'WiFi, Food, Cleaning',
            room_config: 'Single, Double, Triple',
            ownerId: masterOwner.id,
            base_rules: pg.houseRules,
          }
        });
        propsCreated++;

        // Add rooms for this property
        const roomConfigs = [
          { type: 'Single', price: pg.singlePrice, cap: 1 },
          { type: 'Double', price: pg.doublePrice, cap: 2 },
          { type: 'Triple', price: pg.triplePrice, cap: 3 }
        ];

        let roomCounter = 101;
        for (const config of roomConfigs) {
          if (config.price) {
            const room = await prisma.roomMaster.create({
              data: {
                propertyId: prop.id,
                room_number: `${roomCounter}`,
                capacity: config.cap,
                base_price: config.price,
                default_gender: pg.gender,
              }
            });
            roomsCreated++;
            roomCounter++;

            // Give it an initial availability if it has minPrice (assuming it's a proxy for market availability)
            if (pg.availability) {
              await prisma.availabilityUpdate.create({
                data: {
                  roomId: room.id,
                  availability_type: 'available_now',
                  expected_price: config.price,
                  confirmed_by: masterOwner.id,
                  remarks: 'Autosynced from 3X MEGA sheet'
                }
              });

              // Create Retail state
              await prisma.retailRoom.create({
                data: {
                  roomId: room.id,
                  retail_status: 'AVAILABLE',
                  pricing_tier: config.price > 14000 ? 'PREMIUM' : config.price > 9000 ? 'MID' : 'BUDGET',
                }
              });
            } else {
               // Locked room
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Migrated MEGA Database to Prisma: ${propsCreated} properties and ${roomsCreated} rooms added.` 
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
