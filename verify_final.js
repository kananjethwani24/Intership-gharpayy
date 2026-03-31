const TYPE_MAP = { t: 'Triple Sharing', triple: 'Triple Sharing', d: 'Dual Sharing', dual: 'Dual Sharing', double: 'Double Sharing', s: 'Private Room', single: 'Private Room', p: 'Private Room', private: 'Private Room', quad: 'Quad Sharing' };

function parseFromText(text) {
  const entries = [];
  const regex = /(single|dual|double|triple|private|quad)/gi;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
      matches.push({ type: match[1].toLowerCase(), index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
     const current = matches[i];
     const nextIndex = i + 1 < matches.length ? matches[i+1].index : text.length;
     let fullChunk = text.substring(current.index, nextIndex).toLowerCase();
     
     // Current chunking logic (+ any improvements)
     let parts = fullChunk.split(/\n\s*\n/);
     if (parts.length > 1 && parts[0].length > 10) {
         fullChunk = parts[0];
     }
     const chunk = fullChunk;

     let price = null;
     const nowMatch = chunk.match(/(now|just|only|current|priced at).*?(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/i);
     
     if (nowMatch) {
         const preText = chunk.substring(0, nowMatch.index);
         const isBookingFee = /prebook|booking|deposit|fee|save/i.test(preText);
         
         if (!isBookingFee) {
             let val = parseFloat(nowMatch[2].replace(',', ''));
             const suffix = nowMatch[3]?.toLowerCase();
             if (suffix === 'k') val *= 1000;
             else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
             else if (suffix === 'cr') val *= 10000000;
             else if (val < 100) val *= 1000;
             
             if (val >= 4000 && val <= 100000) {
                 price = val;
             }
         }
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
             
             if (val >= 4000 && val <= 100000) {
                 price = val;
                 break;
             }
         }
     }

     if (price) {
         const label = TYPE_MAP[current.type] || `${current.type.charAt(0).toUpperCase() + current.type.slice(1)} Sharing`;
         if (!entries.find(e => e.label === label)) {
             entries.push({ label, price });
         }
     }
  }

  return entries;
}

// SIMULATE NEW IMPORTER OUTPUT (preserved keywords and newlines)
const text = `Dual Sharing: 15k
Private rooms now specially priced at 25k!

Act Fast: Lock in your reservation NOW and save 2000! *Offer expires soon. *Prebook* now for just 5k!*`;

console.log("SIMULATED RESULT:", parseFromText(text));
