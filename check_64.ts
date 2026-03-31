import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p = await prisma.propertyMaster.findUnique({
    where: { id: 64 },
    include: { _count: { select: { rooms: true } } }
  });
  console.log(JSON.stringify(p, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
