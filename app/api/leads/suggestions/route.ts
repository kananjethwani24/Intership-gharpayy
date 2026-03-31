import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import IQProperty from '@/models/IQProperty';
import Property from '@/models/Property';
import { normalizeAreaName, resolveLocationToCoords, getDistance, findAreaCoordinates } from '@/lib/areaCoordinates';
import { parseRoomEntries } from '@/lib/parseRoomEntries';
import { fetchLivePGData } from '@/lib/sheetsSync';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normStr(s: string): string {
  return (s || '').toLowerCase().trim();
}

/** Classify the PG's gender type based on gender field + name */
function classifyPgGender(pgGender: string, pgName: string): 'girls' | 'boys' | 'coed' {
  const ctx = `${normStr(pgGender)} ${normStr(pgName)}`;
  if (/girl|female|ladies|women/.test(ctx)) return 'girls';
  if (/\bboy|male\b|men\b/.test(ctx)) return 'boys';
  return 'coed';
}

/** Classify lead's gender preference */
function classifyLeadGender(gender: string): 'female' | 'male' | 'any' {
  const g = normStr(gender);
  if (g === 'female' || g.includes('girl') || g === 'f') return 'female';
  if (g === 'male' || g.includes('boy') || g === 'm') return 'male';
  return 'any';
}

/**
 * LOCATION score (0–40 pts).
 * Returns { score, distanceKm, exclude }
 * exclude=true means this PG is too far and should be dropped entirely.
 */
function scoreLocation(
  searchAreaNorm: string,
  leadCoords: { lat: number; lng: number } | null,
  pgAreaNorm: string,
  pgLocNorm: string,
  pgLandNorm: string,
  pgLat: number | undefined,
  pgLng: number | undefined
): { score: number; distanceKm: number | null; exclude: boolean } {
  const isAnywhere = !searchAreaNorm;

  // Coordinate-based distance (most precise)
  if (leadCoords && pgLat && pgLng) {
    const d = getDistance(leadCoords.lat, leadCoords.lng, pgLat, pgLng);
    if (d <= 2)  return { score: 40, distanceKm: d, exclude: false };
    if (d <= 4)  return { score: 32, distanceKm: d, exclude: false };
    if (d <= 6)  return { score: 22, distanceKm: d, exclude: false };
    if (d <= 10) return { score: 10, distanceKm: d, exclude: false };
    // Beyond 10km — only include if no specific location preference
    if (isAnywhere) return { score: 5, distanceKm: d, exclude: false };
    return { score: 0, distanceKm: d, exclude: true }; // too far for a specific location lead
  }

  // Text-based area match (fallback)
  if (isAnywhere) {
    // No location preference → neutral score, don't exclude
    return { score: 15, distanceKm: null, exclude: false };
  }

  // Exact area match
  const exactMatch =
    pgAreaNorm.includes(searchAreaNorm) ||
    searchAreaNorm.includes(pgAreaNorm) ||
    pgLocNorm.includes(searchAreaNorm) ||
    searchAreaNorm.includes(pgLocNorm) ||
    pgLandNorm.includes(searchAreaNorm);

  if (exactMatch) return { score: 35, distanceKm: null, exclude: false };

  // No match and specific location was given → exclude
  return { score: 0, distanceKm: null, exclude: true };
}

/**
 * GENDER score (0–25 pts) with hard exclusion for strict mismatch.
 * Returns { score, exclude }
 */
function scoreGender(
  leadGender: ReturnType<typeof classifyLeadGender>,
  pgType: ReturnType<typeof classifyPgGender>
): { score: number; exclude: boolean } {
  if (leadGender === 'any') return { score: 15, exclude: false }; // no preference

  if (leadGender === 'female') {
    if (pgType === 'girls') return { score: 25, exclude: false }; // perfect
    if (pgType === 'coed')  return { score: 12, exclude: false }; // acceptable
    return { score: 0, exclude: true }; // Boys PG → EXCLUDE for female lead
  }

  if (leadGender === 'male') {
    if (pgType === 'boys') return { score: 25, exclude: false }; // perfect
    if (pgType === 'coed') return { score: 12, exclude: false }; // acceptable
    return { score: 0, exclude: true }; // Girls PG → EXCLUDE for male lead
  }

  return { score: 10, exclude: false };
}

/**
 * BUDGET score (0–25 pts) with hard exclusion only if WAY over budget.
 * Returns { score, exclude }
 */
function scoreBudget(
  budget: number,
  prices: number[]
): { score: number; exclude: boolean } {
  if (budget <= 0 || prices.length === 0) return { score: 12, exclude: false }; // unknown → neutral

  const minPrice = Math.min(...prices);

  if (minPrice <= budget)          return { score: 25, exclude: false }; // fits
  if (minPrice <= budget * 1.10)   return { score: 18, exclude: false }; // 10% over, ok
  if (minPrice <= budget * 1.25)   return { score: 10, exclude: false }; // 25% over, borderline
  if (minPrice <= budget * 1.50)   return { score:  3, exclude: false }; // 50% over, unlikely
  return { score: 0, exclude: true }; // >50% over budget → don't suggest
}

/**
 * FOOD score (0–10 pts).
 * Returns { score, exclude }
 */
function scoreFood(
  foodPref: string,
  pgFood: string
): { score: number; exclude: boolean } {
  if (!foodPref) return { score: 5, exclude: false }; // no preference → neutral

  const pref = normStr(foodPref);
  const pg   = normStr(pgFood);

  const isLeadVeg    = (pref.includes('veg') && !pref.includes('non'));
  const isLeadNonVeg = pref.includes('non');

  if (!pg || pg.includes('self') || pg.includes('both'))
    return { score: 7, exclude: false }; // self-cook / both = always acceptable

  if (isLeadVeg) {
    if (pg.includes('veg') && !pg.includes('non')) return { score: 10, exclude: false }; // veg exact
    if (pg.includes('both')) return { score: 8, exclude: false };
    // Non-veg only PG for a veg lead — soft penalty, don't exclude (they can eat outside)
    return { score: 2, exclude: false };
  }

  if (isLeadNonVeg) {
    // Non-veg lead accepts everything
    return { score: 8, exclude: false };
  }

  return { score: 5, exclude: false };
}

// ─── Main route ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const leadId = req.nextUrl.searchParams.get('leadId');
    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch the lead
    const lead = await Lead.findById(leadId).lean() as any;
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Extract criteria from all available lead fields
    const location = normStr(lead.preferredLocation || lead.address || '');
    const budget   = parseFloat((lead.budget || '').replace(/[^0-9.]/g, '')) || 0;
    const leadGenderClass = classifyLeadGender(lead.gender || '');

    // Food pref: scan notes + any other text fields
    const allLeadText = `${lead.notes || ''} ${lead.stayDuration || ''}`.toLowerCase();
    const foodPrefMatch = allLeadText.match(/\b(veg(?:etarian)?|non[\s-]?veg(?:etarian)?|both)\b/i);
    const foodPref = foodPrefMatch ? foodPrefMatch[0] : '';

    const leadCoords = resolveLocationToCoords(location) as { lat: number; lng: number } | null;
    const searchAreaNorm = normalizeAreaName(location);

    // 2. Fetch all PG candidates (Google Sheet is primary — most live)
    let sheetPGs: any[] = [];
    try {
      const sheetData = await fetchLivePGData();
      sheetPGs = sheetData.map((p: any) => ({ ...p, _src: 'sheet', hasLiveRooms: true }));
    } catch (e) {
      console.warn('[suggestions] Sheet fetch failed:', e);
    }

    const [iqProps, dbProps] = await Promise.all([
      IQProperty.find({}).lean(),
      Property.find({ isActive: true }).lean(),
    ]);

    const iqCandidates = (iqProps as any[]).map((p: any) => ({
      ...p,
      id: p._id?.toString(),
      _src: 'iq',
      hasLiveRooms: true,
    }));

    const dbCandidates = (dbProps as any[]).map((p: any) => ({
      ...p,
      id: p._id?.toString(),
      area: p.area || p.location || '',
      gender: p.gender || '',
      _src: 'db',
      hasLiveRooms: true,
    }));

    // De-dupe: sheet > iq > db; key = name+area
    const seen = new Set<string>();
    const allCandidates: any[] = [];
    for (const p of [...sheetPGs, ...iqCandidates, ...dbCandidates]) {
      const key = `${normStr(p.name || '')}|${normStr(p.area || '')}`;
      if (!seen.has(key)) {
        seen.add(key);
        allCandidates.push(p);
      }
    }

    // 3. Score every candidate
    const scored: any[] = [];

    for (const p of allCandidates) {
      // ── Location ──────────────────────────────────────────────────────────
      const pgAreaNorm = normalizeAreaName(p.area || '');
      const pgLocNorm  = normalizeAreaName(p.locality || p.location || '');
      const pgLandNorm = normalizeAreaName(p.landmarks || p.nearbyLandmarks || '');

      const pgLat: number | undefined =
        p.lat ||
        findAreaCoordinates(p.nearbyLandmarks || '')?.lat ||
        findAreaCoordinates(p.locality || '')?.lat ||
        findAreaCoordinates(p.area || '')?.lat;
      const pgLng: number | undefined =
        p.lng ||
        findAreaCoordinates(p.nearbyLandmarks || '')?.lng ||
        findAreaCoordinates(p.locality || '')?.lng ||
        findAreaCoordinates(p.area || '')?.lng;

      const locResult = scoreLocation(
        searchAreaNorm,
        leadCoords,
        pgAreaNorm,
        pgLocNorm,
        pgLandNorm,
        pgLat,
        pgLng
      );
      if (locResult.exclude) continue;

      // ── Gender ─────────────────────────────────────────────────────────────
      const pgType = classifyPgGender(p.gender || '', p.name || '');
      const genderResult = scoreGender(leadGenderClass, pgType);
      if (genderResult.exclude) continue; // hard exclusion — wrong gender

      // ── Budget ─────────────────────────────────────────────────────────────
      const roomEntries = parseRoomEntries(
        p.price || p.waTemplate || '',
        p.lows || '',
        p.priceMin ?? (p.minPrice && p.minPrice > 0 ? p.minPrice : null),
        p.priceMax ?? null
      );
      const prices = roomEntries.map((e: any) => e.price);

      // Also pull minPrice/maxPrice from flat fields (for sheet PGs)
      if (prices.length === 0) {
        const flatMin = p.minPrice || p.priceMin || 0;
        const flatMax = p.maxPrice || p.priceMax || flatMin;
        if (flatMin > 0) {
          prices.push(flatMin);
          if (flatMax > flatMin) prices.push(flatMax);
        }
      }

      const budgetResult = scoreBudget(budget, prices);
      if (budgetResult.exclude) continue; // >50% over budget → skip

      // ── Food ───────────────────────────────────────────────────────────────
      const pgFood = p.food || p.foodType || p.meals || '';
      const foodResult = scoreFood(foodPref, pgFood);

      // ── Total score (out of 100) ───────────────────────────────────────────
      // Weights: Location 40 + Gender 25 + Budget 25 + Food 10 = 100
      const total = locResult.score + genderResult.score + budgetResult.score + foodResult.score;

      scored.push({
        id: p.id || p.pid || String(p._id || ''),
        name: p.name,
        area: p.area,
        locality: p.locality || '',
        landmarks: p.landmarks || p.nearbyLandmarks || '',
        gender: p.gender || '',
        food: pgFood,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        roomEntries,
        mapsLink: p.mapsLink || p.googleMapsLink || '',
        managerContact: p.managerContact || p.managerNumber || '',
        managerName: p.managerName || 'Manager',
        propertyType: p.propertyType || 'Mid',
        targetAudience: p.targetAudience || 'Both',
        source: p._src,
        score: Math.round(total),
        distanceKm: locResult.distanceKm !== null ? parseFloat((locResult.distanceKm).toFixed(1)) : null,
        scores: {
          location: locResult.score,
          gender:   genderResult.score,
          budget:   budgetResult.score,
          food:     foodResult.score,
        },
      });
    }

    // 4. Sort: by score desc, then distance asc as tie-breaker
    const top3 = scored
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Same score → prefer closer
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      })
      .slice(0, 3);

    return NextResponse.json({
      suggestions: top3,
      leadId,
      criteria: {
        location: location || '(any)',
        budget: budget || null,
        gender: leadGenderClass,
        food: foodPref || '(any)',
      },
    });
  } catch (err: any) {
    console.error('[suggestions] error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
