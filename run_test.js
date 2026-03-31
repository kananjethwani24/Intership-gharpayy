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
     const chunk = text.substring(current.index, nextIndex).toLowerCase();
     let price = null;
     
     // First extraction logic
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
     
     // Second extraction logic
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

const txt = `💛 Dual Sharing: - ~Originally 18k~, **now just 15k!**
💗 Private rooms: ~Formerly 28k~, **now specially priced at 25k!**
⚕️ Act Fast: Lock in your reservation NOW and save 2000! RS every month on a 3-month stay! *Offer expires in few hours. *Prebook* now for just 5k!* enjoy complimentary good food.`;

console.log("Result:", parseFromText(txt));
