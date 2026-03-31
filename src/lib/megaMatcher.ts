import { megaData } from '@/data/mega';

// Define types for better DX
export interface MegaResult {
    type: 'company' | 'tech_park' | 'area' | 'landmark';
    name: string;
    area: string;
    zone?: string;
    metadata: any;
}

class MegaMatcher {
    private data = megaData;

    public search(query: string): MegaResult[] {
        const results: MegaResult[] = [];
        const q = query.toLowerCase();

        // 1. Search Tech Parks
        const techParks = this.data['_tech_parks___all'] || [];
        for (const tp of techParks) {
            const name = tp['__EMPTY']?.toString();
            const area = tp['__EMPTY_1']?.toString();
            if (name?.toLowerCase().includes(q) || area?.toLowerCase().includes(q)) {
                results.push({ type: 'tech_park', name, area, zone: tp['__EMPTY_2'], metadata: tp });
            }
        }

        // 2. Search Companies (MNCs, Unicorns, Startups)
        const companySheets = ['___mncs___it_giants', '_unicorns___big_startups', '_funded_startups_2023_2026', '___gaming_ai_deeptech', '___pharma_biotech_healthtech'];
        for (const sheet of companySheets) {
            const companies = this.data[sheet] || [];
            for (const c of companies) {
                const name = c['__EMPTY']?.toString();
                const area = c['__EMPTY_2']?.toString() || c['__EMPTY_5']?.toString() || c['__EMPTY_6']?.toString();
                if (name?.toLowerCase().includes(q)) {
                    results.push({ type: 'company', name, area, metadata: c });
                }
            }
        }

        // 3. Search Landmarks (Hospitals, Colleges, Coworking)
        const landmarkSheets = ['___hospitals___complete', '___colleges___complete', '___coworking_spaces'];
        for (const sheet of landmarkSheets) {
            const items = this.data[sheet] || [];
            for (const item of items) {
                const name = item['__EMPTY']?.toString();
                const area = item['__EMPTY_3']?.toString() || item['__EMPTY_2']?.toString();
                if (name?.toLowerCase().includes(q)) {
                    results.push({ type: 'landmark', name, area, metadata: item });
                }
            }
        }

        // 4. Search Lead Matcher (The ultimate fallback)
        const leadMatcher = this.data['___lead_matcher'] || [];
        for (const row of leadMatcher) {
            const area = row['__EMPTY']?.toString();
            const subAreas = row['__EMPTY_1']?.toString();
            const companies = row['__EMPTY_6']?.toString();
            if (area?.toLowerCase().includes(q) || subAreas?.toLowerCase().includes(q) || companies?.toLowerCase().includes(q)) {
                results.push({ type: 'area', name: area, area, metadata: row });
            }
        }

        return results.slice(0, 10);
    }

    public getDistance(fromArea: string, toArea: string): number | null {
        const matrix = this.data['___distance_matrix'] || [];
        // The matrix has header row at index 1
        const headers = matrix[1] || {};
        const keyMap: Record<string, string> = {};
        for (const [key, val] of Object.entries(headers)) {
            if (val) keyMap[val.toString().toLowerCase()] = key;
        }

        const fromKey = fromArea.toLowerCase();
        const toColKey = keyMap[toArea.toLowerCase()];

        if (!toColKey) return null;

        const row = matrix.find(r => r[' AREA DISTANCE MATRIX — BANGALORE (Road Distance in KM)']?.toString().toLowerCase() === fromKey);
        if (row && row[toColKey]) {
            const dist = parseFloat(row[toColKey]);
            return isNaN(dist) ? null : dist;
        }

        return null;
    }
}

export const megaMatcher = new MegaMatcher();
