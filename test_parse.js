require('ts-node').register({ transpileOnly: true });
const { parseRoomEntries } = require('./src/lib/parseRoomEntries.ts');

fetch('http://localhost:3000/api/iq-properties')
  .then(res => res.json())
  .then(data => {
    const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
    if(zillion) {
       console.log("Original text:", zillion.price);
       const entries = parseRoomEntries(zillion.price, zillion.lows, zillion.priceMin, zillion.priceMax);
       console.log("Parsed entries:", entries);
    }
  })
  .catch(console.error);
