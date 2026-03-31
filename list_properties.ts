import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.propertyMaster.findMany({
    select: { id: true, name: true, area: true }
  });

  fs.writeFileSync('properties_db.json', JSON.stringify(properties, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
