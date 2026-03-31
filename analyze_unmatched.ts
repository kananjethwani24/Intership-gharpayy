import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
    const csvContent = fs.readFileSync('uploads_from_boss/WARZONE  - Availablity check (1).csv', 'utf-8');
    const records = parse(csvContent, {
        columns: false,
        skip_empty_lines: true,
        from_line: 2 // Look at headers too
    });

    const dbProperties = await prisma.propertyMaster.findMany();
    const matchedIds = new Set(JSON.parse(fs.readFileSync('proposed_updates.json', 'utf-8')).map((u:any) => u.dbId));

    console.log('Unmatched DB Properties:');
    dbProperties.forEach(p => {
        if (!matchedIds.has(p.id)) {
            console.log(`- ID: ${p.id}, name: "${p.name}", area: "${p.area}"`);
        }
    });

    // Also look for CSV properties that were NOT matched
    console.log('\nUnmatched CSV Properties:');
    for (const record of records) {
        const csvName = record[1]?.trim();
        if (!csvName || csvName === 'PROPERTY') continue;
        
        const isMatched = JSON.parse(fs.readFileSync('proposed_updates.json', 'utf-8')).some((u:any) => u.csvName.toLowerCase() === csvName.toLowerCase());
        if (!isMatched) {
             console.log(`- "${csvName}" (Row ${records.indexOf(record) + 2})`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
