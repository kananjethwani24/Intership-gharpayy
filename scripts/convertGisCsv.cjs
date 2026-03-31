const fs = require('fs');
const path = require('path');

const GIS_DIR = path.join(__dirname, '..', 'src', 'data', 'bangalore-gis');
const OUTPUT_FILE = path.join(GIS_DIR, 'mergedLocations.json');

function parseCsv(filename, startRow = 3, mapping) {
    const filePath = path.join(GIS_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filename}`);
        return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = [];

    for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith(',')) continue;

        // Simple CSV split (not handling escaped commas, but GIS data usually doesn't have them in lat/lng)
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        
        const node = mapping(parts);
        if (node && node.name && !isNaN(node.lat) && !isNaN(node.lng)) {
            results.push(node);
        }
    }
    return results;
}

const merged = [];

// 1. PIN Codes
merged.push(...parseCsv('pincodes.csv', 3, parts => ({
    name: parts[1],
    pinCode: parts[0],
    lat: parseFloat(parts[2]),
    lng: parseFloat(parts[3]),
    type: 'area',
    zone: parts[4]
})));

// 2. Tech Parks
merged.push(...parseCsv('techparks.csv', 3, parts => ({
    name: parts[0],
    address: parts[1],
    pinCode: parts[2],
    zone: parts[3],
    lat: parseFloat(parts[4]),
    lng: parseFloat(parts[5]),
    type: 'tech-park'
})));

// 3. Metro Stations
merged.push(...parseCsv('metrostations.csv', 3, parts => ({
    name: parts[1],
    line: parts[0],
    lat: parseFloat(parts[2]),
    lng: parseFloat(parts[3]),
    type: 'metro-station'
})));

// 4. Landmarks
merged.push(...parseCsv('landmarks.csv', 3, parts => ({
    name: parts[0],
    lat: parseFloat(parts[1]),
    lng: parseFloat(parts[2]),
    type: 'landmark',
    pinCode: parts[3]
})));

// 5. Sublocalities
merged.push(...parseCsv('sublocalities.csv', 3, parts => ({
    name: parts[0],
    parentArea: parts[1],
    lat: parseFloat(parts[2]),
    lng: parseFloat(parts[3]),
    type: 'sub-area',
    pinCode: parts[4]
})));

console.log(`Successfully merged ${merged.length} locations.`);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2));
console.log(`Saved to ${OUTPUT_FILE}`);
