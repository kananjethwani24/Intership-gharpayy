import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const csvPath = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/uploads_from_boss/WARZONE  - Availablity check (1).csv';
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at', csvPath);
    return;
  }

  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
  
  // Row 2 is headers (0-indexed line 1)
  const rows = lines.slice(2);
  
  console.log(`Processing ${rows.length} entries from boss CSV...`);

  for (const row of rows) {
    const parts = [];
    let inQuotes = false;
    let current = '';
    for (let char of row) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { parts.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
        else current += char;
    }
    parts.push(current.trim().replace(/^"|"$/g, ''));

    const propName = parts[1]; // PROPERTY
    const area = parts[2];     // AREA
    const rawAvail = parts[5]; // AVAILABLITY
    const ytLink = parts[13];  // Col 14 (13-indexed)

    if (!propName || propName === 'PROPERTY' || propName === '-') continue;

    const availCount = parseInt(rawAvail) || 0;
    console.log(`- ${propName} (${area}): ${availCount} available, YT: ${ytLink ? 'YES' : 'NO'}`);

    // 1. Find or Create Property
    let property = await prisma.propertyMaster.findFirst({
      where: { name: { contains: propName } }
    });

    if (!property) {
      // Find a default owner or create one
      let owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
      if (!owner) {
          owner = await prisma.user.create({
              data: { name: "Default Owner", email: `owner_${Date.now()}@gharpayy.com`, password: "password", role: "OWNER" }
          });
      }
      property = await prisma.propertyMaster.create({
        data: {
          name: propName,
          area: area || "Unknown",
          gender_allowed: propName.toLowerCase().includes('girls') ? "GIRLS" : "BOYS",
          ownerId: owner.id
        }
      });
    }

    // 2. Sync Rooms
    // We want to ensure at least 'availCount' rooms are marked AVAILABLE/now
    const currentRooms = await prisma.roomMaster.findMany({ where: { propertyId: property.id } });
    
    // If we have fewer total rooms than availCount, add more
    if (currentRooms.length < availCount) {
        const toAdd = availCount - currentRooms.length;
        for (let i = 0; i < toAdd; i++) {
            await prisma.roomMaster.create({
                data: {
                    propertyId: property.id,
                    room_number: `${100 + currentRooms.length + i + 1}`,
                    capacity: 2,
                    base_price: 8000
                }
            });
        }
    }

    // Refresh rooms list
    const allRooms = await prisma.roomMaster.findMany({ 
        where: { propertyId: property.id },
        include: { availability: true }
    });

    // Mark 'availCount' rooms as available_now
    for (let i = 0; i < allRooms.length; i++) {
        const room = allRooms[i];
        const isAvailable = i < availCount;
        
        await prisma.roomMaster.update({
            where: { id: room.id },
            data: { 
                youtube_link: ytLink || room.youtube_link,
                isLocked: false 
            }
        });

        if (isAvailable) {
            await prisma.availabilityUpdate.upsert({
                where: { roomId: room.id },
                update: { availability_type: 'available_now' },
                create: { roomId: room.id, availability_type: 'available_now' }
            });
        } else {
            // maybe occupied or locked
            await prisma.availabilityUpdate.upsert({
                where: { roomId: room.id },
                update: { availability_type: 'occupied' },
                create: { roomId: room.id, availability_type: 'occupied' }
            });
        }
    }
  }

  console.log('Sync complete!');
  process.exit(0);
}

run().catch(console.error).finally(() => prisma.$disconnect());
