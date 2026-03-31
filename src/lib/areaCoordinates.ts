/**
 * Bangalore Area Coordinates
 * A mapping of area names to their central latitude and longitude.
 * Enhanced with High-Precision Sector Data from Gharpay Geo-Intelligence.
 */

import mergedLocations from '../data/bangalore-gis/mergedLocations.json';

export interface LocationNode {
  lat: number;
  lng: number;
  pinCode?: string;
  type?: 'area' | 'tech-park' | 'metro-station' | 'landmark' | 'sub-area' | 'it_hub' | 'commercial' | 'residential' | 'mixed' | 'it_corridor' | 'industrial';
  tier?: 'luxury' | 'premium' | 'mid' | 'affordable' | 'budget';
  region?: string;
  desc?: string;
  companies?: string;
  line?: string;
}

export const GHARPAY_AREAS: any[] = [
  // ── CENTRAL ──────────────────────────────────────────────
  { name:"MG Road",                      pinCode:"560001", lat:12.9757, lng:77.6077, tier:"luxury",    type:"commercial",   region:"Central",  desc:"CBD, Purple metro line, Brigade Road adjacent" },
  { name:"Richmond Town",                pinCode:"560025", lat:12.9605, lng:77.5983, tier:"luxury",    type:"residential",  region:"Central",  desc:"Upscale old-money neighbourhood near Ulsoor" },
  { name:"Shivajinagar",                 pinCode:"560020", lat:12.9867, lng:77.5966, tier:"mid",       type:"mixed",        region:"Central",  desc:"Govt offices, bus terminals, commercial" },
  { name:"Frazer Town",                  pinCode:"560005", lat:12.9880, lng:77.6224, tier:"luxury",    type:"residential",  region:"Central",  desc:"Leafy, cosmopolitan, older bungalows & apartments" },
  { name:"Cox Town",                     pinCode:"560005", lat:12.9904, lng:77.6200, tier:"premium",   type:"residential",  region:"Central",  desc:"Quiet lanes, heritage buildings" },
  { name:"Sadashivanagar",               pinCode:"560080", lat:13.0062, lng:77.5828, tier:"luxury",    type:"residential",  region:"Central",  desc:"Most expensive zip in Bangalore, diplomatic enclave" },
  { name:"Dollar Colony / Palace Gutta", pinCode:"560020", lat:13.0000, lng:77.5813, tier:"luxury",    type:"residential",  region:"Central",  desc:"Adjacent to Palace Grounds, extremely premium" },
  { name:"Basavanagudi",                  pinCode:"560004", lat:12.9434, lng:77.5750, tier:"premium",   type:"residential",  region:"Central",  desc:"Old Bangalore, Bull Temple Rd, leafy residential" },

  // ── KORAMANGALA ───────────────────────────────────────────
  { name:"Koramangala 1st Block", pinCode:"560034", lat:12.9318, lng:77.6152, tier:"premium",  type:"residential", region:"South", desc:"Quiet, near Christ University" },
  { name:"Koramangala 2nd Block", pinCode:"560034", lat:12.9330, lng:77.6180, tier:"premium",  type:"residential", region:"South", desc:"Residential, near NGV" },
  { name:"Koramangala 3rd Block", pinCode:"560034", lat:12.9340, lng:77.6220, tier:"premium",  type:"mixed",       region:"South", desc:"Restaurants, co-working, residential" },
  { name:"Koramangala 4th Block", pinCode:"560034", lat:12.9352, lng:77.6245, tier:"premium",  type:"mixed",       region:"South", desc:"Central Koramangala, IIMB area" },
  { name:"Koramangala 5th Block", pinCode:"560095", lat:12.9363, lng:77.6270, tier:"premium",  type:"commercial",  region:"South", desc:"Forum Mall, startups, dining" },
  { name:"Koramangala 6th Block", pinCode:"560095", lat:12.9373, lng:77.6290, tier:"premium",  type:"mixed",       region:"South", desc:"Hipster cafes, startup culture" },
  { name:"Koramangala 7th Block", pinCode:"560095", lat:12.9335, lng:77.6290, tier:"premium",  type:"mixed",       region:"South", desc:"Dense residential + commercial" },
  { name:"Koramangala 8th Block", pinCode:"560095", lat:12.9320, lng:77.6310, tier:"premium",  type:"residential", region:"South", desc:"Quieter, SGPalya end" },
  { name:"SGPalya",               pinCode:"560029", lat:12.9285, lng:77.6330, tier:"mid",      type:"residential", region:"South", desc:"Adjoins Koramangala 8th, affordable pocket" },

  // ── BTM LAYOUT ────────────────────────────────────────────
  { name:"BTM Layout Sector 1",  pinCode:"560029", lat:12.9180, lng:77.6080, tier:"mid",      type:"residential", region:"South", desc:"Western BTM, near Jayanagar" },
  { name:"BTM Layout Sector 2",  pinCode:"560076", lat:12.9165, lng:77.6101, tier:"mid",      type:"mixed",       region:"South", desc:"Main commercial BTM, dense" },

  // ── HSR LAYOUT ────────────────────────────────────────────
  { name:"HSR Layout Sector 1",  pinCode:"560102", lat:12.9180, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"North HSR, near Koramangala" },
  { name:"HSR Layout Sector 2",  pinCode:"560102", lat:12.9150, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Central HSR" },
  { name:"HSR Layout Sector 3",  pinCode:"560102", lat:12.9116, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Central HSR, startup hubs" },
  { name:"HSR Layout Sector 4",  pinCode:"560102", lat:12.9090, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Quiet residential sector" },
  { name:"HSR Layout Sector 5",  pinCode:"560102", lat:12.9060, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Near BDA complex" },
  { name:"HSR Layout Sector 6",  pinCode:"560102", lat:12.9030, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"South HSR near Silk Board" },
  { name:"HSR Layout Sector 7",  pinCode:"560102", lat:12.9000, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Southernmost HSR, quieter" },

  // ── JAYANAGAR ─────────────────────────────────────────────
  { name:"Jayanagar 1st Block",  pinCode:"560041", lat:12.9312, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"North Jayanagar, near South End Circle" },
  { name:"Jayanagar 2nd Block",  pinCode:"560041", lat:12.9295, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"Established residential" },
  { name:"Jayanagar 4th T Block",pinCode:"560041", lat:12.9265, lng:77.5970, tier:"premium",  type:"mixed",       region:"South", desc:"Shopping hub, Jayanagar metro" },
  { name:"Jayanagar 5th Block",  pinCode:"560041", lat:12.9250, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"Near metro station" },
  { name:"Jayanagar 9th Block",  pinCode:"560041", lat:12.9185, lng:77.5938, tier:"mid",      type:"residential", region:"South", desc:"Southernmost Jayanagar block" },

  // ── JP NAGAR ──────────────────────────────────────────────
  { name:"JP Nagar Phase 1",     pinCode:"560078", lat:12.9200, lng:77.5850, tier:"premium",  type:"residential", region:"South", desc:"Adjacent to Jayanagar, premium" },
  { name:"JP Nagar Phase 2",     pinCode:"560078", lat:12.9150, lng:77.5850, tier:"premium",  type:"residential", region:"South", desc:"IIMB nearby" },
  { name:"JP Nagar Phase 3",     pinCode:"560078", lat:12.9100, lng:77.5844, tier:"mid",      type:"residential", region:"South", desc:"Good connectivity" },

  // ── EAST BANGALORE ────────────────────────────────────────
  { name:"Indiranagar",         pinCode:"560038", lat:12.9784, lng:77.6408, tier:"luxury",   type:"mixed",       region:"East", desc:"100 Feet Road, metro, premium nightlife" },
  { name:"Domlur",              pinCode:"560071", lat:12.9609, lng:77.6387, tier:"premium",  type:"mixed",       region:"East", desc:"HAL/ISRO vicinity, IT offices" },
  { name:"Whitefield",          pinCode:"560066", lat:12.9698, lng:77.7499, tier:"mid",      type:"it_hub",      region:"East", desc:"Largest IT hub, ITPL, Phoenix Mall" },
  { name:"Marathahalli",        pinCode:"560037", lat:12.9545, lng:77.7011, tier:"mid",      type:"mixed",       region:"East", desc:"ORR junction, heavy traffic, IT hub" },
  { name:"Bellandur",           pinCode:"560103", lat:12.9256, lng:77.6720, tier:"mid",      type:"mixed",       region:"South-East", desc:"Ecospace, Pritech Park, lake area" },
  { name:"Sarjapur Road",       pinCode:"560034", lat:12.9102, lng:77.6805, tier:"mid",      type:"it_corridor", region:"South-East", desc:"ORR to Sarjapur, high-rise apartments" },

  // ── NORTH BANGALORE ───────────────────────────────────────
  { name:"Hebbal",             pinCode:"560024", lat:13.0358, lng:77.5970, tier:"premium",  type:"mixed",       region:"North", desc:"Manyata Tech Park, flyover, lake" },
  { name:"Manyata Tech Park Area", pinCode:"560045", lat:13.0461, lng:77.6214, tier:"mid",      type:"it_hub",      region:"North", desc:"Manyata Embassy Business Park" },

  // ── WEST BANGALORE ────────────────────────────────────────
  { name:"Rajajinagar",        pinCode:"560010", lat:12.9988, lng:77.5562, tier:"premium",  type:"residential", region:"West", desc:"Metro connected, old Bangalore premium" },
  { name:"Malleswaram",        pinCode:"560003", lat:13.0032, lng:77.5700, tier:"premium",  type:"residential", region:"West", desc:"Heritage, Brahmin agrahara roots, premium" },
];

export const GHARPAY_TECH_PARKS: any[] = [
  { name:"Manyata Tech Park",           lat:13.0461, lng:77.6214, type: 'tech-park', companies:"Goldman Sachs, SAP, Mphasis, L&T Infotech" },
  { name:"Embassy Tech Village",        lat:12.9287, lng:77.6889, type: 'tech-park', companies:"IBM, Accenture, Cisco, Dell" },
  { name:"Bagmane Tech Park",           lat:12.9869, lng:77.6634, type: 'tech-park', companies:"Cognizant, Nokia, Citibank" },
  { name:"Prestige Tech Park",          lat:12.9213, lng:77.6871, type: 'tech-park', companies:"Accenture, Qualcomm, Akamai" },
  { name:"Electronic City (Infosys/Wipro)", lat:12.8491, lng:77.6741, type: 'tech-park', companies:"Infosys, Wipro, HCL, TCS, Siemens" },
  { name:"International Tech Park ITPL",lat:12.9845, lng:77.7268, type: 'tech-park', companies:"Multiple MNCs, Infosys BPO" },
  { name:"Global Technology Park",      lat:12.9204, lng:77.6780, type: 'tech-park', companies:"Flipkart, Target India" },
  { name:"Cessna Business Park",        lat:12.9342, lng:77.6910, type: 'tech-park', companies:"Capgemini, Ernst & Young" },
  { name:"RGA Tech Park",               lat:12.9067, lng:77.6698, type: 'tech-park', companies:"Oracle, Microland" },
  { name:"EcoSpace Business Park",      lat:12.9345, lng:77.6898, type: 'tech-park', companies:"SAP Labs, Tech Mahindra, KPMG" },
  { name:"RMZ Ecoworld",               lat:12.9145, lng:77.6929, type: 'tech-park', companies:"J.P. Morgan, ANZ, ThoughtWorks" },
];

export const GHARPAY_METRO_STATIONS: any[] = [
  { name:"Majestic (Purple/Green)",lat:12.9766, lng:77.5713, type: 'metro-station', line:"Purple/Green"},
  { name:"MG Road",              lat:12.9757, lng:77.6077, type: 'metro-station', line:"Purple"},
  { name:"Indiranagar",          lat:12.9776, lng:77.6384, type: 'metro-station', line:"Purple"},
  { name:"Jayanagar",            lat:12.9250, lng:77.5938, type: 'metro-station', line:"Green"},
  { name:"Silk Board",           lat:12.9174, lng:77.6228, type: 'metro-station', line:"Yellow"},
  { name:"HSR Layout",           lat:12.9116, lng:77.6389, type: 'metro-station', line:"Yellow"},
  { name:"Bellandur Road",       lat:12.9210, lng:77.6717, type: 'metro-station', line:"Yellow"},
];

export const GHARPAY_LANDMARKS: any[] = [
  { name:"Christ University",          lat:12.9345, lng:77.6078, type:"landmark" },
  { name:"IIM Bangalore",              lat:12.9326, lng:77.6052, type:"landmark" },
  { name:"Forum Mall Koramangala",     lat:12.9363, lng:77.6270, type:"landmark" },
  { name:"Silk Board Junction",        lat:12.9174, lng:77.6228, type:"landmark" },
  { name:"91springboard Koramangala",  lat:12.9347, lng:77.6200, type:"landmark" },
  { name:"91springboard HSR",          lat:12.9100, lng:77.6400, type:"landmark" },
];

// Unified GIS Data
export const BANGALORE_GIS_DATA: any[] = [
  ...GHARPAY_AREAS,
  ...GHARPAY_TECH_PARKS,
  ...GHARPAY_METRO_STATIONS,
  ...GHARPAY_LANDMARKS,
  ...(mergedLocations as any[]).filter(loc => 
    ![...GHARPAY_AREAS, ...GHARPAY_TECH_PARKS].some(g => normalizeAreaName(g.name) === normalizeAreaName(loc.name))
  )
];

export const AREA_COORDINATES: Record<string, LocationNode> = {};
BANGALORE_GIS_DATA.forEach(loc => {
  if (loc.name) AREA_COORDINATES[loc.name] = loc;
});

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

export function roadDistance(haversineKm: number): number {
  return Math.round(haversineKm * 1.35 * 10) / 10;
}

export function driveTimeMinutes(roadKm: number): string {
  const mins = Math.round(roadKm / 30 * 60);
  return `${mins}–${mins + 5} min`;
}

export function normalizeAreaName(name: string): string {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/layout|sector|block|stage|phase|nagar|cross|main|road/g, "");
}

export function resolveLocationToCoords(query: string): {lat: number, lng: number, name: string} | null {
  if (!query) return null;
  const normalized = normalizeAreaName(query);
  if (!normalized) return null;

  // 1. Exact or starts-with match (high confidence)
  let match = BANGALORE_GIS_DATA.find(l => {
    const locNorm = normalizeAreaName(l.name);
    return locNorm === normalized || locNorm === normalized + "layout" || normalized === locNorm + "layout";
  });

  // 2. Contains match
  if (!match) {
    match = BANGALORE_GIS_DATA.find(l => {
      const locNorm = normalizeAreaName(l.name);
      return normalized.includes(locNorm) || locNorm.includes(normalized);
    });
  }

  // 3. Word-based overlap (for multi-word areas)
  if (!match && query.split(' ').length > 1) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    match = BANGALORE_GIS_DATA.find(l => {
      const locName = l.name.toLowerCase();
      return words.some(w => locName.includes(w));
    });
  }

  if (match) return { lat: match.lat, lng: match.lng, name: match.name };
  return null;
}

export function searchLocations(query: string): any[] {
  if (!query) return [];
  const normalized = normalizeAreaName(query);
  return BANGALORE_GIS_DATA.filter(l => {
    const locNorm = normalizeAreaName(l.name);
    return locNorm.includes(normalized) || normalized.includes(locNorm);
  }).slice(0, 10);
}

export function getAreaTier(areaName: string): 'luxury' | 'premium' | 'mid' | 'budget' {
  const name = areaName?.toLowerCase() || "";
  const match = BANGALORE_GIS_DATA.find(l => normalizeAreaName(l.name) === normalizeAreaName(areaName));
  if (match?.tier) return match.tier as any;
  return 'budget';
}

export function findAreaCoordinates(query: string) {
  const resolved = resolveLocationToCoords(query);
  if (resolved) return { area: resolved.name, ...resolved };
  return null;
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversine(lat1, lon1, lat2, lon2);
}
