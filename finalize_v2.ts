import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
    const csvContent = fs.readFileSync('uploads_from_boss/WARZONE  - Availablity check (1).csv', 'utf-8');
    const records = parse(csvContent, {
        columns: false,
        skip_empty_lines: true,
        from_line: 3
    });

    const dbProperties = await prisma.propertyMaster.findMany();
    const finalUpdates = [];

    for (const record of records) {
        const csvNameOrigin = record[1]?.trim();
        const availability = parseInt(record[5]);
        const area = record[2]?.toLowerCase().trim();

        if (!csvNameOrigin || isNaN(availability)) continue;

        const csvName = csvNameOrigin.toLowerCase();
        
        let match = dbProperties.find(p => p.name.toLowerCase().replace(/[()]/g, '').includes(csvName));

        // Harder matching
        if (!match) {
            match = dbProperties.find(p => {
                const dbn = p.name.toLowerCase();
                const cleanCsv = csvName.replace(/coed|girls|boys/g, '').trim();
                const cleanDb = dbn.replace(/coed|girls|boys/g, '').trim().replace(/[()]/g, '');
                return cleanDb.includes(cleanCsv) || cleanCsv.includes(cleanDb);
            });
        }
        
        // Specifc match for the one in screenshot if needed
        if (!match && csvName.includes('whit')) {
             match = dbProperties.find(p => p.id === 64);
        }

        if (match) {
            finalUpdates.push({
                dbId: match.id,
                dbName: match.name,
                availability
            });
        } else {
            console.log(`Still no match for: ${csvNameOrigin}`);
        }
    }

    console.log(`Found ${finalUpdates.length} properties to update.`);

    for (const update of finalUpdates) {
        const { dbId, dbName, availability } = update;
        
        const currentRooms = await prisma.roomMaster.findMany({
            where: { propertyId: dbId },
            orderBy: { id: 'asc' }
        });

        if (currentRooms.length < availability) {
            const lastRoomNum = currentRooms.length > 0 && !isNaN(parseInt(currentRooms[currentRooms.length-1].room_number)) 
                ? parseInt(currentRooms[currentRooms.length-1].room_number) : 100;
            
            for (let i = 1; i <= (availability - currentRooms.length); i++) {
                await prisma.roomMaster.create({
                    data: {
                        propertyId: dbId,
                        room_number: String(lastRoomNum + 100 * i),
                        capacity: 2,
                        base_price: currentRooms[0]?.base_price || 15000
                    }
                });
            }
        }

        // Get all rooms (old + new)
        const allRooms = await prisma.roomMaster.findMany({
            where: { propertyId: dbId },
            orderBy: { id: 'asc' }
        });

        // Mark correct count as live
        for (let i = 0; i < allRooms.length; i++) {
            const room = allRooms[i];
            const isLive = i < availability;

            await prisma.availabilityUpdate.upsert({
                where: { roomId: room.id },
                update: {
                    availability_type: isLive ? 'available_now' : 'occupied',
                    updated_at: new Date()
                },
                create: {
                    roomId: room.id,
                    availability_type: isLive ? 'available_now' : 'occupied'
                }
            });

            await prisma.retailRoom.upsert({
                where: { roomId: room.id },
                update: {
                    retail_status: 'approved',
                    updated_at: new Date()
                },
                create: {
                    roomId: room.id,
                    retail_status: 'approved'
                }
            });
        }
        console.log(`Updated ${dbName} to ${availability} live units.`);
    }

    console.log('Update complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
