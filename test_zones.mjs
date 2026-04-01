import { getZoneByArea, SUBZONE_MAPPING } from './src/lib/zones.js';

const areas = ["HSR Layout", "JP Nagar", "Jayanagar", "Koramangala"];
areas.forEach(a => {
  const res = getZoneByArea(a);
  console.log(`${a} -> ${res.zone} (${res.subzone})`);
});

// Print mapping keys to see if any hijacks
console.log('\nMapping Keys sort by length:');
console.log(Object.keys(SUBZONE_MAPPING).sort((a,b) => b.length - a.length).slice(0, 10));
