
const fs = require('fs');

// 1. Load Data
const pgData = JSON.parse(fs.readFileSync('src/data/pgData.json', 'utf8'));
const geoEntries = JSON.parse(fs.readFileSync('tmp_geo.json', 'utf8'));

// AVG PRICES for different regions
const REGION_PRICES = {
  'South': 11000,
  'Central': 13000,
  'East': 11500,
  'North': 9500,
  'Far South': 8000,
  'CBD': 15000,
  'ORR Belt': 10500,
  'Koramangala': 12500,
  'HSR Layout': 11500,
  'Whitefield': 11000,
  'Electronic City': 8500,
  'Indiranagar': 13500,
  'BTM Layout': 9500,
  'JP Nagar': 10000,
  'Hebbal': 11000,
  'Manyata': 10000
};

console.log(`Refining ${pgData.length} PGs with mandatory pricing and precise geo-mapping...`);

const normalize = (s) => (s || '').toString().toLowerCase().trim().replace(/[\s-]/g, '');

const updatedPgData = pgData.map(pg => {
  // 1. Geographic Refinement
  // (We use a logic that will also work in the UI-layer later, but pre-tagging is better)
  let bestGeo = geoEntries.find(g => normalize(`${pg.name} ${pg.area} ${pg.locality}`).includes(normalize(g['Area Name'])));
  
  if (!bestGeo) {
    bestGeo = geoEntries.find(g => normalize(`${pg.name} ${pg.area} ${pg.locality}`).includes(normalize(g['Parent Area'])));
  }

  if (bestGeo) {
    pg.area = bestGeo['Parent Area'] || bestGeo['Area Name'];
    pg.subArea = bestGeo['Area Name'];
  }

  // 2. Mandatory Price Fix
  // If minPrice is still 0, we MUST assign a fallback based on its area or region
  if (!pg.minPrice || pg.minPrice === 0) {
    // Determine the price based on area name or parent area
    const pArea = pg.area || 'Bangalore';
    const fallbackPrice = REGION_PRICES[pArea] || (bestGeo ? REGION_PRICES[bestGeo['Region']] : 9500) || 9500;
    
    pg.minPrice = fallbackPrice;
    pg.triplePrice = pg.minPrice;
    pg.doublePrice = Math.round(pg.minPrice * 1.3);
    pg.singlePrice = Math.round(pg.minPrice * 1.8);
    console.log(`  Fixed Price for [${pg.name}] in [${pArea}] -> ₹${pg.minPrice}`);
  }

  return pg;
});

fs.writeFileSync('src/data/pgData.json', JSON.stringify(updatedPgData, null, 2));
console.log('Refinement Complete.');
