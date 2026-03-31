const TYPE_MAP = { t: 'Triple Sharing', triple: 'Triple Sharing', d: 'Dual Sharing', dual: 'Dual Sharing', double: 'Double Sharing', s: 'Private Room', single: 'Private Room', p: 'Private Room', private: 'Private Room', quad: 'Quad Sharing' };

function debugParse(text) {
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
      
      console.log(`\nMatch ${i}: "${current.type}" at index ${current.index}`);
      
      let parts = fullChunk.split(/\n\s*\n/);
      if (parts.length > 1 && parts[0].length > 10) {
          fullChunk = parts[0];
      }
      const chunk = fullChunk;
      console.log(`Pruned Chunk length: ${chunk.length}`);
      console.log(`Chunk start: [${chunk.substring(0, 100).replace(/\n/g, '\\n')}]`);

      const nowMatch = chunk.match(/now.*?(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/i);
      console.log("nowMatch:", nowMatch ? nowMatch[0] : "NULL");
      if (nowMatch) {
         let val = parseFloat(nowMatch[1].replace(',', ''));
         const suffix = nowMatch[2]?.toLowerCase();
         if (suffix === 'k') val *= 1000;
         else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
         else if (suffix === 'cr') val *= 10000000;
         else if (val < 100) val *= 1000;
         console.log("nowMatch val:", val);
      }

      const allPrices = [...chunk.matchAll(/(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/gi)];
      console.log("All prices in chunk:", allPrices.map(p => p[0]));
   }
}

fetch('http://localhost:3000/api/iq-properties')
  .then(res => res.json())
  .then(data => {
    const zillion = data.find(p => p.name && p.name.toLowerCase().includes('zillion'));
    if(zillion) debugParse(zillion.price);
  });
