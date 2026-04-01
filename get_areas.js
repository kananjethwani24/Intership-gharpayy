const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/pgData.json', 'utf8'));
const areas = [...new Set(data.map(p => p.area))].sort();
console.log(areas);
