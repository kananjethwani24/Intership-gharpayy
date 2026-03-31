import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const proposedUpdates = JSON.parse(fs.readFileSync('proposed_updates.json', 'utf-8'));

    console.log(`Starting update for ${proposedUpdates.length} properties...`);

    for (const update of proposedUpdates) {
        const { dbId, availability, dbName } = update;
        
        // 1. Get current rooms
        const currentRooms = await prisma.roomMaster.findMany({
            where: { propertyId: dbId },
            orderBy: { id: 'asc' }
        });

        console.log(`Updating ${dbName} (ID: ${dbId}): has ${currentRooms.length} rooms, needs ${availability}`);

        // 2. Create more rooms if needed
        let allRooms = [...currentRooms];
        if (currentRooms.length < availability) {
            const roomsToCreate = availability - currentRooms.length;
            const lastRoomNum = currentRooms.length > 0 ? parseInt(currentRooms[currentRooms.length - 1].room_number) : 100;
            const roomsData = [];
            for (let i = 1; i <= roomsToCreate; i++) {
                roomsData.push({
                    propertyId: dbId,
                    room_number: String(isNaN(lastRoomNum) ? (100 + currentRooms.length + i) : (lastRoomNum + 100 * i)),
                    capacity: 2, // default
                    base_price: currentRooms[0]?.base_price || 15000
                });
            }
            
            // Create rooms one by one to be safe (or use createMany)
            for(const rd of roomsData) {
                const newRoom = await prisma.roomMaster.create({ data: rd });
                allRooms.push(newRoom);
            }
            console.log(`  Added ${roomsToCreate} rooms.`);
        }

        // 3. Mark the first 'availability' number of rooms as active
        // and others as occupied (if we have more)
        for (let i = 0; i < allRooms.length; i++) {
            const room = allRooms[i];
            const isLive = i < availability;

            // Upsert availability
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

            // Ensure retail status is approved so it doesn't show as 'LOCKED'
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
        
        console.log(`  ${dbName} updated.`);
    }

    console.log('Update complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
