import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';

function main() {
    const filename = 'uploads_from_boss/Gharpayy_Bangalore_MEGA_Database.xlsx';
    try {
        const workbook = XLSX.readFile(filename);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Read ${data.length} rows from ${filename}`);
        if (data.length > 0) {
            console.log('Sample data keys:', Object.keys(data[0]));
        }
        
        fs.writeFileSync('mega_db_sample.json', JSON.stringify(data.slice(0, 50), null, 2));
    } catch (e) {
        console.error('Error reading excel:', e);
    }
}

main();
