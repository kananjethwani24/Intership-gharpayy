const fs = require('fs');

// We simulate the logic here but very carefully
function simulateParse(text) {
   const TYPE_MAP = { t: 'Triple Sharing', triple: 'Triple Sharing', d: 'Dual Sharing', dual: 'Dual Sharing', double: 'Double Sharing', s: 'Private Room', single: 'Private Room', p: 'Private Room', private: 'Private Room', quad: 'Quad Sharing' };
   const entries = [];
   const regex = /(single|dual|double|triple|private|quad)/gi;
   const matches = [];
   let m;
   while ((m = regex.exec(text)) !== null) {
       matches.push({ type: m[1].toLowerCase(), index: m.index });
   }

   for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextIndex = i + 1 < matches.length ? matches[i+1].index : text.length;
      let fullChunk = text.substring(current.index, nextIndex).toLowerCase();
      
      // The current logic in src/lib/parseRoomEntries.ts
      let parts = fullChunk.split(/\n\s*\n/);
      if (parts.length > 1 && parts[0].length > 10) {
          fullChunk = parts[0];
      }
      const chunk = fullChunk;

      let price = null;
      const nowMatch = chunk.match(/now.*?(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/i);
      if (nowMatch) {
          let val = parseFloat(nowMatch[1].replace(',', ''));
          const suffix = nowMatch[2]?.toLowerCase();
          if (suffix === 'k') val *= 1000;
          else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
          else if (suffix === 'cr') val *= 10000000;
          else if (val < 100) val *= 1000;
          if (val >= 4000 && val <= 100000) price = val;
      } 
      
      if (!price) {
          const allPrices = [...chunk.matchAll(/(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/gi)];
          for (let j = allPrices.length - 1; j >= 0; j--) {
              const pMatch = allPrices[j];
              let val = parseFloat(pMatch[1].replace(',', ''));
              const suffix = pMatch[2]?.toLowerCase();
              if (suffix === 'k') val *= 1000;
              else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
              else if (suffix === 'cr') val *= 10000000;
              else if (val < 100) val *= 1000;
              if (val >= 4000 && val <= 100000) { price = val; break; }
          }
      }

      if (price) {
          const label = TYPE_MAP[current.type];
          if (!entries.find(e => e.label === label)) entries.push({ label, price });
      }
   }
   return entries;
}

fetch('http://localhost:3000/api/iq-properties')
  .then(res => res.json())
  .then(data => {
    const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
    if (zillion) {
       console.log("--- ZILLION COED ---");
       console.log("Price text (escaped):", JSON.stringify(zillion.price));
       const entries = simulateParse(zillion.price);
       console.log("Entries found:", entries);
    }
  });
