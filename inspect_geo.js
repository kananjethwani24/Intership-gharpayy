import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';

function main() {
    const filename = 'uploads_from_boss/Gharpay_Bangalore_GeoDataset_v1 (1).xlsx';
    try {
        const workbook = XLSX.readFile(filename);
        // Focus on areas master
        const sheet = workbook.Sheets['2_Areas_Master'];
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log(`Areas Master: ${data.length} rows`);
        console.log('Keys:', Object.keys(data[0] || {}));
        data.slice(0, 5).forEach(r => console.log(JSON.stringify(r)));
        
        const sheet2 = workbook.Sheets['3_Tech_Parks'];
        const data2 = XLSX.utils.sheet_to_json(sheet2);
        console.log(`\nTech Parks: ${data2.length} rows`);
        console.log('Keys:', Object.keys(data2[0] || {}));
        data2.slice(0, 3).forEach(r => console.log(JSON.stringify(r)));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
