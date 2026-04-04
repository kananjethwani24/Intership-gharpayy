
export const ZONES = {
  KORA: {
    name: 'KORA (South/Central)',
    subzones: [
      'Koramangala All Blocks',
      'SG Palya / Silk Board / Nexus',
      'HSR Layout (All Sectors)',
      'BTM Layout (All Stages)',
      'Jayanagar / JP Nagar',
      'Indiranagar / Domlur',
      'Richmond Town / MG Road',
      'Ejipura / Viveknagar',
      'Bannerghatta Road / Arekere',
      'Electronic City Phase 1 & 2',
    ],
  },
  MWB: {
    name: 'MWB (East/ORR)',
    subzones: [
      'Bellandur / Ecoworld / Kadubeesanahalli',
      'Marathahalli / Spice Garden',
      'Whitefield / ITPL / Hope Farm',
      'Mahadevapura / Bagmane / CV Raman Nagar',
      'Brookfield / AECS / Kundalahalli',
      'Sarjapur Road / Haralur',
      'Hoodi / Kadugodi / Varthur',
      'Outskirts',
    ],
  },
  MTP: {
    name: 'MTP (North)',
    subzones: [
      'Manyata Tech Park',
      'Nagawara / Hebbal',
      'Thanisandra / Hennur',
      'HBR Layout / Banaswadi',
      'RT Nagar / Jakkur',
      'Sahakarnagar / Vidyaranyapura',
      'Yelahanka / Devanahalli',
    ],
  },
  YPR: {
    name: 'YPR (West)',
    subzones: [
      'Yeshwanthpur / Malleshwaram',
      'Rajajinagar / Vijayanagar',
      'Nagasandra / Peenya',
      'Dasarahalli / Jalahalli',
      'Kengeri / Mysore Road',
    ],
  },
} as const;

export type ZoneKey = keyof typeof ZONES;

// Global zone centers for proximity fallback
const ZONE_CENTERS: Record<ZoneKey, { lat: number; lng: number }> = {
  KORA: { lat: 12.9352, lng: 77.6244 }, // Koramangala
  MWB:  { lat: 12.9562, lng: 77.7019 }, // Marathahalli
  MTP:  { lat: 13.0451, lng: 77.6204 }, // Manyata
  YPR:  { lat: 13.0238, lng: 77.5529 }, // Yeshwanthpur
};

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export const SUBZONE_MAPPING: Record<string, { zone: ZoneKey; subzone: string }> = {
  // KORA (South/Central)
  'koramangala': { zone: 'KORA', subzone: 'Koramangala All Blocks' },
  'kormangala':  { zone: 'KORA', subzone: 'Koramangala All Blocks' },
  'sg palya':    { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  's.g. palya':  { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'silk board':  { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'nexus':       { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'hsr':         { zone: 'KORA', subzone: 'HSR Layout (All Sectors)' },
  'h.s.r':       { zone: 'KORA', subzone: 'HSR Layout (All Sectors)' },
  'bommanahalli':{ zone: 'KORA', subzone: 'HSR Layout (All Sectors)' },
  'btm':         { zone: 'KORA', subzone: 'BTM Layout (All Stages)' },
  'b.t.m':       { zone: 'KORA', subzone: 'BTM Layout (All Stages)' },
  'jayanagar':   { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'jp nagar':    { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'j p nagar':   { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'indiranagar': { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'indranagar':  { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'indira nagar':{ zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'domlur':      { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'mg road':     { zone: 'KORA', subzone: 'Richmond Town / MG Road' },
  'm.g. road':   { zone: 'KORA', subzone: 'Richmond Town / MG Road' },
  'richmond':    { zone: 'KORA', subzone: 'Richmond Town / MG Road' },
  'ejipura':     { zone: 'KORA', subzone: 'Ejipura / Viveknagar' },
  'bannerghatta':{ zone: 'KORA', subzone: 'Bannerghatta Road / Arekere' },
  'bg road':     { zone: 'KORA', subzone: 'Bannerghatta Road / Arekere' },
  'electronic city': { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },
  'e city':      { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },
  'ecity':       { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },
  'e-city':      { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },

  // MWB (East/ORR)
  'bellandur':   { zone: 'MWB', subzone: 'Bellandur / Ecoworld / Kadubeesanahalli' },
  'ecoworld':    { zone: 'MWB', subzone: 'Bellandur / Ecoworld / Kadubeesanahalli' },
  'marathahalli':{ zone: 'MWB', subzone: 'Marathahalli / Spice Garden' },
  'spice garden':{ zone: 'MWB', subzone: 'Marathahalli / Spice Garden' },
  'whitefield':  { zone: 'MWB', subzone: 'Whitefield / ITPL / Hope Farm' },
  'white field': { zone: 'MWB', subzone: 'Whitefield / ITPL / Hope Farm' },
  'itpl':        { zone: 'MWB', subzone: 'Whitefield / ITPL / Hope Farm' },
  'mahadevapura':{ zone: 'MWB', subzone: 'Mahadevapura / Bagmane / CV Raman Nagar' },
  'bagmane':     { zone: 'MWB', subzone: 'Mahadevapura / Bagmane / CV Raman Nagar' },
  'cv raman':    { zone: 'MWB', subzone: 'Mahadevapura / Bagmane / CV Raman Nagar' },
  'brookfield':  { zone: 'MWB', subzone: 'Brookfield / AECS / Kundalahalli' },
  'brookefield': { zone: 'MWB', subzone: 'Brookfield / AECS / Kundalahalli' },
  'aecs':        { zone: 'MWB', subzone: 'Brookfield / AECS / Kundalahalli' },
  'kundalahalli':{ zone: 'MWB', subzone: 'Brookfield / AECS / Kundalahalli' },
  'sarjapur':    { zone: 'MWB', subzone: 'Sarjapur Road / Haralur' },
  'hoodi':       { zone: 'MWB', subzone: 'Hoodi / Kadugodi / Varthur' },
  'kadugodi':    { zone: 'MWB', subzone: 'Hoodi / Kadugodi / Varthur' },
  'varthur':     { zone: 'MWB', subzone: 'Hoodi / Kadugodi / Varthur' },

  // MTP (North)
  'manyata':     { zone: 'MTP', subzone: 'Manyata Tech Park' },
  'nagawara':    { zone: 'MTP', subzone: 'Nagawara / Hebbal' },
  'hebbal':      { zone: 'MTP', subzone: 'Nagawara / Hebbal' },
  'rt nagar':    { zone: 'MTP', subzone: 'RT Nagar / Jakkur' },
  'r t nagar':   { zone: 'MTP', subzone: 'RT Nagar / Jakkur' },
  'thanisandra': { zone: 'MTP', subzone: 'Thanisandra / Hennur' },
  'hennur':      { zone: 'MTP', subzone: 'Thanisandra / Hennur' },
  'hbr':         { zone: 'MTP', subzone: 'HBR Layout / Banaswadi' },
  'banaswadi':   { zone: 'MTP', subzone: 'HBR Layout / Banaswadi' },
  'yelahanka':   { zone: 'MTP', subzone: 'Yelahanka / Devanahalli' },
  'devanahalli': { zone: 'MTP', subzone: 'Yelahanka / Devanahalli' },
  'kalyan nagar':{ zone: 'MTP', subzone: 'HBR Layout / Banaswadi' },

  // YPR (West)
  'yeshwanthpur':{ zone: 'YPR', subzone: 'Yeshwanthpur / Malleshwaram' },
  'malleshwaram':{ zone: 'YPR', subzone: 'Yeshwanthpur / Malleshwaram' },
  'rajajinagar': { zone: 'YPR', subzone: 'Rajajinagar / Vijayanagar' },
  'vijayanagar': { zone: 'YPR', subzone: 'Rajajinagar / Vijayanagar' },
  'peenya':      { zone: 'YPR', subzone: 'Nagasandra / Peenya' },
  'nagasandra':  { zone: 'YPR', subzone: 'Nagasandra / Peenya' },
  'kengeri':     { zone: 'YPR', subzone: 'Kengeri / Mysore Road' },
  'mysore road': { zone: 'YPR', subzone: 'Kengeri / Mysore Road' },

  // ADDED EXHAUSTIVE CATCH-ALL COVERS
  'vasanthnagar':{ zone: 'KORA', subzone: 'Central Bangalore' },
  'mathikere':   { zone: 'MTP',  subzone: 'Mathikere / Ramaiah' },
  'ramaiah':     { zone: 'MTP',  subzone: 'Mathikere / Ramaiah' },
  'jc road':     { zone: 'KORA', subzone: 'Central Bangalore' },
  'hal':         { zone: 'MWB',  subzone: 'HAL / Old Airport Road' },
  'kaggadasapura':{ zone: 'MWB', subzone: 'HAL / Old Airport Road' },
  'kammanahalli':{ zone: 'MTP',  subzone: 'HBR Layout / Banaswadi' },
  'frazer town': { zone: 'KORA', subzone: 'Central Bangalore' },
  'shivajinagar':{ zone: 'KORA', subzone: 'Central Bangalore' },
};

export function getZoneByArea(area: string, locality?: string): { zone: ZoneKey; subzone: string } {
  const check = (val: string) => {
    if (!val) return null;
    const normalized = val.toLowerCase().trim();
    const sortedKeys = Object.keys(SUBZONE_MAPPING).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (normalized.includes(key.toLowerCase())) {
        return SUBZONE_MAPPING[key] as { zone: ZoneKey; subzone: string };
      }
    }
    return null;
  };

  // 1. Try explicit mapping first (most reliable)
  const fromArea = check(area);
  if (fromArea) return fromArea;

  const fromLocality = check(locality || '');
  if (fromLocality) return fromLocality;
  
  // 2. Proximity fallback: Resolve to GIS coordinates and find the closest zone center
  try {
    const { resolveLocationToCoords } = require('./areaCoordinates');
    const resolved = resolveLocationToCoords(area) || resolveLocationToCoords(locality || '');

    if (resolved) {
      const { lat, lng } = resolved;
      
      // Calculate distances to all 4 zone centers
      let bestZone: ZoneKey = 'KORA';
      let minDist = Infinity;
      
      for (const [zKey, center] of Object.entries(ZONE_CENTERS)) {
        const d = haversineDist(lat, lng, center.lat, center.lng);
        if (d < minDist) {
          minDist = d;
          bestZone = zKey as ZoneKey;
        }
      }
      
      return { zone: bestZone, subzone: `Close to ${resolved.name}` };
    }
  } catch (e) {
    // Fail silently and use hard fallback
  }

  // 3. FINAL FALLBACK: Default to KORA if everything else fails (no property left)
  return { zone: 'KORA', subzone: 'General Bangalore / Central' };
}
