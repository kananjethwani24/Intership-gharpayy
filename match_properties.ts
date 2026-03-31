import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
    const csvContent = fs.readFileSync('uploads_from_boss/WARZONE  - Availablity check (1).csv', 'utf-8');
    const records = parse(csvContent, {
        columns: false,
        skip_empty_lines: true,
        from_line: 3 // Data starts from line 3
    });

    const dbProperties = await prisma.propertyMaster.findMany();
    const updates: any[] = [];

    for (const record of records) {
        const csvName = record[1]?.trim();
        const availability = parseInt(record[5]);

        if (!csvName || isNaN(availability)) continue;

        // Simple fuzzy match: check if names contain each other (case-insensitive)
        let match = dbProperties.find(p => 
            p.name.toLowerCase().includes(csvName.toLowerCase()) || 
            csvName.toLowerCase().includes(p.name.toLowerCase())
        );

        // Try a bit more aggressive matching if no direct match
        if (!match) {
            const cleanCsvName = csvName.toLowerCase().replace(/coed|girls|boys|colive|flatlike/g, '').trim();
            match = dbProperties.find(p => 
                p.name.toLowerCase().includes(cleanCsvName) || 
                cleanCsvName.includes(p.name.toLowerCase())
            );
        }

        if (match) {
            updates.push({
                csvName,
                dbName: match.name,
                dbId: match.id,
                availability
            });
        } else {
            console.log(`No match found for CSV Property: "${csvName}"`);
        }
    }

    console.log('\Proposed Updates:');
    console.log(JSON.stringify(updates, null, 2));
    
    // Write to a file for review
    fs.writeFileSync('proposed_updates.json', JSON.stringify(updates, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
