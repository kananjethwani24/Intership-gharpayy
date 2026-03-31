import { AREA_COORDINATES } from '@/lib/areaCoordinates';
import { ZONES } from '@/lib/zones';

export interface ExtractedInfo {
  name?: string;
  area?: string;
  locality?: string;
  price?: string;
  priceMin?: number;
  priceMax?: number;
  gender?: string;
  usp?: string;
  amenities?: string;
}

export function heuristicExtract(text: string): ExtractedInfo {
  const result: ExtractedInfo = {};
  const cleanedText = text.toLowerCase();

  // 1. Extract Prices
  // Regex for patterns like "15k", "15000", "₹ 15,000", "15.5k"
  const priceRegex = /(\d+(?:\.\d+)?)\s*(k|l|lakh|thousand)?\b/gi;
  let match;
  const prices: number[] = [];
  while ((match = priceRegex.exec(text)) !== null) {
    let val = parseFloat(match[1]);
    const suffix = (match[2] || "").toLowerCase();
    if (suffix === 'k' || suffix === 'thousand') val *= 1000;
    else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
    
    if (val >= 1000 && val <= 100000) { // Safety filter for PG prices
       prices.push(val);
    }
  }

  if (prices.length > 0) {
    result.priceMin = Math.min(...prices);
    result.priceMax = Math.max(...prices);
    result.price = prices.length === 1 
      ? `₹${prices[0].toLocaleString()}` 
      : `₹${result.priceMin.toLocaleString()} - ₹${result.priceMax.toLocaleString()}`;
  }

  // 2. Identify Area
  const allAreas = Object.keys(AREA_COORDINATES);
  const foundArea = allAreas.find(area => cleanedText.includes(area.toLowerCase()));
  if (foundArea) {
    result.area = foundArea;
  }

  // 3. Identify Gender
  if (cleanedText.includes('boy') || cleanedText.includes('male') || cleanedText.includes('gent')) {
    result.gender = 'Boys';
  } else if (cleanedText.includes('girl') || cleanedText.includes('female') || cleanedText.includes('lady')) {
    result.gender = 'Girls';
  } else if (cleanedText.includes('coed') || cleanedText.includes('colive') || cleanedText.includes('both')) {
    result.gender = 'Co-live';
  }

  // 4. Identify Sharing info for Price text
  const sharingTypes = [];
  if (cleanedText.includes('single')) sharingTypes.push('Single');
  if (cleanedText.includes('double') || cleanedText.includes('2 sharing')) sharingTypes.push('Double');
  if (cleanedText.includes('triple') || cleanedText.includes('3 sharing')) sharingTypes.push('Triple');
  
  if (sharingTypes.length > 0 && result.price) {
    result.price = `${sharingTypes.join('/')} Sharing: ${result.price}`;
  }

  return result;
}
