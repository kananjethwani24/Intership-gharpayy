import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Manual env load
const envFile = fs.readFileSync('.env.local', 'utf-8');
const envLines = envFile.split('\n');
const MONGODB_URI = envLines
  .find(l => l.startsWith('MONGODB_URI='))
  ?.split('=')[1]
  ?.trim();

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in .env.local');
  process.exit(1);
}

// Clean URI for some driver versions
const baseUri = MONGODB_URI.split('/?')[0];
const params = MONGODB_URI.split('/?')[1] || '';
const cleanedParams = params.split('&')
  .filter(p => !p.startsWith('ssl=') && !p.startsWith('tls='))
  .join('&');
const CLEAN_MONGODB_URI = baseUri + (cleanedParams ? '/?' + cleanedParams : '');

console.log('Connecting to cleaned URI:', CLEAN_MONGODB_URI.substring(0, 50) + '...');

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    status: { type: String, default: 'new' },
    source: { type: String, default: 'csv_import' },
    budget: { type: String },
    preferredLocation: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

let dummyCounter = 1;

function extractFromNameFull(text) {
  const nameMatch = text.match(/\*Name:\s*\*?\s*([^\*📱\n\r]+)/i) || text.match(/Name:\s*([^\n\r,]+)/i);
  const phoneMatch = text.match(/\*Phone:\s*\*?\s*([^\*✉️\n\r]+)/i) || text.match(/Phone:\s*([^\n\r,]+)/i) || text.match(/(\d{10})/);
  const emailMatch = text.match(/\*Email:\s*\*?\s*([^\*📍\n\r\s]+)/i);
  
  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
    email: emailMatch ? emailMatch[1].trim() : null
  };
}

async function importCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Handle CSV with quotes and potentially multi-line fields
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || (char === '\r' && content[i+1] === '\n')) && !inQuotes) {
      if (char === '\r') i++;
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentRow.length > 0) {
     currentRow.push(currentField.trim());
     rows.push(currentRow);
  }

  if (rows.length < 2) return 0;

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const phoneIdx = headers.findIndex(h => h.includes('mobile') || h.includes('phone') || h.includes('contact'));
  const formFullIdx = headers.findIndex(h => h.includes('form full'));
  const locationIdx = headers.findIndex(h => h.includes('location'));
  const budgetIdx = headers.findIndex(h => h.includes('budget'));

  const leads = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 2) continue;

    const lead = { source: path.basename(filePath) };
    
    // 1. Try to get from dedicated columns
    if (nameIdx !== -1) lead.name = cols[nameIdx];
    if (phoneIdx !== -1) lead.phone = cols[phoneIdx];
    if (locationIdx !== -1) lead.preferredLocation = cols[locationIdx];
    if (budgetIdx !== -1) lead.budget = cols[budgetIdx];

    // 2. If name or phone missing, try Form Full extraction
    if ((!lead.name || !lead.phone) && formFullIdx !== -1 && cols[formFullIdx]) {
      const extracted = extractFromNameFull(cols[formFullIdx]);
      if (!lead.name && extracted.name) lead.name = extracted.name;
      if (!lead.phone && extracted.phone) lead.phone = extracted.phone;
      if (!lead.email && extracted.email) lead.email = extracted.email;
    }

    // 3. Fallback to dummy
    if (!lead.name || lead.name.trim() === '') {
      lead.name = `Dummy ${dummyCounter++}`;
    }

    if (lead.phone && lead.phone.trim() !== '') {
      // Basic phone cleaning
      lead.phone = lead.phone.replace(/[^0-9]/g, '');
      if (lead.phone.length >= 10) {
        leads.push(lead);
      }
    }
  }

  if (leads.length > 0) {
    try {
       await Lead.insertMany(leads);
       return leads.length;
    } catch (e) {
       console.error(`Error inserting leads from ${filePath}:`, e.message);
       return 0;
    }
  }
  return 0;
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(CLEAN_MONGODB_URI);
  console.log('Connected.');

  const folder = path.join(process.cwd(), 'csv_leads');
  const files = fs.readdirSync(folder).filter(f => f.endsWith('.csv'));

  let total = 0;
  for (const file of files) {
    console.log(`Working on: ${file}`);
    const count = await importCsv(path.join(folder, file));
    console.log(`Successfully imported ${count} leads.`);
    total += count;
  }

  console.log(`Success! Total leads in database now: ${total}`);
  await mongoose.connection.close();
}

main().catch(console.error);
