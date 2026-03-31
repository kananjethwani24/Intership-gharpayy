import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load mapping logic
const SUBZONE_MAPPING = {
  'SG Palya': { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'Silk Board': { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'Nexus': { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'Koramangala 5th Block': { zone: 'KORA', subzone: 'Koramangala (5th–8th Block, IBC)' },
  'Koramangala 6th Block': { zone: 'KORA', subzone: 'Koramangala (5th–8th Block, IBC)' },
  'Koramangala 7th Block': { zone: 'KORA', subzone: 'Koramangala (5th–8th Block, IBC)' },
  'Koramangala 8th Block': { zone: 'KORA', subzone: 'Koramangala (5th–8th Block, IBC)' },
  'IBC': { zone: 'KORA', subzone: 'Koramangala (5th–8th Block, IBC)' },
  'HSR Layout': { zone: 'KORA', subzone: 'HSR Layout / Bommanahalli' },
  'Bommanahalli': { zone: 'KORA', subzone: 'HSR Layout / Bommanahalli' },
  'BTM Layout': { zone: 'KORA', subzone: 'BTM Layout' },
  'Jayanagar': { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'JP Nagar': { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'Indiranagar': { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'Domlur': { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'Bellandur': { zone: 'MWB', subzone: 'Bellandur / Ecoworld / Kadubeesanahalli' },
  'Ecoworld': { zone: 'MWB', subzone: 'Bellandur / Ecoworld / Kadubeesanahalli' },
  'Kadubeesanahalli': { zone: 'MWB', subzone: 'Bellandur / Ecoworld / Kadubeesanahalli' },
  'Mahadevapura': { zone: 'MWB', subzone: 'Mahadevapura / Bagmane / CV Raman Nagar' },
  'Bagmane': { zone: 'MWB', subzone: 'Mahadevapura / Bagmane / CV Raman Nagar' },
  'CV Raman Nagar': { zone: 'MWB', subzone: 'Mahadevapura / Bagmane / CV Raman Nagar' },
  'Marathahalli': { zone: 'MWB', subzone: 'Marathahalli / AECS / Thubarahalli' },
  'AECS': { zone: 'MWB', subzone: 'Marathahalli / AECS / Thubarahalli' },
  'Thubarahalli': { zone: 'MWB', subzone: 'Marathahalli / AECS / Thubarahalli' },
  'Whitefield': { zone: 'MWB', subzone: 'Whitefield / ITPL / Hope Farm' },
  'ITPL': { zone: 'MWB', subzone: 'Whitefield / ITPL / Hope Farm' },
  'Hope Farm': { zone: 'MWB', subzone: 'Whitefield / ITPL / Hope Farm' },
  'Brookfield': { zone: 'MWB', subzone: 'Brookfield / Seetharampalya' },
  'Seetharampalya': { zone: 'MWB', subzone: 'Brookfield / Seetharampalya' },
  'Sarjapur': { zone: 'MWB', subzone: 'Sarjapur / SJR' },
  'SJR': { zone: 'MWB', subzone: 'Sarjapur / SJR' },
  'Yeshwanthpur': { zone: 'YPR', subzone: 'Yeshwanthpur' },
  'Nagasandra': { zone: 'YPR', subzone: 'Nagasandra' },
  'Manyata Tech Park': { zone: 'MTP', subzone: 'Manyata Tech Park' },
  'Nagawara': { zone: 'MTP', subzone: 'Nagawara' },
};

function getZoneByArea(area) {
  if (!area) return { zone: 'OTHERS', subzone: 'Other Areas' };
  const normalizedArea = area.toLowerCase().trim();
  for (const [key, value] of Object.entries(SUBZONE_MAPPING)) {
    if (normalizedArea.includes(key.toLowerCase())) return value;
  }
  return { zone: 'OTHERS', subzone: 'Other Areas' };
}

const IQPropertySchema = new mongoose.Schema({
  name: String, area: String, zone: String, subzone: String,
  ownerName: String, ownerNumber: String,
  price: String, priceMin: Number, priceMax: Number,
  gender: String, propertyType: String,
  lat: Number, lng: Number, importedAt: { type: Date, default: Date.now },
}, { strict: false });

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in .env.local');
  await mongoose.connect(process.env.MONGODB_URI);
  const IQProperty = mongoose.models.IQProperty || mongoose.model('IQProperty', IQPropertySchema);

  const watchDir = path.join(process.cwd(), 'find_my_pg');
  const files = fs.readdirSync(watchDir).filter(f => f.endsWith('.csv'));

  if (files.length === 0) {
    console.log('No CSV files found in find_my_pg/');
    return process.exit(0);
  }

  const fileToProcess = path.join(watchDir, files[0]);
  console.log('Processing:', fileToProcess);

  const csv = fs.readFileSync(fileToProcess, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const dataRows = lines.slice(2).map(line => {
    const values = [];
    let inQuotes = false;
    let current = '';
    for (let char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
        else current += char;
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const obj = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = values[i];
      else obj[`col_${i}`] = values[i];
    });
    return obj;
  });

  const transformed = dataRows.map(item => {
    const area = item["AREA"] || "";
    const zoneData = getZoneByArea(area);
    const name = item["NAMES"] || "Unnamed Property";
    
    let ownerName = "";
    let ownerNumber = "";
    const rawOwner = item["owner name & number"] || "";
    if (rawOwner) {
      const parts = rawOwner.split(/[,\/\\\n]/);
      ownerName = parts[0].trim();
      ownerNumber = parts.slice(1).join(', ').trim() || rawOwner;
    }

    let gender = "COED";
    if (name.toLowerCase().includes('girls') || name.toLowerCase().includes('girl')) gender = "GIRLS";
    else if (name.toLowerCase().includes('boys') || name.toLowerCase().includes('boy')) gender = "BOYS";

    return {
      name,
      area: item["AREA"],
      locality: item["LOCALITY"],
      zone: item["ZONE N PERSON"] || zoneData.zone,
      subzone: zoneData.subzone,
      usp: item["USP"],
      price: item["PRICE"],
      lows: item["LOWS - DONT DISCLOSE"],
      ownerName: ownerName,
      ownerNumber: ownerNumber,
      managerName: item["mng name"],
      managerContact: item["manager number"],
      foodType: item["FOOD"],
      photosLink: item["Drive Link"],
      googleMapsLink: item["url"] || item["exact location"],
      gender,
      importedAt: new Date(),
    };
  }).filter(p => p.name && p.name !== "NAMES" && p.name !== "Unnamed Property"); 

  await IQProperty.deleteMany({});
  await IQProperty.insertMany(transformed);
  console.log(`Success: Imported ${transformed.length} properties!`);
  process.exit(0);
}

run().catch(console.error);
