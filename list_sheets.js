import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

function main() {
    const filename = 'uploads_from_boss/Gharpayy_Bangalore_MEGA_Database.xlsx';
    try {
        const workbook = XLSX.readFile(filename);
        console.log('Sheet Names:', workbook.SheetNames);
    } catch (e) {
        console.error('Error reading excel:', e);
    }
}

main();
