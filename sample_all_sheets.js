import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';

function main() {
    const filename = 'uploads_from_boss/Gharpayy_Bangalore_MEGA_Database.xlsx';
    try {
        const workbook = XLSX.readFile(filename);
        const results = {};
        for (const name of workbook.SheetNames) {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet);
            results[name] = data.slice(0, 5);
        }
        fs.writeFileSync('all_sheets_sample.json', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Error reading excel:', e);
    }
}

main();
