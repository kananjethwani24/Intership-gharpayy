import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import IQProperty from '@/models/IQProperty';
import { AREAS, TECH_PARKS, METRO_STATIONS } from '@/lib/gharpayGeoData';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { leadText } = await req.json();

    if (!leadText) {
      return NextResponse.json({ error: 'Lead text is required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'Anthropic API Key is missing. Please add ANTHROPIC_API_KEY to your .env.local file.' 
      }, { status: 500 });
    }

    await connectToDatabase();

    // 1. Build the Geo-Intelligence Snapshot for the AI
    const areaList = AREAS.map(a =>
      `${a.name} (ID: ${a.id}, Region: ${a.region}, Tier: ${a.tier})`
    ).join(" | ");
    
    const parkList = TECH_PARKS.map(p => `${p.name} [${p.area}]`).join(", ");
    
    const snapshot = `
AREAS: ${areaList}
TECH_PARKS: ${parkList}
    `.trim();

    // 2. Call Anthropic Claude for semantic matching
    const systemPrompt = `You are the geo-intelligence engine for Gharpay.
Task: Extract intent and match it to specific area IDs from the provided database.
Database: ${snapshot}

Return ONLY valid JSON:
{
  "matched_area_ids": ["up to 5 best area ids from AREAS"],
  "reasoning": "brief explanation"
}`;

    let matchedAreaNames: string[] = [];
    let reasoning = "";

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: `Lead text: ${leadText}` }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'AI Matching failed');
      }

      const aiResponse = JSON.parse(data.content[0].text);
      const matchedIds = aiResponse.matched_area_ids || [];
      reasoning = aiResponse.reasoning;

      matchedAreaNames = matchedIds
        .map((id: string) => AREAS.find(a => a.id === id)?.name)
        .filter(Boolean);

    } catch (aiError: any) {
      console.warn("AI Matching failed, falling back to keywords:", aiError.message);
      
      // FALLBACK: Simple keyword matching if AI fails
      const lowerText = leadText.toLowerCase();
      matchedAreaNames = AREAS
        .filter(a => lowerText.includes(a.name.toLowerCase()) || lowerText.includes(a.id.replace('_',' ')))
        .slice(0, 3)
        .map(a => a.name);
        
      reasoning = `[Fallback Match] AI was unavailable (${aiError.message}). Matched by keywords instead.`;
    }

    // 3. Query both Property and IQProperty for these areas
    if (matchedAreaNames.length === 0) {
      return NextResponse.json({ matches: [], reasoning: "No areas matched." });
    }

    const areaQuery = {
      area: { $in: matchedAreaNames.map((name: string) => new RegExp(`^${name}$`, 'i')) }
    };

    const [regularProperties, iqProperties] = await Promise.all([
      Property.find(areaQuery).lean(),
      IQProperty.find(areaQuery).lean(),
    ]);

    // 5. Transform results to a unified format
    const allMatches = [
      ...regularProperties.map((p: any) => ({ ...p, source: 'inventory' })),
      ...iqProperties.map((p: any) => ({ ...p, source: 'iq_sheet' }))
    ];

    return NextResponse.json({
      matches: allMatches,
      reasoning,
      matchedAreas: matchedAreaNames
    });

  } catch (error: any) {
    console.error('AI Match Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
