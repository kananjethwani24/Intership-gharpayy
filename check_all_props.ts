import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const p = await prisma.propertyMaster.findMany();
  fs.writeFileSync('all_db_props.json', JSON.stringify(p, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
