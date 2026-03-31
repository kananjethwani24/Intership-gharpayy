import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';
import path from 'path';

function main() {
    const filename = 'uploads_from_boss/Gharpayy_Bangalore_MEGA_Database.xlsx';
    const outDir = 'src/data/mega';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    try {
        const workbook = XLSX.readFile(filename);
        for (const name of workbook.SheetNames) {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet);
            const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            fs.writeFileSync(path.join(outDir, `${safeName}.json`), JSON.stringify(data, null, 2));
            console.log(`Saved ${data.length} rows from sheet ${name} to ${safeName}.json`);
        }
    } catch (e) {
        console.error('Error converting excel:', e);
    }
}

main();
