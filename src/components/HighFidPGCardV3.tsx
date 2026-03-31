'use client';

import React, { useState } from 'react';
import { 
  MapPin, Phone, Users, Calendar, Copy, Check, ChevronDown, ChevronUp, 
  Shield, Zap, Utensils, Wifi, Info, Send, ExternalLink
} from 'lucide-react';
import { T, Btn, Chip } from './Gharpayy3X';
import { toast } from 'sonner';

export interface PGEntry {
  id: number;
  name: string;
  area: string;
  locality: string;
  landmarks: string;
  mapsLink: string;
  triplePrice: number | null;
  doublePrice: number | null;
  singlePrice: number | null;
  minPrice: number | null;
  gender: string;
  propertyType: string;
  meals: string;
  usp: string;
  utilities: string;
  deposit: string;
  minStay: string;
  houseRules: string;
  vibe: string;
  walkDist: string;
  amenities: string[];
  safety: string[];
  commonAreas: string[];
  managerContact: string;
  managerName: string;
  targetAudience: string;
}

const HighFidPGCardV3 = ({ pg, idx, onSchedule }: { pg: PGEntry, idx: number, onSchedule: (pg: PGEntry) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const minPrice = pg.minPrice || Math.min(...[pg.triplePrice, pg.doublePrice, pg.singlePrice].filter(v => v && v > 0) as number[]);

  const formatPrice = (p: number | null) => p ? `₹${(p/1000).toFixed(0)}k` : 'N/A';

  const copyWACard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `*GHARPAYY — ${pg.name.toUpperCase()}*
📍 ${pg.area} | ${pg.locality?.split(',')[0] || ''}
🗺️ Maps: ${pg.mapsLink || 'https://maps.google.com'}

👫 For: ${pg.gender} | ✨ ${pg.propertyType}

💰 *Pricing:*
• Triple: ${formatPrice(pg.triplePrice)}/mo
• Double: ${formatPrice(pg.doublePrice)}/mo
• Single: ${formatPrice(pg.singlePrice)}/mo

🍴 *Food:* ${pg.meals}
🚀 *USP:* ${pg.usp}

Interested? Book a visit now!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('WhatsApp card copied!');
  };

  const genderTag = pg.gender?.toLowerCase().includes('girl')
    ? { bg: 'rgba(236,72,153,0.1)', color: '#EC4899', border: 'rgba(236,72,153,0.3)', label: 'Girls' }
    : pg.gender?.toLowerCase().includes('boy')
      ? { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)', label: 'Boys' }
      : { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: 'rgba(139,92,246,0.3)', label: pg.gender || 'Co-live' };

  return (
    <div 
      className="gp-fade"
      style={{ 
        background: T.bg2, 
        border: `1px solid ${T.line}`, 
        borderRadius: 16, 
        padding: "20px", 
        display: "flex", 
        flexDirection: "column", 
        gap: 16,
        transition: "all 0.2s ease",
        animationDelay: `${idx * 0.05}s`,
        boxShadow: isExpanded ? "0 10px 40px -10px rgba(0,0,0,0.5)" : "none",
        borderColor: isExpanded ? T.lineA : T.line
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: T.t0, letterSpacing: "-0.02em", marginBottom: 4 }}>{pg.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: T.t2, display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={12} /> {pg.area} · {pg.locality?.split(',')[0]}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ background: genderTag.bg, color: genderTag.color, border: `1px solid ${genderTag.border}`, borderRadius: 6, fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4 }}>
               {genderTag.label}
            </span>
            <span style={{ background: T.bg3, color: T.gold, border: `1px solid ${T.goldB}`, borderRadius: 6, fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: "3px 9px" }}>
              {pg.propertyType || 'Mid'}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.gold }}>from {formatPrice(minPrice)}/mo</div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2, marginTop: 2 }}>
            T:{formatPrice(pg.triplePrice)} D:{formatPrice(pg.doublePrice)} S:{formatPrice(pg.singlePrice)}
          </div>
        </div>
      </div>

      {/* Description / USP */}
      <div style={{ background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid ${T.gold}` }}>
        <p style={{ fontSize: 12, color: T.t1, fontStyle: "italic", lineHeight: 1.5 }}>
          "✨ Welcome to Gharpayy {pg.name}! 💖 We're thrilled you found us..."
        </p>
      </div>

      {/* Quick Features */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.bg3, padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.line}` }}>
          <Utensils size={13} className="text-orange-500" />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.t0 }}>{pg.meals}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.bg3, padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.line}` }}>
          <Wifi size={13} className="text-blue-500" />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.t0 }}>WiFi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.bg3, padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.line}` }}>
          <Zap size={13} className="text-yellow-500" />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.t0 }}>{pg.usp?.split(',')[0]}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button 
          onClick={() => window.open(pg.mapsLink, '_blank')}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px", color: T.t0, fontSize: 12, fontWeight: 600 }}
        >
          <MapPin size={14} /> Maps
        </button>
        <button 
          onClick={copyWACard}
          style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px", color: T.t0, fontSize: 12, fontWeight: 600 }}
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} 
          {copied ? 'Copied!' : 'Copy WA Card'}
        </button>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: T.t2, fontSize: 12, fontWeight: 600, padding: "0 8px" }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
          {isExpanded ? 'Less' : 'Details'}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="gp-fade pt-4 border-t border-slate-800/50 flex flex-col gap-6" style={{ animationDuration: '0.2s' }}>
          
          {/* Detailed Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Room Types</div>
              <div style={{ fontSize: 12, color: T.t0, fontWeight: 600 }}>T: {formatPrice(pg.triplePrice)} | D: {formatPrice(pg.doublePrice)} | S: {formatPrice(pg.singlePrice)}</div>
              <div style={{ fontSize: 11, color: T.t2, marginTop: 2 }}>Min Stay: {pg.minStay}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deposit</div>
              <div style={{ fontSize: 12, color: T.t0, fontWeight: 600 }}>{pg.deposit}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Utilities</div>
              <div style={{ fontSize: 11, color: T.t1, lineHeight: 1.4 }}>{pg.utilities}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Walk Dist</div>
              <div style={{ fontSize: 11, color: T.t1 }}>{pg.walkDist}</div>
            </div>
          </div>

          {/* Amenities Chips */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amenities</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pg.amenities?.map(a => <Chip key={a} label={a} color={T.t1} />)}
            </div>
          </div>

          {/* Common Areas */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Common Areas</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pg.commonAreas?.map(a => <Chip key={a} label={a} color={T.violet} />)}
            </div>
          </div>

          {/* Safety */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Safety</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pg.safety?.map(a => <Chip key={a} label={a} color={T.green} />)}
            </div>
          </div>

          {/* Extra Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: T.bg3, padding: 12, borderRadius: 10, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, textTransform: "uppercase" }}>Vibe</div>
              <p style={{ fontSize: 11, color: T.t1, lineHeight: 1.5 }}>{pg.vibe}</p>
            </div>
            <div style={{ background: T.bg3, padding: 12, borderRadius: 10, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, textTransform: "uppercase" }}>Nearby Landmarks</div>
              <p style={{ fontSize: 11, color: T.t1, lineHeight: 1.5 }}>{pg.landmarks}</p>
            </div>
            <div style={{ background: T.bg3, padding: 12, borderRadius: 10, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, textTransform: "uppercase" }}>House Rules</div>
              <p style={{ fontSize: 11, color: T.t1, lineHeight: 1.5 }}>{pg.houseRules}</p>
            </div>
          </div>

          {/* Manager Info */}
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: T.greenD, padding: 8, borderRadius: 8 }}>
                <Phone size={16} className="text-green-500" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.t2, textTransform: "uppercase" }}>Manager</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.t0 }}>{pg.managerName} · {pg.managerContact}</div>
              </div>
            </div>
            <Btn variant="gold" onClick={() => onSchedule(pg)}>
              <Calendar size={14} /> Schedule Visit
            </Btn>
          </div>

          {/* WhatsApp Card Preview */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 8, textTransform: "uppercase" }}>WhatsApp Card Preview</div>
            <div style={{ background: "#DCF8C6", padding: 16, borderRadius: 12, border: "1px solid #c7e5a9", color: "#303030", fontFamily: "'Courier New', Courier, monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
              {`✨ *GHARPAYY — ${pg.name.toUpperCase()}*
📍 Koramangala | silk board
📍 Maps: ${pg.mapsLink}

👫 For: ${pg.gender} | ✨ ${pg.propertyType}

💰 *Pricing:*
• Triple: ${formatPrice(pg.triplePrice)}/mo
• Double: ${formatPrice(pg.doublePrice)}/mo
• Single: ${formatPrice(pg.singlePrice)}/mo

🍴 *Food:* ${pg.meals}
🚀 Welcome to Gharpayy ${pg.name}! 💖 We're thrilled you found us...`}
            </div>
            <button 
              onClick={copyWACard}
              style={{ width: "100%", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: T.bg4, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px", color: T.t0, fontSize: 12, fontWeight: 700 }}
            >
              <Copy size={14} /> Copy Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Divider = () => <div style={{ height: 1, background: T.line, margin: "8px 0" }} />;

export default HighFidPGCardV3;
