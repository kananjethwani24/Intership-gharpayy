import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.propertyMaster.findMany({
    include: { _count: { select: { rooms: true } } }
  });

  console.log('Property Counts:');
  properties.forEach(p => {
    console.log(`${p.name} (${p.area}): ${p._count.rooms} rooms`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
