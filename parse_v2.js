import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wb = xlsx.readFile(path.join(__dirname, 'uploads_from_boss/Gharpayy_Bangalore_MEGA_Database (2).xlsx'));
const sheetNames = wb.SheetNames;
const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetNames[0]]);

console.log(`Loaded ${data.length} rows.`);
console.dir(data[0], { depth: null });

const tsData = data.map(r => ({
  id: r['PG_ID'] || r['ID'] || Math.random()*1000,
  name: r['PG Name'] || r['Property Name'],
  area: r['Zone'] || r['Area'] || r['Location'],
  locality: r['Locality'] || r['Street'],
  landmarks: r['Nearby Landmarks'] || r['Landmark'],
  mapsLink: r['Google Maps Link'] || r['Maps'],
  gender: r['Gender Allowed'] || r['Gender'] || 'Co-ed',
  propertyType: r['Property Type'] || r['Type'] || 'PG',
  minPrice: parseInt(r['Min Rent'] || r['Starting Rent']) || 0,
  singlePrice: parseInt(r['Single Sharing Rent']) || 0,
  doublePrice: parseInt(r['Double Sharing Rent']) || 0,
  triplePrice: parseInt(r['Triple Sharing Rent']) || 0,
  meals: r['Food Included'] || r['Meals'] || r['Food'],
  utilities: r['Utilities Included'] || r['Utilities'],
  minStay: r['Minimum Stay'] || r['Lock-in'],
  deposit: r['Deposit'] || r['Security Deposit'],
  walkDist: r['Walk Distance to Hub'] || r['Walk Distance'] || r['Commute Time'],
  target: r['Target Audience'] || r['Audience'],
  amenities: (r['Amenities'] || '').split(',').map(s=>s.trim()).filter(Boolean),
  commonAreas: (r['Common Areas'] || '').split(',').map(s=>s.trim()).filter(Boolean),
  safety: (r['Safety/Security'] || '').split(',').map(s=>s.trim()).filter(Boolean),
  usp: r['USP / Key Highlight'] || r['USP'],
  vibe: r['Vibe / Culture'] || r['Vibe'] || '',
  rules: r['House Rules'] || r['Rules'],
  roomTypes: r['Room Configs'] || r['Room Types'],
  noticePeriod: r['Notice Period'] || r['Notice']
}));

fs.writeFileSync(path.join(__dirname, 'src/data/pgMasterData_v2.ts'), 'export const PG_DATA_V2: any[] = ' + JSON.stringify(tsData, null, 2) + ';\nexport type PGEntryV2 = typeof PG_DATA_V2[0];');
console.log('Successfully written to src/data/pgMasterData_v2.ts');
