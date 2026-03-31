const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the GeoDataset
const wb = xlsx.readFile(path.join(__dirname, 'uploads_from_boss/Gharpay_Bangalore_GeoDataset_v1 (2).xlsx'));

// Find a sheet with PG/property data by looking for PG-like headers
wb.SheetNames.forEach(sn => {
  const data = xlsx.utils.sheet_to_json(wb.Sheets[sn], {header:1});
  if (data.length > 0 && data[0]) {
    const headers = data[0].join(' ').toLowerCase();
    // Only print sheets that look like PG property data
    if (headers.includes('pg') || headers.includes('name') || headers.includes('price') || headers.includes('rent') || headers.includes('property')) {
      console.log(`\n=== Sheet: ${sn} (${data.length} rows) ===`);
      console.log('HEADERS:', JSON.stringify(data[0]));
      if (data.length > 1) console.log('ROW 1:', JSON.stringify(data[1]).slice(0, 600));
      if (data.length > 2) console.log('ROW 2:', JSON.stringify(data[2]).slice(0, 600));
    }
  }
});

// Now read the MEGA Database - specifically look at the IQ sheet / property listing
const wb2 = xlsx.readFile(path.join(__dirname, 'uploads_from_boss/Gharpayy_Bangalore_MEGA_Database (2).xlsx'));
console.log('\n\nMEGA DB Sheets:', wb2.SheetNames);

// The 3x jsx file has all the PG data we need - let's also check the Inventory OS folder
const osDir = path.join(__dirname, 'uploads_from_boss/Gharpayy Inventory OS (1) (2)');
if (fs.existsSync(osDir)) {
  const files = fs.readdirSync(osDir, { recursive: true });
  console.log('\nInventory OS files:', files);
}
