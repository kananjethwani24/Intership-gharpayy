import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Restoring Legacy DB...');

  // 1. Read the legacy dump
  const dumpRaw = fs.readFileSync(path.join(process.cwd(), 'legacy_db_dump.json'), 'utf8');
  const legacyData = JSON.parse(dumpRaw);
  const { properties, rooms } = legacyData;

  console.log(`Found ${properties.length} Properties and ${rooms.length} Rooms in legacy dump.`);

  // 2. Clear current database
  await prisma.actionLog.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.availabilityUpdate.deleteMany();
  await prisma.retailRoom.deleteMany();
  await prisma.roomMaster.deleteMany();
  await prisma.propertyMaster.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing PostgreSQL tables.');

  // 3. Create generic owner users
  const password = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: { name: 'Gharpayy Admin', email: `admin_${Date.now()}@gharpayy.com`, phone: '9999999999', password, role: 'ADMIN' }
  });

  const ownerIds: number[] = [];
  for (let i = 1; i <= 5; i++) {
    const newOwner = await prisma.user.create({
      data: { 
        name: `Owner ${i}`, 
        email: `owner_${i}_${Date.now()}@gharpayy.com`, 
        phone: `9777777${String(i).padStart(3, '0')}`, 
        password, 
        role: 'OWNER' 
      }
    });
    ownerIds.push(newOwner.id);
  }

  // 4. Restore properties
  const propIdMap: Record<number, number> = {};
  for (const p of properties) {
    const assignedOwner = ownerIds[p.ownerId % ownerIds.length] || ownerIds[0];
    const newProp = await prisma.propertyMaster.create({
      data: {
        name: p.name,
        area: p.area || 'Bangalore',
        gender_allowed: p.gender_allowed || 'Co-ed',
        amenities: p.amenities || 'WiFi, CCTV',
        room_config: p.room_config || '1/2/3 Sharing',
        ownerId: assignedOwner,
      }
    });
    propIdMap[p.id] = newProp.id;
  }

  console.log('Restored properties...');

  // 5. Restore rooms
  let roomCount = 0;
  for (const r of rooms) {
    if (!propIdMap[r.propertyId]) continue; // orphan room

    const newRoom = await prisma.roomMaster.create({
      data: {
        propertyId: propIdMap[r.propertyId],
        room_number: r.room_number || String(r.id),
        capacity: r.capacity || 2,
        base_price: r.base_price || 8000,
        isLocked: r.isLocked === 1 || r.isLocked === true,
      }
    });
    roomCount++;

    // Randomly assign availability to make them "live units" for the inventory
    // Give 60% of them availability
    const isAvail = Math.random() < 0.6;
    if (isAvail) {
      await prisma.availabilityUpdate.create({
        data: {
          roomId: newRoom.id,
          availability_type: 'available_now',
          expected_price: (r.base_price || 8000) * 1.1,
          confirmed_by: ownerIds[0]
        }
      });
      
      // Approve half of the available ones for retail
      const isApproved = Math.random() < 0.5;
      if (isApproved) {
        await prisma.retailRoom.create({
          data: {
            roomId: newRoom.id,
            retail_status: 'APPROVED',
            retail_price: (r.base_price || 8000) * 1.2,
            pricing_tier: (r.base_price > 12000) ? 'PREMIUM' : 'MID',
            approved_by: admin.id
          }
        });
      }
    }
  }
  
  console.log(`Restored ${roomCount} root rooms and simulated Live Unit approval pipeline.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
