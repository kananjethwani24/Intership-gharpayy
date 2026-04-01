import fs from 'fs';
const data = JSON.parse(fs.readFileSync('src/data/pgData.json', 'utf8'));
const jp = data.filter(p => JSON.stringify(p).toLowerCase().includes('jp nagar'));
console.log(`Found ${jp.length} PGs mentioning JP Nagar`);
if (jp.length > 0) {
  console.log('Areas used for these PGs:', [...new Set(jp.map(p => p.area))]);
}
