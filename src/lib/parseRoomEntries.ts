/**
 * Parses the price string from the IQ Sheet into structured room-type entries.
 * 
 * Handles multiple formats:
 *   Format 1 (Full):    "Triple Sharing 13k, Dual Sharing 16k, Private rooms 23k"
 *   Format 2 (Short):   "T 11 / D 15 / S 22"   (T=Triple, D=Dual, S=Single, P=Private)
 *   Format 3 (Mixed):   "Triple sharing 13k, dual sharing 16k"
 *   Format 4 (Messy):   "Welcome To Gharpayy ... Triple Sharing 13k ... Dual 16k"
 * 
 * Output: [{ label: "Triple Sharing", price: 13000 }, { label: "Dual Sharing", price: 16000 }, ...]
 */
export interface RoomEntry {
  label: string;
  price: number;
}

// Map of shorthand letters and full words to proper labels
const TYPE_MAP: Record<string, string> = {
  t: 'Triple Sharing',
  triple: 'Triple Sharing',
  d: 'Dual Sharing',
  dual: 'Dual Sharing',
  double: 'Double Sharing',
  s: 'Private Room',
  single: 'Private Room',
  p: 'Private Room',
  private: 'Private Room',
  quad: 'Quad Sharing',
};

function parseFromText(text: string): RoomEntry[] {
  const entries: RoomEntry[] = [];
  
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
     
     // Limit the chunk to prevent bleeding into general descriptions/offers
     // First split by double newline
     let parts = fullChunk.split(/\n\s*\n/);
     let chunk = parts[0];
     
     // Further truncate if common 'info section' markers are found
     const stopMarkers = ['act fast:', 'prebook', 'welcome to', 'exclusive', 'note:', 'policy:'];
     for (const marker of stopMarkers) {
         const markerIdx = chunk.indexOf(marker);
         if (markerIdx > 10) { // ensure we don't truncate the label itself if it contains these words
             chunk = chunk.substring(0, markerIdx);
         }
     }

     let price: number | null = null;
     // Improved nowMatch: looks for 'now', 'just', 'only', 'current', 'priced at'
     const nowMatch = chunk.match(/(now|just|only|current|priced at).*?(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/i);
     
     if (nowMatch) {
         const preText = chunk.substring(0, nowMatch.index);
         // Filter out pre-booking fees, deposits, or other small unrelated numbers
         const isBookingFee = /prebook|booking|deposit|fee|save/i.test(preText);
         
         if (!isBookingFee) {
             let val = parseFloat(nowMatch[2].replace(',', ''));
             const suffix = nowMatch[3]?.toLowerCase();
             if (suffix === 'k') val *= 1000;
             else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
             else if (suffix === 'cr') val *= 10000000;
             else if (val < 100) val *= 1000; // default to thousands if small
             
             if (val >= 4000 && val <= 100000) {
                 price = val;
             }
         }
     } 
     
     if (!price) {
         const allPrices = [...chunk.matchAll(/(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/gi)];
         // take the last valid price that makes sense for rent
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

  if (entries.length > 0) return entries;

  // Fallback to shorthand format "T 11 / D 15"
  const shortPattern = /\b([TDSP])\s*(\d{1,3}(?:\.\d+)?)\b/gi;
  while ((match = shortPattern.exec(text)) !== null) {
    const letter = match[1].toLowerCase();
    const label = TYPE_MAP[letter];
    if (label) {
      let val = parseFloat(match[2]);
      if (val < 100) val *= 1000;
      if (!entries.find(e => e.label === label)) {
        entries.push({ label, price: val });
      }
    }
  }

  return entries;
}

/**
 * Main export: tries parsing from the price field first,
 * then falls back to the lows field (which sometimes contains shorthand pricing).
 * If nothing works, falls back to priceMin/priceMax from the property data.
 */
export function parseRoomEntries(
  priceText?: string | null, 
  lowsText?: string | null,
  priceMin?: number | null,
  priceMax?: number | null
): RoomEntry[] {
  // Try from the price field first
  let entries = parseFromText(priceText || '');
  
  // If nothing found, try from the lows field (shorthand like "T 11 / D 15 / S 22")
  if (entries.length === 0 && lowsText) {
    entries = parseFromText(lowsText);
  }

  // If still nothing, use the priceMin/priceMax as a generic fallback
  if (entries.length === 0 && priceMin) {
    if (priceMax && priceMax !== priceMin) {
      entries.push({ label: 'Starting from', price: priceMin });
    } else {
      entries.push({ label: 'Room', price: priceMin });
    }
  }

  // Sort: Triple → Dual → Single → Private (cheapest occupancy first)
  const order: Record<string, number> = {
    'Quad Sharing': 0,
    'Triple Sharing': 1,
    'Dual Sharing': 2,
    'Double Sharing': 2,
    'Single Sharing': 3,
    'Private Room': 4,
    'Starting from': 5,
    'Room': 5,
  };
  entries.sort((a, b) => (order[a.label] ?? 5) - (order[b.label] ?? 5));

  return entries;
}
