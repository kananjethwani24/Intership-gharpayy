import fs from 'fs';

const code = \`"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLeads } from '@/hooks/useCrmData';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles, MapPin, IndianRupee, Bed, Check, Loader2, Zap,
  Building2, Users, Star, ShieldCheck, Home, Phone,
  ExternalLink, Utensils, Info, ListChecks, Link as LinkIcon, ChevronRight, CheckCircle2, Navigation,
  Clock, Train, Building, AlertCircle, HelpCircle, ChevronDown, List, Map as MapIcon, Landmark,
  MessageSquare, Bot, Send, Search
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  haversine, roadDistance, driveTimeMinutes, 
  resolveLocationToCoords, BANGALORE_GIS_DATA, getAreaTier,
  normalizeAreaName
} from '@/lib/areaCoordinates';
import { 
  Collapsible, CollapsibleContent, CollapsibleTrigger 
} from '@/components/ui/collapsible';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const ZONES = [
  { zone: "South", priority: 1, keywords: ["koramangala","kormangala","kora","btm layout","btm","jayanagar","jp nagar","hsr layout","hsr","banashankari","basavanagudi","electronic city","ecity","silk board","agara","madiwala","christ university","hosur road","nimhans"] },
  { zone: "East", priority: 2, keywords: ["whitefield","itpl","brookfield","hoodiCircle","kr puram","bellandur","sarjapur","ecospace","rmz ecoworld","indiranagar","domlur","ejipura","cv raman nagar","old airport road","hal","marathahalli","mahadevapura","bagmane"] },
  { zone: "North", priority: 3, keywords: ["yelahanka","hebbal","manyata tech","manyata","nagawara","thanisandra","jakkur","banaswadi","kalyan nagar","rt nagar","sahakara nagar","hennur","peenya"] },
  { zone: "West", priority: 4, keywords: ["rajajinagar","vijaynagar","yeshwanthpur","nagarbhavi","chord road","mahalakshmi layout","malleshwaram","tumkur road"] },
  { zone: "Central", priority: 5, keywords: ["mg road","brigade road","richmond road","shanthinagar","ashok nagar","vittal mallya","majestic","frazer town","cubbon park","ub city","vasanth nagar","lavelle road"] },
];

function detectZone(rawText) {
  if (!rawText) return null;
  const t = rawText.toLowerCase();
  for (const z of [...ZONES].sort((a,b)=>a.priority-b.priority)) {
    if (z.keywords.some(kw=>t.includes(kw))) return z;
  }
  return null;
}

function parseWhatsAppLead(raw) {
  if (!raw || raw.trim().length < 4) return null;
  const clean = raw.replace(/\\\\*{1,2}([^*\\\\n]+)\\\\*{1,2}/g, \"$1\").replace(/_{1,3}([^_\\\\n]+)_{1,3}/g, \"$1\");
  const grab = (...patterns) => {
    for (const re of patterns) {
      const m = clean.match(re);
      if (m?.[1]) return m[1].replace(/[^\\\\w\\\\s,\\\\.\\\\-:\\\\(\\\\)\\\\/]/g, \"\").trim();
    }
    return \"\";
  };
  const name = grab(/(?:^|\\\\n)\\\\s*Name\\\\s*[:\\\\-–*]+\\\\s*([^\\\\n,📱\\\\d]{2,40})/im, /(?:^|\\\\n)\\\\s*\\\\.Name\\\\s+([^\\\\n.]{2,35})/im).trim();
  const phoneMatch = clean.match(/(?:\\\\+?91[-\\\\s]?)?([6-9]\\\\d{9})/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\\\\D/g, \"\") : \"\";
  const location = grab(/Preferred Location[^:\\\\n]*[:\\\\-–]+\\s*([^\\\\n💰II📆👨🏢]{3,80})/i, /Location\\\\s*[:\\\\-–]+\\\\s*([^\\\\n💰📆👨🏢]{3,60})/i, /Area\\\\s*[:\\\\-–]+\\\\s*([^\\\\n]{3,50})/i).trim();
  const budget = grab(/(?:Actual budget|Budget Range|Budget|Budjet)\\\\s*[:\\\\-–(]+\\\\s*([^\\\\n)📆👨🏢]{2,35})/i).trim();
  const genderRaw = grab(/Need[^:\\\\n]*[:\\\\-–]+\\\\s*([^\\\\n✨📞]{2,35})/i).toLowerCase();
  const moveIn = grab(/Move[- ]?in[- ]?Date\\\\s*[:\\\\-–*]+\\\\s*([^\\\\n👨🏢👫✨]{2,35})/i).trim();
  const isWorking = /\\\\bworking\\\\b/i.test(clean);
  const isStudent = /\\\\bstudent\\b/i.test(clean);
  let occupation = isWorking && isStudent ? \"Student/Working\" : isWorking ? \"Working\" : isStudent ? \"Student\" : \"\";
  let gender = \"\";
  if (genderRaw.includes(\"girl\") || /\\\\bgirls?\\b/i.test(clean)) gender = \"Girls\";
  else if (genderRaw.includes(\"boy\") || /\\\\bboys?\\b/i.test(clean)) gender = \"Boys\";
  else if (genderRaw.includes(\"coed\") || /\\\\bcoed\\b/i.test(clean)) gender = \"Co-live\";
  const zoneObj = detectZone(raw);
  if (!phone && !name && !location) return null;
  return { name, phone, location, budget, gender, moveIn, occupation, zone: zoneObj?.zone || \"\" };
}

async function geocodeAddress(address) {
  if (!GOOGLE_API_KEY) return null;
  const encoded = encodeURIComponent(address + \", Bengaluru, Karnataka, India\");
  const url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encoded + '&key=' + GOOGLE_API_KEY;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === \"OK\" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      return { lat, lng, formattedAddress, source: \"google\" };
    }
  } catch (e) { console.error(\"Geocoding\", e); }
  return null;
}

const GenderBadge = ({ gender, variant = 'standard' }) => {
  const g = gender?.toLowerCase() || '';
  let label = 'Any';
  let color = 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  if (g.includes('boy')) { label='Boys'; color='bg-blue-500/10 text-blue-600 border-blue-500/20'; } 
  else if (g.includes('girl')) { label='Girls'; color='bg-pink-500/10 text-pink-600 border-pink-500/20'; } 
  if (variant === 'pill') {
    const pillColors = { Boys: 'bg-blue-500/20 text-blue-400 border-blue-500/30', Girls: 'bg-pink-500/20 text-pink-400 border-pink-500/30', Any: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    return <Badge variant=\"outline\" className={\`px-4 py-1.5 rounded-full font-bold text-xs \${pillColors[label] || pillColors.Any}\`}>{label}</Badge>;
  }
  return <span className={\`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border \${color}\`}><Users size={9} className=\"mr-1\" />{label}</span>;
}

const Matching = () => {
  const { data: leads } = useLeads();
  const [waRawText, setWaRawText] = useState('');
  const [pgSearchQuery, setPgSearchQuery] = useState('');
  const [pgSearchRange, setPgSearchRange] = useState('5');
  const [pgResults, setPgResults] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [isPgLoading, setIsPgLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pgResolvedOrigin, setPgResolvedOrigin] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [iq, db] = await Promise.all([ fetch('/api/iq-properties').then(r=>r.json()), fetch('/api/properties').then(r=>r.json()) ]);
        const res = [...(iq||[]).map(p=>({...p,source:'iq'})), ...(db||[]).map(p=>({...p,source:'db'}))].map(pg => {
          const coords = resolveLocationToCoords(pg.locality || pg.area || pg.name || '');
          return { ...pg, pLat: coords?.lat, pLng: coords?.lng };
        });
        setAllProperties(res);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const runSearch = useCallback(async () => {
    if (!pgSearchQuery) return;
    setIsPgLoading(true);
    let origin = resolveLocationToCoords(pgSearchQuery);
    if (!origin) origin = await geocodeAddress(pgSearchQuery);
    if (!origin) { setIsPgLoading(false); return; }
    setPgResolvedOrigin(origin);
    const range = parseFloat(pgSearchRange);
    const matched = allProperties.map(p => ({ ...p, distanceKm: haversine(origin.lat, origin.lng, p.pLat, p.pLng) || 0 }))
      .filter(p => p.pLat && p.distanceKm <= range)
      .sort((a,b)=>a.distanceKm - b.distanceKm);
    setPgResults(matched);
    setIsPgLoading(false);
  }, [pgSearchQuery, pgSearchRange, allProperties]);

  const onWaTextChange = (v) => {
    setWaRawText(v);
    const parsed = parseWhatsAppLead(v);
    if (parsed?.location) setPgSearchQuery(parsed.location);
  };

  return (
    <AppLayout title=\"Property Matching\">
      <div className=\"p-8 max-w-[1600px] mx-auto space-y-8\">
        <div className=\"flex justify-between items-end\">
          <div className=\"space-y-1\">
            <h1 className=\"text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tighter\">Intelligence Matcher <Sparkles className=\"text-orange-400 font-black\" size={32} /></h1>
            <p className=\"text-slate-500 font-medium text-sm\">GIS-Powered Property Discovery for Bangalore</p>
          </div>
        </div>

        <div className=\"grid grid-cols-12 gap-8\">
          <div className=\"col-span-12 xl:col-span-4 space-y-8\">
            <div className=\"bg-white rounded-[2.5rem] border p-8 space-y-8 shadow-2xl relative overflow-hidden\">
              <div className=\"space-y-4\">
                <label className=\"text-[10px] font-black uppercase tracking-widest text-slate-400\">WhatsApp Lead Parsing</label>
                <Textarea value={waRawText} onChange={(e)=>onWaTextChange(e.target.value)} placeholder=\"Paste WhatsApp text here...\" className=\"min-h-[180px] rounded-[1.5rem] bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-orange-400 text-sm leading-relaxed p-6\" />
              </div>
              <div className=\"space-y-4\">
                <label className=\"text-[10px] font-black uppercase tracking-widest text-slate-400\">Location Discovery</label>
                <div className=\"flex gap-3\">
                  <div className=\"relative flex-1\">
                    <MapPin className=\"absolute left-5 top-1/2 -translate-y-1/2 text-orange-400\" size={18}/>
                    <Input value={pgSearchQuery} onChange={(e)=>setPgSearchQuery(e.target.value)} placeholder=\"Area or Landmark\" className=\"pl-14 h-16 rounded-full bg-slate-50 border-none font-black text-slate-900\" />
                  </div>
                  <Select value={pgSearchRange} onValueChange={setPgSearchRange}>
                    <SelectTrigger className=\"w-28 h-16 rounded-full bg-slate-50 border-none font-black text-slate-900 px-6\"><SelectValue /></SelectTrigger>
                    <SelectContent className=\"rounded-2xl font-bold\"><SelectItem value=\"2\">2 KM</SelectItem><SelectItem value=\"5\">5 KM</SelectItem><SelectItem value=\"10\">10 KM</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={runSearch} className=\"w-full h-18 rounded-full bg-slate-900 hover:bg-black text-white font-black text-xl shadow-lg\">Trigger Matching</Button>
            </div>
          </div>

          <div className=\"col-span-12 xl:col-span-8 space-y-6\">
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                {pgResults.map((p,idx)=>(
                  <div key={idx} className=\"bg-white rounded-[2.5rem] p-8 border hover:shadow-2xl transition-all cursor-pointer\" onClick={()=>setSelectedProfile(p)}>
                    <div className=\"flex justify-between items-start mb-6\">
                        <div className=\"space-y-1\">
                          <h4 className=\"font-black text-xl text-slate-900\">{p.name}</h4>
                          <p className=\"text-xs font-black text-slate-400 uppercase\"><MapPin size={12} className=\"inline mr-1\" /> {p.locality || p.area}</p>
                        </div>
                        <div className=\"text-right\">
                          <div className=\"text-slate-900 font-black text-xl\">{p.rent || p.price}</div>
                        </div>
                    </div>
                    <div className=\"flex justify-between items-center\">
                        <div className=\"bg-orange-50 px-4 py-2 rounded-full text-orange-600 font-bold text-xs\">{p.distanceKm.toFixed(1)} KM</div>
                        <GenderBadge gender={p.gender}/>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedProfile} onOpenChange={()=>setSelectedProfile(null)}>
        <DialogContent className=\"max-w-3xl rounded-[3rem] p-8 border-none\">
           {selectedProfile && (
              <div className=\"space-y-8\">
                 <h2 className=\"text-3xl font-black\">{selectedProfile.name}</h2>
                 <p className=\"font-bold text-slate-500\">{selectedProfile.locality || selectedProfile.area}</p>
                 <div className=\"grid grid-cols-2 gap-4\">
                    <div className=\"bg-slate-50 p-6 rounded-3xl\"><span className=\"block text-[10px] font-black uppercase text-slate-400\">Rent</span><span className=\"text-2xl font-black\">{selectedProfile.rent || selectedProfile.price}</span></div>
                    <div className=\"bg-slate-50 p-6 rounded-3xl\"><span className=\"block text-[10px] font-black uppercase text-slate-400\">Distance</span><span className=\"text-2xl font-black text-orange-600\">{selectedProfile.distanceKm.toFixed(1)} KM</span></div>
                 </div>
                 <Button className=\"w-full h-16 rounded-full bg-slate-900 font-black\" onClick={()=>setSelectedProfile(null)}>Done</Button>
              </div>
           )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Matching;
\`;

fs.writeFileSync('C:\\\\Users\\\\kanan\\\\Desktop\\\\GharPayy Internship\\\\Gharpayy_Dashboard_Copy\\\\app\\\\matching\\\\page.tsx', code, 'utf8');
