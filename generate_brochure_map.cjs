const fs = require('fs');
const path = require('path');

const brochureDir = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/public/brochures';
const files = fs.readdirSync(brochureDir).filter(f => f.toLowerCase().endsWith('.pdf'));

const mapping = {};

// We'll normalize names to match
function normalize(s) {
  return s.toLowerCase()
    .replace(/^gharpayy\s+/, '')
    .replace(/^gg\s+/, '')
    .replace(/[^a-z0-9]/g, '');
}

files.forEach(file => {
  // Filename minus extension
  const base = file.replace(/\.pdf$/i, '');
  const key = normalize(base);
  
  // We'll store multiple potential keys or just use the first best match
  // Actually, we'll store the first word of the name as a secondary key
  const firstWord = base.split(/\s+/)[1]?.toLowerCase() || ''; // skip GG
  
  if (key) mapping[key] = file;
  if (firstWord && !mapping[firstWord]) mapping[firstWord] = file;
});

fs.writeFileSync('c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/src/data/brochureMap.json', JSON.stringify(mapping, null, 2));
console.log(`Generated mapping with ${Object.keys(mapping).length} entries.`);
