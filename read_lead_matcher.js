import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';

function main() {
    const filename = 'uploads_from_boss/Gharpayy_Bangalore_MEGA_Database.xlsx';
    try {
        const workbook = XLSX.readFile(filename);
        const sheet = workbook.Sheets['🎯 Lead Matcher'];
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log(`Read ${data.length} rows from 🎯 Lead Matcher`);
        fs.writeFileSync('lead_matcher_sample.json', JSON.stringify(data.slice(0, 50), null, 2));
    } catch (e) {
        console.error('Error reading excel:', e);
    }
}

main();
