import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

function main() {
    const filename = 'uploads_from_boss/Gharpay_Bangalore_GeoDataset_v1 (1).xlsx';
    try {
        const workbook = XLSX.readFile(filename);
        console.log('Sheet Names:', workbook.SheetNames);
    } catch (e) {
        console.error('Error reading excel:', e);
    }
}

main();
