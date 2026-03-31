import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.roomMaster.findMany({
    where: { propertyId: 97 }, // BELL COED
    orderBy: { id: 'asc' }
  });

  console.log(JSON.stringify(rooms, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
