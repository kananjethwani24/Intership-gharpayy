import fs from 'fs';
import path from 'path';

export interface GISNode {
  name: string;
  lat: number;
  lng: number;
  type?: string;
  locality?: string;
  sub_locality?: string;
}

export interface LeadData {
  name: string;
  phone: string;
  location: string;
  score: number;
  moveInDate: string;
  gender: string;
  distanceKm?: number;
  resolvedLocationLabel?: string;
  unresolvable?: boolean;
  searchOriginLabel?: string;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return parseFloat((R * c).toFixed(2));
}

function normalize(text: string): string {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const stopWords = new Set(['near', 'beside', 'opposite', 'next', 'to', 'area', 'layout', 'road', 'rds', 'st', 'street', 'campus']);
  return normalize(text).split(' ').filter(t => t.length > 2 && !stopWords.has(t));
}

function parseDate(d: string): number {
  if (!d) return Date.now() + 1000 * 60 * 60 * 24 * 365; // Future
  const lower = d.toLowerCase();
  
  // Quick-hits
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('now')) return Date.now();
  
  // Try JS standard parse
  let ts = Date.parse(d);
  if (!isNaN(ts)) return ts;

  // Manual regex for common formats like "18th June 2025" or "jun 29"
  const months: Record<string, number> = { 
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };
  
  const mMatch = d.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)/i);
  const dMatch = d.match(/(\d{1,2})/);
  
  if (mMatch) {
    const m = months[mMatch[1].toLowerCase()];
    const day = dMatch ? parseInt(dMatch[1]) : 1;
    const year = d.match(/(\d{4})/) ? parseInt(d.match(/(\d{4})/)![1]) : 2025;
    return new Date(year, m, day).getTime();
  }

  return Date.now() + 1000 * 60 * 60 * 24 * 30; // Fallback: 1 month from now
}

export class ProximityMatcher {
  private index: GISNode[] = [];
  private static instance: ProximityMatcher;
  private leadCache: Record<string, { lat: number; lng: number, label: string } | null> = {};

  private constructor() {
    this.loadIndex();
  }

  public static getInstance(): ProximityMatcher {
    if (!ProximityMatcher.instance) {
      ProximityMatcher.instance = new ProximityMatcher();
    }
    return ProximityMatcher.instance;
  }

  private loadIndex() {
    try {
      const gisPath = path.join(process.cwd(), 'src', 'data', 'bangalore-gis', 'mergedLocations.json');
      if (!fs.existsSync(gisPath)) {
        console.error('ProximityMatcher: GIS file not found at', gisPath);
        return;
      }
      const data = JSON.parse(fs.readFileSync(gisPath, 'utf8'));
      
      this.index = data.map((item: any) => ({
        name: item.name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lng),
        type: item.type,
        locality: item.locality,
        sub_locality: item.sub_locality
      }));

      console.log(`ProximityMatcher: Loaded ${this.index.length} GIS nodes.`);
    } catch (error) {
      console.error('ProximityMatcher: Failed to load index', error);
    }
  }

  public resolveLocation(query: string): { node: GISNode; score: number } | null {
    if (!query) return null;

    const normQuery = normalize(query);
    const queryTokens = tokenize(query);

    let bestMatch: { node: GISNode; score: number } | null = null;

    for (const node of this.index) {
      let score = 0;
      const normName = normalize(node.name);
      const nameTokens = tokenize(node.name);

      if (normName === normQuery) {
        score = 100;
      } else {
        const matchingTokens = queryTokens.filter(t => nameTokens.includes(t));
        const matchRatio = queryTokens.length > 0 ? (matchingTokens.length / queryTokens.length) : 0;

        if (matchingTokens.length === queryTokens.length && queryTokens.length > 0) {
          score = 90;
        } else if (matchRatio >= 0.6) {
          score = 70;
        } else if (matchingTokens.length > 0) {
          score = 50;
        }
      }

      if (score > (bestMatch?.score || 0)) {
        bestMatch = { node, score };
      }

      if (score === 100) break;
    }

    if (bestMatch && bestMatch.score >= 50) {
      return bestMatch;
    }

    return null;
  }

  public getLeadLocation(locationStr: string): { lat: number, lng: number, label: string } | null {
    if (!locationStr) return null;
    if (this.leadCache[locationStr]) return this.leadCache[locationStr];

    const parts = locationStr.split(/[,&/]|near|beside|opposite|next/).map(p => p.trim()).filter(Boolean);
    let bestTotalMatch: { node: GISNode, score: number } | null = null;

    for (const part of parts) {
      const match = this.resolveLocation(part);
      if (match && match.score > (bestTotalMatch?.score || 0)) {
        bestTotalMatch = match;
      }
    }

    if (bestTotalMatch) {
      const result = { lat: bestTotalMatch.node.lat, lng: bestTotalMatch.node.lng, label: bestTotalMatch.node.name };
      this.leadCache[locationStr] = result;
      return result;
    }

    this.leadCache[locationStr] = null;
    return null;
  }

  public getFilteredLeads(origin: { lat: number, lng: number }, rangeKm: number | null, filters?: { gender?: string, minScore?: number }): LeadData[] {
    const rawLeads = this.parseLeadsCsv();

    const processed = rawLeads.map(lead => {
      // Apply filters if provided
      if (filters?.minScore && lead.score < filters.minScore) return { ...lead, unresolvable: true };
      if (filters?.gender && filters.gender !== 'any') {
        const leadGender = (lead.gender || '').toLowerCase();
        const filtGender = filters.gender.toLowerCase();
        if (filtGender.includes('boy') && !leadGender.includes('boy') && !leadGender.includes('male')) return { ...lead, unresolvable: true };
        if (filtGender.includes('girl') && !leadGender.includes('girl') && !leadGender.includes('female')) return { ...lead, unresolvable: true };
      }

      const resolved = this.getLeadLocation(lead.location);
      if (!resolved) return { ...lead, unresolvable: true };

      const dist = haversineKm(origin.lat, origin.lng, resolved.lat, resolved.lng);
      return { 
        ...lead, 
        distanceKm: dist, 
        resolvedLocationLabel: resolved.label 
      };
    }).filter(l => {
      if (rangeKm === null) return !l.unresolvable;
      return !l.unresolvable && l.distanceKm! <= rangeKm;
    });

    // Final Sort
    return processed.sort((a, b) => {
      // 1. Distance (ASC)
      const dDiff = (a.distanceKm || 0) - (b.distanceKm || 0);
      if (Math.abs(dDiff) > 0.01) return dDiff;

      // 2. Score (DESC)
      const sDiff = (b.score || 0) - (a.score || 0);
      if (sDiff !== 0) return sDiff;

      // 3. Move-in Date (ASC)
      const dateA = parseDate(a.moveInDate);
      const dateB = parseDate(b.moveInDate);
      return dateA - dateB;
    });
  }

  private parseLeadsCsv(): LeadData[] {
    try {
      const csvPath = path.join(process.cwd(), 'csv_leads', '_k vopy Qualify. M1 GG (Responses) - Form Responses 1.csv');
      if (!fs.existsSync(csvPath)) {
        console.error('ProximityMatcher: CSV file not found at', csvPath);
        return [];
      }
      const content = fs.readFileSync(csvPath, 'utf8');
      
      const rows: string[][] = [];
      let currentLine: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          currentLine.push(currentField.trim());
          currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          if (char === '\r' && content[i+1] === '\n') i++;
          currentLine.push(currentField.trim());
          rows.push(currentLine);
          currentLine = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
      if (currentLine.length > 0) {
        currentLine.push(currentField.trim());
        rows.push(currentLine);
      }

      if (rows.length < 2) return [];

      const headers = rows[0].map(h => h.trim());
      const locIdx = headers.indexOf('Location?');
      const scoreIdx = headers.indexOf('Lead score?');
      const moveInIdx = headers.indexOf('Movin Date?');
      const genderIdx = headers.indexOf('Gender?');
      const phoneIdx = headers.indexOf('Mobile number');
      const nameIdx = rows[1]?.length - 1; // Last field mapping

      return rows.slice(1).map(row => {
        const rawLoc = row[locIdx] || '';
        const rawScoreStr = row[scoreIdx] || '0';
        const rawScore = parseInt(rawScoreStr.replace(/[^\d]/g, '')) || 0;
        
        return {
          name: row[nameIdx] || 'Anonymous',
          phone: row[phoneIdx] || '',
          location: rawLoc,
          score: rawScore,
          moveInDate: row[moveInIdx] || '',
          gender: row[genderIdx] || ''
        };
      }).filter(l => l.phone && l.phone.length >= 6);

    } catch (error) {
      console.error('ProximityMatcher: Failed to parse CSV', error);
      return [];
    }
  }
}
