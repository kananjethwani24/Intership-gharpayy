import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import IQProperty from '@/models/IQProperty';
import { AREA_COORDINATES } from '@/lib/areaCoordinates';
import { getZoneByArea } from '@/lib/zones';

export async function GET() {
  try {
    await connectToDatabase();
    const properties = await IQProperty.find({}).sort({ createdAt: -1 });
    return NextResponse.json(properties);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { data } = await req.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Data must be an array' }, { status: 400 });
    }

    await connectToDatabase();

    const parsePrice = (priceStr: string) => {
      if (!priceStr) return { min: 0, max: 0 };
      
      const cleaned = priceStr.replace(/,/g, '');
      const regex = /(\d+(?:\.\d+)?)\s*(k|l|lakh|cr)?\b/gi;
      let match;
      const prices = [];
      
      while ((match = regex.exec(cleaned)) !== null) {
        let val = parseFloat(match[1]);
        const suffix = match[2]?.toLowerCase();
        
        if (suffix === 'k') val *= 1000;
        else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
        else if (suffix === 'cr') val *= 10000000;
        
        // Only consider valid rent amounts (e.g. >= 1000) to avoid parsing dates, room nums etc.
        if (val >= 1000) {
          prices.push(val);
        }
      }
      
      if (prices.length === 0) return { min: 0, max: 0 };
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    };

    const cleanPriceText = (rawText: string) => {
      if (!rawText) return "Price TBD";
      // 1. Remove anything between tildes (like ~Originally 15k~)
      let cleaned = rawText.replace(/~[^~]*~/g, '');
      // 2. Remove Emojis (Non-ASCII)
      cleaned = cleaned.replace(/[^\x00-\x7F]/g, '');
      // 3. Remove Asterisks
      cleaned = cleaned.replace(/\*/g, '');
      
      const lines = cleaned.split('\n');
      const validLines = [];
      
      for (let line of lines) {
        let text = line.trim();
        // If it references sharing or has a number
        if (/\d+k/i.test(text) || /sharing/i.test(text) || /room/i.test(text)) {
           // Remove fluffy words but KEEP parsing keywords like 'now' and 'just'
           // text = text.replace(/now only|now just|specially priced at|now|formerly|originally/gi, ''); // REMOVED: keep these for the parser!
           text = text.replace(/[-!]/g, '').replace(/\s+/g, ' ').trim();
           if (text) validLines.push(text);
        }
      }
      
      if (validLines.length > 0) return validLines.join('\n');
      return cleaned.replace(/\s+/g, ' ').trim();
    };

    const validData = data.filter((item: any) => {
      // Check if the row has any actual content (Google Sheets often exports empty trailing rows)
      return Object.values(item).some((val: any) => val && typeof val === 'string' && val.trim() !== '');
    });

    const getVal = (item: any, keywords: string[], exactMatch?: string) => {
      if (exactMatch && item[exactMatch] !== undefined) return item[exactMatch];
      const match = Object.keys(item).find(k => 
        keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase()))
      );
      if (item.name === "MIVON COED") console.log("🧪 Sync Item Data Keys:", Object.keys(item));
      return match ? item[match] : undefined;
    };

    let transformedData = validData.map((item: any) => {
      // Find critical fields with fallback keywords
      const rawPrice = getVal(item, ['price/monthly', 'monthly rent', 'price', 'rent'], 'Price/Monthly (Do not Disclose Without Interest Shown)');
      const cleanedPriceString = cleanPriceText(rawPrice);
      const priceInfo = parsePrice(cleanedPriceString);
      
      let mapsLink = getVal(item, ['exact location', 'google maps link', 'maps link', 'location link', 'location', 'maps'], 'Google Maps Link') || "";
      let videosLink = getVal(item, ['youtube', 'yt', 'video', 'videos', 'video folder', 'video link'], 'Drive Folder (Videos) (Only Videos)') || "";

      // DEEP SCAN FALLBACK: If links aren't found by header, scan ALL values for a URL signature
      const allValues = Object.values(item).map(v => String(v));
      
      if (!mapsLink) {
        const foundMap = allValues.find(v => v.includes('maps.app.goo.gl') || v.includes('goo.gl/maps') || v.includes('google.com/maps/'));
        if (foundMap) mapsLink = foundMap;
      }
      
      if (!videosLink) {
        const foundVideo = allValues.find(v => v.includes('youtube.com') || v.includes('youtu.be'));
        if (foundVideo) videosLink = foundVideo;
      }

      const areaName = getVal(item, ['area', 'neighborhood', 'region'], 'Area') || "";
      const pgName = getVal(item, ['name of pg', 'pg name', 'property name', 'actual name', 'actual pg name', 'gharpyy name', 'names', 'pg'], 'Gharpayy\'s Name of PG') || getVal(item, ['actual name of pg'], 'Actual Name of PG') || "Unnamed Property";
      const locality = getVal(item, ['locality', 'sublocality', 'landmark'], 'Locality') || "";

      // ... existing coordinate extraction logic ...
      let lat: number | undefined;
      let lng: number | undefined;

      const latK = Object.keys(item).find(k => k.toLowerCase() === 'lat' || k.toLowerCase().includes('latitude'));
      const lngK = Object.keys(item).find(k => k.toLowerCase() === 'lng' || k.toLowerCase().includes('longitude'));
      const coordK = Object.keys(item).find(k => k.toLowerCase().includes('coordinate'));

      if (latK && item[latK]) lat = parseFloat(String(item[latK]).replace(/[^\d.-]/g, ''));
      if (lngK && item[lngK]) lng = parseFloat(String(item[lngK]).replace(/[^\d.-]/g, ''));
      
      if ((!lat || !lng) && coordK && item[coordK]) {
         const parts = String(item[coordK]).split(/[,\s/]+/);
         if (parts.length >= 2) {
           lat = parseFloat(parts[0].replace(/[^\d.-]/g, ''));
           lng = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
         }
      }
      
      if ((!lat || !lng) && mapsLink) {
        const coordMatch = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                           mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
                           mapsLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                           mapsLink.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
        }
      }
      
      if (!lat || !lng) {
        const areaData = AREA_COORDINATES[areaName];
        if (areaData) {
          lat = areaData.lat;
          lng = areaData.lng;
        }
      }
      
      return {
        name: pgName,
        actualName: getVal(item, ['actual name'], 'Actual Name of PG') || pgName,
        area: areaName,
        zone: getZoneByArea(areaName).zone,
        subzone: getZoneByArea(areaName).subzone,
        locality: locality,
        nearbyLandmarks: getVal(item, ['nearby landmarks', 'landmark'], 'Nearby Landmarks'),
        
        price: cleanedPriceString,
        priceMin: priceInfo.min,
        priceMax: priceInfo.max,
        managerName: getVal(item, ['manager name'], 'Manager Name'),
        managerContact: getVal(item, ['manager contact', 'manager phone', 'manager number'], 'Manager Contact'),
        ownerName: getVal(item, ['owner name'], 'Owner Name'),
        ownerNumber: getVal(item, ['owner number', 'owner phone', 'owner contact'], 'Owner Number'),
        groupName: getVal(item, ['group name'], 'Group Name'),
        googleMapsLink: mapsLink,
        lat,
        lng,
        gender: getVal(item, ['gender', 'boy/girl', 'sex'], 'Gender ( Boys/Girls/Co-live)'),
        targetAudience: getVal(item, ['target audience', 'students', 'working'], 'Target Audience (Students / Working Professionals / Both)'),
        propertyType: getVal(item, ['property type', 'premium', 'mid', 'budget'], 'Property Type (Premium / Mid / Budget)'),
        roomType: getVal(item, ['room type'], 'Room Type'),
        furnishingDetails: getVal(item, ['furnishing'], 'Furnishing Details'),
        walkingDistance: getVal(item, ['walking distance'], 'Walking Distance to Landmarks (Mins)'),
        accessibility: getVal(item, ['accessibility'], 'Accessibility'),
        noiseLevel: getVal(item, ['noise'], 'Noise Level'),
        surroundingVibe: getVal(item, ['vibe', 'atmosphere'], 'Surrounding Vibe'),
        foodType: getVal(item, ['food type', 'veg', 'non-veg'], 'Food Type (Veg / Non-Veg / Both / Self-Cook Option)'),
        commonAreaFeatures: getVal(item, ['common area'], 'Common Area Features'),
        amenities: getVal(item, ['amenities'], 'Amenities'),
        safetyFeatures: getVal(item, ['safety'], 'Safety Features'),
        mealsIncluded: getVal(item, ['meals'], 'Meals Included'),
        foodTimings: getVal(item, ['food timings'], 'Food Timings/ Details'),
        eBillUtilities: getVal(item, ['e bill', 'utilities', 'electricity'], 'E Bill / Utilities Included'),
        cleaningFrequency: getVal(item, ['cleaning'], 'Cleaning Frequency'),
        usp: getVal(item, ['usp', 'highlights'], 'USP of Property'),
        houseRules: getVal(item, ['house rules', 'rules'], 'House Rules'),
        lows: getVal(item, ['lows'], "Lows ( Don't Disclose)"),
        securityDeposit: getVal(item, ['security deposit', 'deposit', 'monthly deposit'], 'Security Deposit info'),
        minimumStay: getVal(item, ['minimum stay', 'lock-in'], 'Minimum Stay'),
        notes: getVal(item, ['notes', 'remarks', 'other info'], 'Notes'),
        brochureLink: getVal(item, ['brochure', 'pdf folder'], 'Drive Folder (Brochure) (Only PDF)'),
        photosLink: getVal(item, ['photos', 'image folder'], 'Drive Folder (Photos) ( Only Images)'),
        videosLink: videosLink,
      };
    });

    // Clear existing IQ properties and bulk insert new ones
    // Or we could append, but usually boss wants the "latest" sheet
    await IQProperty.deleteMany({});
    const result = await IQProperty.insertMany(transformedData);

    return NextResponse.json({ success: true, count: result.length });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
