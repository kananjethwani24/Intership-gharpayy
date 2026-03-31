import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
//  ZONE ENGINE
//  The single most important insight: we scan the ENTIRE raw text for zone
//  keywords — not just the parsed "location" field. This means even if the
//  parser fails to extract a clean location (garbled message, missing label,
//  emoji-only format), we still get the zone from phrases like
//  "near btm" or "kormangala 8-12k" buried anywhere in the text.
//
//  Each zone has:
//   • color/bg/border  – for pills and row accents
//   • keywords         – checked with .includes() on the lowercased full text
//   • priority         – lower number wins when multiple zones match
// ═══════════════════════════════════════════════════════════════════════════════
const ZONES = [
  {
    zone: "South", priority: 1,
    color: "#f97316", bg: "rgba(249,115,22,0.13)", border: "rgba(249,115,22,0.4)",
    keywords: [
      // Core neighbourhoods
      "koramangala","kormangala","korma","btm layout","btm","jayanagar","jp nagar","jpnagar",
      "hsr layout","hsr","banashankari","basavanagudi","lalbagh","south end","southend",
      // Electronic City corridor
      "electronic city","electronic cit","neeladri","begur","bommanahalli","hulimavu",
      // SG Palya / Silk Board belt
      "sg palya","sgpalya","silk board","silkboard","agara","madiwala","tavarekere",
      // Notable landmarks that place someone in South
      "christ university","ibc knowledge","bannerghatta","kanakapura","kalena agrahara",
      "hosur road","nexus mall","forum mall","jain university jayanagar","vv puram",
      "jayadev hospital","jp nagar metro","lalbhag","ulsoor","bull temple",
      "nimhans","st john","jain cms","jayanagar 9th","btm 2nd stage","btm stage 2",
      "btm first","btm second","sg palya nexus","koramangala nexus","koramangala 3rd",
      "koramangala 4th","koramangala 5th","koramangala 6th","koramangala block",
    ],
  },
  {
    zone: "East", priority: 2,
    color: "#22c55e", bg: "rgba(34,197,94,0.13)", border: "rgba(34,197,94,0.4)",
    keywords: [
      // Whitefield belt
      "whitefield","white field","hopefarm","itpl","kundanahalli","kundalahalli","kadugodi",
      "pattandur","pat tundur","brookfield","aces layout","hoodi","hoodi circle",
      "garudacharpalya","varthur","nallurhalli","kr puram","kr  puram","seetharampalya",
      // Bellandur / Sarjapur corridor
      "bellandur","bellandur nexus","sarjapur","ecospace","rmz ecoworld","rmz eco",
      "embassy tech village","prestige tech park","global technology park","yemalur",
      // Indiranagar / Domlur belt
      "indiranagar","indranagar","indira nagar","domlur","ejipura","murgeshpalya",
      "cv raman nagar","new thippasandra","old airport road","airport road","hal",
      // Marathahalli corridor
      "marathahalli","marathalli","mahadevapura","mahadevpura","bagmane","bagmane tech",
      "kadubeesanahalli","kadubeesana","kadubisanahalli","nallurhalli","divyasree",
      "spice garden","kundanhalli","kaverappa layout","deloitte bellandur",
      "embassy golf links","phoenix market city","brigade metropolis",
      // East-specific offices/tech parks
      "rmz infinity","rmz millenia","prestige shantiniketan","whitefield metro",
    ],
  },
  {
    zone: "North", priority: 3,
    color: "#3b82f6", bg: "rgba(59,130,246,0.13)", border: "rgba(59,130,246,0.35)",
    keywords: [
      "yelahanka","hebbal","manyata tech","manyata","manyatha","nagawara","thanisandra",
      "jakkur","banaswadi","kalyan nagar","rt nagar","sahakara nagar","devanahalli",
      "vidyaranyapura","jalahalli","bhartiya","yelanka main","embassy boulevard",
      "govindapura","nagasandra","hennur","hebbala","peenya","meenakshi mall hebbal",
    ],
  },
  {
    zone: "West", priority: 4,
    color: "#a855f7", bg: "rgba(168,85,247,0.13)", border: "rgba(168,85,247,0.35)",
    keywords: [
      "rajajinagar","vijaynagar","vijaya nagar","yeshwanthpur","yeswanthpur",
      "nagarbhavi","chord road","mahalakshmi layout","malleshwaram","tumkur road",
      "sanjayanagara","hebbala","near peenya","chandra layout",
    ],
  },
  {
    zone: "Central", priority: 5,
    color: "#f43f5e", bg: "rgba(244,63,94,0.13)", border: "rgba(244,63,94,0.35)",
    keywords: [
      "mg road","brigade road","richmond road","richmond circle","shanthinagar",
      "shanthala nagar","ashok nagar","vittal mallya","jayamahal","majestic",
      "gandhi nagar","frazer town","cubbon park","ub city","vasanth nagar",
      "trinity circle","halasuru","trinity metro","church street","lavelle road",
      "residency road","museum road","adugodi","wilson garden","seshadiri road",
      "basavangudi","pearl academy","mark square","st mark","cunningham",
    ],
  },
];

/**
 * detectZone — scans the FULL raw text, not just a parsed field.
 * Returns the first ZONES entry whose keywords appear in the lowercased text.
 * This is intentionally greedy: we'd rather produce a slightly wrong zone
 * than no zone at all, since users can correct it manually.
 */
function detectZone(rawText) {
  if (!rawText) return null;
  const t = rawText.toLowerCase();
  // Sort by priority so South wins if someone says "btm or whitefield"
  for (const z of [...ZONES].sort((a, b) => a.priority - b.priority)) {
    if (z.keywords.some((kw) => t.includes(kw))) return z;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MONTH HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_LONG  = ["january","february","march","april","may","june","july","august","september","october","november","december"];

function parseMonth(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  for (let i = 0; i < MONTH_LONG.length; i++) {
    if (t.includes(MONTH_LONG[i]) || t.includes(MONTH_SHORT[i].toLowerCase()))
      return { index: i, label: MONTH_SHORT[i] + " 2025" };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SINGLE-LEAD PARSER
//  Strips WhatsApp *bold* / _italic_ markers, then applies layered regex
//  patterns in priority order for each field. Every field has at least 2
//  fallback patterns so messy forms still yield something.
// ═══════════════════════════════════════════════════════════════════════════════
function parseLead(raw) {
  if (!raw || raw.trim().length < 4) return null;

  // Clean markdown noise but preserve content
  const clean = raw
    .replace(/\*{1,2}([^*\n]+)\*{1,2}/g, "$1")
    .replace(/_{1,3}([^_\n]+)_{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

  const grab = (...patterns) => {
    for (const re of patterns) {
      const m = clean.match(re);
      if (m?.[1]) return m[1].replace(/[📝📱✉️📍💰📆👨🏢👫✨💥💯⚡🔥💛]/g, "").trim();
    }
    return "";
  };

  // ── Name ──────────────────────────────────────────────────────────────────
  // Try labeled fields first, then the classic "Name Phone" single-line format
  let name = grab(
    /(?:^|\n)\s*Name\s*[:\-–*]+\s*([^\n,📱\d]{2,40})/im,
    /(?:^|\n)\s*\.Name\s+([^\n.]{2,35})/im,
    /(?:^|\n)\s*[-–]\s*([A-Z][a-z][^\n\d]{1,30})\s*\n/m,
  ).replace(/^\W+|\W+$/g, "").trim();

  // Fallback: first line looks like "Firstname Lastname 9XXXXXXXXX"
  if (!name) {
    const fl = clean.split("\n")[0].replace(/\*/g, "").trim();
    const nameOnlyMatch = fl.match(/^([A-Z][a-zA-Z][a-zA-Z\s]{1,28}?)\s+(?:[6-9]\d{9}|\+91)/);
    if (nameOnlyMatch) name = nameOnlyMatch[1].trim();
  }

  // ── Phone ──────────────────────────────────────────────────────────────────
  // First try labeled, then scan entire text for Indian mobile pattern
  const phoneLabelMatch = grab(
    /Phone\s*[:\-–*]+\s*([\d\s+\-()]{7,20})/i,
    /Ph\s*[:\-–]+\s*([\d\s+\-()]{7,20})/i,
  );
  const phoneRaw = phoneLabelMatch || clean;
  const phoneMatch = phoneRaw.match(/(?:\+?91[-\s]?)?([6-9]\d{9})/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "").replace(/^91/, "91") : "";

  // ── Email ──────────────────────────────────────────────────────────────────
  const emailMatch = clean.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] ?? "";

  // ── Location ──────────────────────────────────────────────────────────────
  // Strip map links; accept anything that isn't obviously a budget or date
  const location = grab(
    /Preferred Location[^:\n]*[:\-–]+\s*([^\n💰📆👨🏢]{3,80})/i,
    /Which location\s*[:\-–]+\s*([^\n]{3,60})/i,
    /Location\s*[:\-–]+\s*([^\n💰📆👨🏢]{3,60})/i,
    /Area\s*[:\-–]+\s*([^\n]{3,50})/i,
  ).replace(/\(Map link\)|https?:\/\/\S+/gi, "").replace(/[💰📆👨🏢👫✨]/g, "").trim();

  // ── Budget ────────────────────────────────────────────────────────────────
  const budget = grab(
    /(?:Actual budget|Budget Range|Budget|Budjet)\s*[:\-–(]+\s*([^\n)📆👨🏢]{2,35})/i,
  ).replace(/[₹()\[\]]/g, "").replace(/\s+/g, " ").trim();

  // ── Move-in date ──────────────────────────────────────────────────────────
  const moveIn = grab(
    /Move[- ]?in[- ]?Date\s*[:\-–😘*]+\s*([^\n👨🏢👫✨]{2,35})/i,
    /Moving Date\s*[:\-–]+\s*([^\n]{2,30})/i,
    /Move-?in\s*[:\-–]+\s*([^\n]{2,30})/i,
  ).trim();

  // ── Type (Student / Working) ──────────────────────────────────────────────
  const isWorking = /\bworking\b/i.test(clean);
  const isStudent = /\bstudent\b/i.test(clean);
  const isIntern  = /\bintern(?:ing)?\b/i.test(clean);
  const type = isWorking && isStudent ? "Student/Working"
             : isWorking ? "Working"
             : isStudent ? "Student"
             : isIntern  ? "Intern" : "";

  // ── Room type ─────────────────────────────────────────────────────────────
  const roomRaw = grab(/Room\s*[*:\-–(]+\s*([^\n👫✨📞]{2,25})/i).toLowerCase();
  const hasPrivate = /private/.test(roomRaw) || /private/i.test(clean);
  const hasShared  = /shared/.test(roomRaw)  || /shared/i.test(clean);
  const room = hasPrivate && hasShared ? "Both"
             : hasPrivate ? "Private"
             : hasShared  ? "Shared" : "";

  // ── Need (Boys / Girls / Coed) ────────────────────────────────────────────
  const needRaw = grab(
    /NEED\s*[*:\-–(]+\s*([^\n✨📞]{2,35})/i,
    /Need\s*[:\-–]+\s*([^\n]{2,35})/i,
  ).toLowerCase();
  const wantGirls = needRaw.includes("girl") || /\bgirls?\b/i.test(clean);
  const wantBoys  = needRaw.includes("boy")  || /\bboys?\b/i.test(clean);
  const wantCoed  = needRaw.includes("coed") || /\bcoed\b/i.test(clean);
  const need = [wantGirls?"Girls":"", wantBoys?"Boys":"", wantCoed?"Coed":""].filter(Boolean).join(" / ");

  // ── Special requests ──────────────────────────────────────────────────────
  const specialReqs = grab(
    /Special Requests?\s*[*:\-–(]+\s*([^\n*📞]{2,120})/i,
  ).replace(/NA|None|n\/a|If any/gi, "").trim();

  // ── BLR status — scan entire raw text ─────────────────────────────────────
  // We check the ORIGINAL raw text (before cleaning) since clues like
  // "Yes in blr" or "Not in blr" come from the spreadsheet metadata
  const inBLRTrue  = /\bin\s*blr\b|in bangalore|currently in bangalore|already here|yes.*blr/i.test(raw);
  const inBLRFalse = /not in blr|not in bangalore|outside bangalore|relocating|out.*blr/i.test(raw);
  const inBLR = inBLRTrue ? true : inBLRFalse ? false : null;

  // ── Zone — scan ENTIRE raw text ───────────────────────────────────────────
  // This is the key fix: we pass the full original text to detectZone, not
  // just the extracted location field. That way a message like
  // "8-12k 1 july working shared koramangala" still gets South zone even
  // if the parser couldn't find a labelled "Location:" field.
  const zoneObj = detectZone(raw);

  // A lead must have at least one of: phone, email, or recognisable name
  if (!phone && !email && !name) return null;

  return {
    name, phone, email, location, budget, moveIn,
    type, room, need, specialReqs,
    inBLR, zone: zoneObj?.zone ?? "",
    quality: "good",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BULK SPLITTER
//  Splits a raw paste into individual lead chunks. The core challenge is that
//  there are NO reliable blank-line separators — a Gharpayy form spans 10
//  lines, while the next entry might be a single "Name Phone Location" line.
//
//  Strategy: scan line by line. When we see a line that looks like the START
//  of a new lead (by matching any of the "lead opener" patterns), flush the
//  current bucket and start a new one.
// ═══════════════════════════════════════════════════════════════════════════════
function splitLeads(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const chunks = [];
  let cur = [];

  const isOpener = (line) => {
    const t = line.trim();
    if (t.length < 3) return false;
    return (
      /^📝/.test(t) ||                                          // Gharpayy emoji form
      /^GHARPAYY/i.test(t) ||                                   // Gharpayy brand header
      /^\*?GHARPAYY/i.test(t) ||
      /^(?:\*?\s*Name\s*[:\-–*])/i.test(t) ||                  // "Name:" label
      /^Name\s*[-–]/i.test(t) ||
      /^\.Name\s/i.test(t) ||                                   // .Name prefix
      /^\[[\d:]+\s*(AM|PM),\s*\d/.test(t) ||                   // WhatsApp timestamp
      /^[A-Z][a-zA-Z]{1,20}\s+[6-9]\d{9}/.test(t) ||          // "FirstName 9XXXXXXXXX"
      /^[A-Z][a-zA-Z\s]{2,30}\s+[6-9]\d{9}/.test(t) ||        // "Full Name 9XXXXXXXXX"
      /^(?:\+91[-\s]?)?[6-9]\d{9}\b/.test(t) ||                // bare phone number line
      /^[-–]\s*[A-Z][a-z]/.test(t) ||                          // "- Name"
      /^Name\s*:/i.test(t) ||
      /^\*Name:/i.test(t)
    );
  };

  // Lines that are standalone junk — skip them entirely
  const isJunk = (line) => {
    const t = line.trim();
    return !t ||
      /^(not filled|no|n\/a|xyz|3405|n\/a|na)$/i.test(t) ||
      /^[\-–=*_]{3,}$/.test(t);
  };

  for (const line of lines) {
    if (isJunk(line)) {
      if (cur.length) { chunks.push(cur.join("\n")); cur = []; }
      continue;
    }
    if (cur.length === 0) {
      cur.push(line);
    } else if (isOpener(line)) {
      chunks.push(cur.join("\n"));
      cur = [line];
    } else {
      cur.push(line);
    }
  }
  if (cur.length) chunks.push(cur.join("\n"));
  return chunks.filter(c => c.trim().length > 5);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FIELD DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
const FIELDS = [
  { key: "name",        label: "Name",            icon: "👤" },
  { key: "phone",       label: "Phone",           icon: "📱" },
  { key: "email",       label: "Email",           icon: "✉️" },
  { key: "location",    label: "Location",        icon: "📍" },
  { key: "budget",      label: "Budget",          icon: "💰" },
  { key: "moveIn",      label: "Move-in Date",    icon: "📅" },
  { key: "type",        label: "Type",            icon: "💼" },
  { key: "room",        label: "Room",            icon: "🏠" },
  { key: "need",        label: "Need",            icon: "👥" },
  { key: "specialReqs", label: "Special Requests",icon: "⭐" },
];

const QUALITY = {
  hot:  { label: "🔥 Hot",  color: "#ef4444", bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.45)",  stripe: "#ef4444" },
  good: { label: "✅ Good", color: "#22c55e", bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.45)",  stripe: "#22c55e" },
  bad:  { label: "❌ Bad",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.3)", stripe: "#374151" },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SMALL REUSABLE UI ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function Badge({ text }) {
  if (!text) return null;
  const map = {
    Working: "bg-emerald-900/40 text-emerald-300",
    Student: "bg-sky-900/40 text-sky-300",
    Intern:  "bg-cyan-900/40 text-cyan-300",
    "Student/Working": "bg-violet-900/40 text-violet-300",
    Private: "bg-amber-900/40 text-amber-300",
    Shared:  "bg-orange-900/40 text-orange-300",
    Both:    "bg-pink-900/40 text-pink-300",
    Girls:   "bg-rose-900/40 text-rose-300",
    Boys:    "bg-blue-900/40 text-blue-300",
    Coed:    "bg-teal-900/40 text-teal-300",
  };
  const key = Object.keys(map).find((k) => text.includes(k));
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border border-white/10 font-medium ${key ? map[key] : "bg-zinc-800 text-zinc-400"}`}>
      {text}
    </span>
  );
}

function ZonePill({ zoneName, size = "normal" }) {
  if (!zoneName) return null;
  const z = ZONES.find((z) => z.zone === zoneName);
  if (!z) return null;
  const fs = size === "small" ? 10 : 11;
  const px = size === "small" ? "6px" : "9px";
  return (
    <span style={{ background: z.bg, color: z.color, border: `1px solid ${z.border}`, borderRadius: 6, fontSize: fs, padding: `2px ${px}`, fontWeight: 700, letterSpacing: "0.02em" }}>
      {z.zone}
    </span>
  );
}

function BLRBadge({ value }) {
  if (value === true)  return <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 5, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", fontWeight: 600 }}>🏙 In BLR</span>;
  if (value === false) return <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 5, background: "rgba(245,158,11,0.13)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", fontWeight: 600 }}>✈️ Out BLR</span>;
  return null;
}

// 3-way BLR toggle used both in the form and inline on cards
function BLRToggle({ value, onChange }) {
  const opts = [
    { v: true,  label: "🏙 In",   ac: "#818cf8", ab: "rgba(99,102,241,0.2)",   abr: "rgba(99,102,241,0.4)"  },
    { v: false, label: "✈️ Out",  ac: "#fbbf24", ab: "rgba(245,158,11,0.15)", abr: "rgba(245,158,11,0.3)"  },
    { v: null,  label: "❓",       ac: "#9ca3af", ab: "rgba(107,114,128,0.1)", abr: "rgba(107,114,128,0.3)" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map(({ v, label, ac, ab, abr }) => (
        <button key={String(v)} onClick={(e) => { e.stopPropagation(); onChange(v); }}
          style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
            background: value === v ? ab : "transparent",
            color: value === v ? ac : "#52566e",
            border: `1px solid ${value === v ? abr : "#2a2d3e"}`, transition: "all 0.12s" }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function QualityRow({ quality, onChange }) {
  return (
    <div className="flex gap-1">
      {Object.entries(QUALITY).map(([k, q]) => (
        <button key={k} onClick={(e) => { e.stopPropagation(); onChange(k); }}
          style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, cursor: "pointer",
            fontWeight: quality === k ? 700 : 400,
            background: quality === k ? q.bg : "transparent",
            color: quality === k ? q.color : "#52566e",
            border: `1px solid ${quality === k ? q.border : "#2a2d3e"}`,
            transition: "all 0.12s" }}>
          {q.label}
        </button>
      ))}
    </div>
  );
}

// Month pipeline tiles — clickable to filter
function MonthBar({ leads, activeMonth, onSelect }) {
  const months = {};
  leads.forEach((l) => {
    const m = parseMonth(l.moveIn);
    const key = m ? m.label : "No Date";
    if (!months[key]) months[key] = { hot:0, good:0, bad:0, none:0, total:0, idx: m?.index ?? 99 };
    months[key].total++;
    if (l.quality === "hot") months[key].hot++;
    else if (l.quality === "good") months[key].good++;
    else if (l.quality === "bad") months[key].bad++;
    else months[key].none++;
  });
  const sorted = Object.entries(months).sort((a,b) => a[1].idx - b[1].idx);
  if (!sorted.length) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {sorted.map(([label, s]) => {
        const active = activeMonth === label;
        return (
          <div key={label} onClick={() => onSelect(active ? "all" : label)}
            style={{ background: active ? "#1e2235" : "#161926", border: `1px solid ${active ? "#4f52a0" : "#2a2d3e"}`, borderRadius: 10, padding: "9px 13px", minWidth: 100, cursor: "pointer", transition: "all 0.14s" }}>
            <div style={{ fontSize: 10.5, color: active ? "#818cf8" : "#52566e", fontWeight: 600, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e4f0", lineHeight: 1 }}>{s.total}
              <span style={{ fontSize: 10, color: "#52566e", fontWeight: 400, marginLeft: 3 }}>leads</span>
            </div>
            {/* Stacked bar */}
            <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "#0f1117", marginTop: 5, display: "flex" }}>
              {s.hot  > 0 && <div style={{ flex: s.hot,  background: "#ef4444" }} />}
              {s.good > 0 && <div style={{ flex: s.good, background: "#22c55e" }} />}
              {s.bad  > 0 && <div style={{ flex: s.bad,  background: "#4b5563" }} />}
              {s.none > 0 && <div style={{ flex: s.none, background: "#252840" }} />}
            </div>
            <div className="flex gap-1.5 mt-1">
              {s.hot  > 0 && <span style={{ fontSize: 9.5, color: "#ef4444" }}>🔥{s.hot}</span>}
              {s.good > 0 && <span style={{ fontSize: 9.5, color: "#22c55e" }}>✅{s.good}</span>}
              {s.bad  > 0 && <span style={{ fontSize: 9.5, color: "#6b7280" }}>❌{s.bad}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function LeadDashboard() {
  const [mode, setMode]             = useState("single");   // "single" | "bulk"
  const [rawText, setRawText]       = useState("");
  const [parsed, setParsed]         = useState(null);
  const [edited, setEdited]         = useState(null);
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState("");
  const [searchQ, setSearchQ]       = useState("");
  const [expandedId, setExpandedId] = useState(null);
  // Bulk state
  const [bulkText, setBulkText]     = useState("");
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkQuality, setBulkQuality] = useState("good");
  const [bulkBusy, setBulkBusy]     = useState(false);
  // Filter state
  const [fQuality, setFQuality]     = useState("all");
  const [fZone,    setFZone]        = useState("all");
  const [fBLR,     setFBLR]         = useState("all");
  const [fMonth,   setFMonth]       = useState("all");
  const [byMonth,  setByMonth]      = useState(true);

  const showToast = (msg, ms = 3000) => { setToast(msg); setTimeout(() => setToast(""), ms); };

  // ── Persistence ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("ghp-leads-v3");
        if (r?.value) setLeads(JSON.parse(r.value));
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const persist = useCallback(async (arr) => {
    try { await window.storage.set("ghp-leads-v3", JSON.stringify(arr)); }
    catch (e) { console.error("Storage error:", e); }
  }, []);

  // ── Single-lead flow ─────────────────────────────────────────────────────────
  const onTextChange = (v) => {
    setRawText(v);
    if (v.trim().length > 8) {
      const p = parseLead(v);
      setParsed(p);
      setEdited(p ? { ...p, quality: "good" } : null);
    } else { setParsed(null); setEdited(null); }
  };

  const saveSingle = async () => {
    if (!edited) return;
    // Re-run zone on the saved location text if user manually edited it,
    // but also fall back to the original raw text
    const zoneObj = detectZone(edited.location + " " + rawText);
    const lead = {
      id: Date.now(),
      addedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      ...edited,
      zone: zoneObj?.zone || edited.zone || "",
      rawText,
    };
    const next = [lead, ...leads];
    setLeads(next); await persist(next);
    setRawText(""); setParsed(null); setEdited(null);
    showToast("✓ Lead saved!");
  };

  // ── Bulk flow ────────────────────────────────────────────────────────────────
  const doBulkParse = () => {
    if (!bulkText.trim()) return;
    const chunks = splitLeads(bulkText);
    const all = chunks.map((c) => parseLead(c)).filter(Boolean);
    // Deduplicate: phone wins, then email, then skip
    const seenPhones = new Set();
    const seenEmails = new Set();
    const deduped = all.filter((l) => {
      if (l.phone && seenPhones.has(l.phone)) return false;
      if (l.email && seenEmails.has(l.email)) return false;
      if (l.phone) seenPhones.add(l.phone);
      if (l.email) seenEmails.add(l.email);
      return true;
    });
    // Zone breakdown for the preview
    const zones = {};
    deduped.forEach((l) => { zones[l.zone || "Unknown"] = (zones[l.zone || "Unknown"] || 0) + 1; });
    setBulkPreview({ total: chunks.length, valid: deduped.length, parsed: deduped, zones });
  };

  const doBulkImport = async () => {
    if (!bulkPreview) return;
    setBulkBusy(true);
    const existP = new Set(leads.map((l) => l.phone).filter(Boolean));
    const existE = new Set(leads.map((l) => l.email).filter(Boolean));
    const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const toAdd = []; let skip = 0;
    bulkPreview.parsed.forEach((p, i) => {
      if (p.phone && existP.has(p.phone)) { skip++; return; }
      if (p.email && existE.has(p.email)) { skip++; return; }
      const zoneObj = detectZone((p.location || "") + " " + (p.name || "") + " " + (p.budget || ""));
      toAdd.push({ id: Date.now() + i, addedAt: now, ...p, quality: bulkQuality, zone: zoneObj?.zone || p.zone || "" });
      if (p.phone) existP.add(p.phone);
      if (p.email) existE.add(p.email);
    });
    const next = [...toAdd, ...leads];
    setLeads(next); await persist(next);
    setBulkBusy(false); setBulkText(""); setBulkPreview(null);
    showToast(`📦 Imported ${toAdd.length} leads — ${skip} duplicates skipped`, 4500);
    setMode("single");
  };

  const updateLead = async (id, patch) => {
    const next = leads.map((l) => l.id === id ? { ...l, ...patch } : l);
    setLeads(next); await persist(next);
  };

  const deleteLead = async (id) => {
    const next = leads.filter((l) => l.id !== id);
    setLeads(next); await persist(next);
  };

  const clearAll = async () => {
    if (!window.confirm(`Delete all ${leads.length} leads? Cannot be undone.`)) return;
    setLeads([]); await persist([]);
    showToast("All leads cleared.");
  };

  // ── Filtering & grouping ─────────────────────────────────────────────────────
  const filtered = leads.filter((l) => {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!Object.values(l).some((v) => typeof v === "string" && v.toLowerCase().includes(q))) return false;
    }
    if (fQuality !== "all" && l.quality !== fQuality) return false;
    if (fZone    !== "all" && l.zone     !== fZone)    return false;
    if (fBLR === "in"  && l.inBLR !== true)  return false;
    if (fBLR === "out" && l.inBLR !== false) return false;
    if (fMonth !== "all") {
      const m = parseMonth(l.moveIn);
      if (!m || m.label !== fMonth) return false;
    }
    return true;
  });

  const grouped = (() => {
    if (!byMonth) return { "All Leads": filtered };
    const g = {};
    filtered.forEach((l) => {
      const m = parseMonth(l.moveIn);
      const k = m ? m.label : "📅 No Date";
      if (!g[k]) g[k] = [];
      g[k].push(l);
    });
    return Object.fromEntries(
      Object.entries(g).sort((a, b) => (parseMonth(a[1][0]?.moveIn)?.index ?? 99) - (parseMonth(b[1][0]?.moveIn)?.index ?? 99))
    );
  })();

  const monthOptions = [...new Set(leads.map((l) => parseMonth(l.moveIn)?.label).filter(Boolean))];

  // ── Inline zone selector used in both single and expanded card ───────────────
  const ZoneSelector = ({ value, onSelect }) => (
    <div className="flex gap-1.5 flex-wrap">
      {ZONES.map((z) => (
        <button key={z.zone} onClick={() => onSelect(value === z.zone ? "" : z.zone)}
          style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, cursor: "pointer",
            background: value === z.zone ? z.bg : "transparent",
            color: value === z.zone ? z.color : "#52566e",
            border: `1px solid ${value === z.zone ? z.border : "#2a2d3e"}` }}>
          {z.zone}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0b0d14", minHeight: "100vh", color: "#e2e4f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#13151f;}
        ::-webkit-scrollbar-thumb{background:#2e3145;border-radius:3px;}
        textarea,input,select{outline:none!important;font-family:inherit;}
        button{font-family:inherit;cursor:pointer;}
        .row:hover{background:#181b2a!important;}
        .fade{animation:fd .2s ease;}
        @keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .blink{animation:bl 1.4s ease infinite;}
        @keyframes bl{0%,100%{opacity:1}50%{opacity:.45}}
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{ background: "#13151f", borderBottom: "1px solid #1f2235", padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff" }}>G</div>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13.5, fontWeight: 500, color: "#e2e4f0" }}>Gharpayy</div>
            <div style={{ fontSize: 9.5, color: "#52566e" }}>Lead Intake Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {toast && <span style={{ fontSize: 12.5, color: "#34d399" }} className="fade">{toast}</span>}
          {[
            { label: `${leads.length} total`, border: "#2a2d3e", color: "#9ca3af" },
            { label: `🔥 ${leads.filter(l=>l.quality==="hot").length}`,  border: "rgba(239,68,68,0.4)",  color: "#ef4444" },
            { label: `✅ ${leads.filter(l=>l.quality==="good").length}`, border: "rgba(34,197,94,0.35)", color: "#22c55e" },
          ].map((b) => (
            <div key={b.label} style={{ background: "#1a1d2b", border: `1px solid ${b.border}`, borderRadius: 7, padding: "3px 10px", fontSize: 12, color: b.color }}>{b.label}</div>
          ))}
          {leads.length > 0 && (
            <button onClick={clearAll} style={{ fontSize: 11, color: "#52566e", background: "transparent", border: "none", padding: "3px 6px" }} className="hover:text-rose-400">🗑</button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1600, margin: "0 auto" }}>

        {/* ══════════════════════════════════════════════════════
            LEFT PANEL — paste / bulk import
        ══════════════════════════════════════════════════════ */}
        <div style={{ width: 420, minWidth: 390, borderRight: "1px solid #1f2235", minHeight: "calc(100vh - 52px)", overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Mode toggle */}
          <div style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 9, padding: 3, display: "flex", gap: 2 }}>
            {[["single","📋 Single Lead"],["bulk","📦 Bulk Import"]].map(([m, lbl]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12.5, fontWeight: mode===m ? 600 : 400,
                  background: mode===m ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                  color: mode===m ? "#fff" : "#52566e", border: "none" }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* ── SINGLE MODE ── */}
          {mode === "single" && <>
            <label style={{ fontSize: 10.5, color: "#52566e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Paste Form</label>
            <textarea value={rawText} onChange={(e) => onTextChange(e.target.value)}
              placeholder={"Paste any WhatsApp lead form here…\nSupports all formats automatically."}
              style={{ width: "100%", height: 150, background: "#13151f", border: "1px solid #1f2235", borderRadius: 9, padding: "10px 12px", fontFamily: "'DM Mono',monospace", fontSize: 11.5, color: "#b8bccc", resize: "vertical", lineHeight: 1.7 }} />
            {rawText && <button onClick={() => onTextChange("")} style={{ fontSize: 11, color: "#52566e", background: "transparent", border: "none", alignSelf: "flex-start" }}>✕ Clear</button>}

            {edited ? (
              <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10.5, color: "#52566e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Parsed Fields</span>
                  <span style={{ fontSize: 9.5, color: "#6366f1", background: "#1a1d2b", border: "1px solid #2d3055", borderRadius: 20, padding: "2px 8px" }}>edit before saving</span>
                </div>

                {/* Parsed fields — each shows a green dot if the parser found a value */}
                {FIELDS.map(({ key, label, icon }) => (
                  <div key={key} style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 7, padding: "7px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, width: 17, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: "#52566e", lineHeight: 1, marginBottom: 2 }}>{label}</div>
                      <input value={edited[key] || ""} onChange={(e) => setEdited({ ...edited, [key]: e.target.value })}
                        placeholder={`No ${label.toLowerCase()}`}
                        style={{ background: "transparent", border: "none", color: edited[key] ? "#dde0f0" : "#3a3f5a", fontSize: 12.5, width: "100%" }} />
                    </div>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: parsed?.[key] ? "#22c55e" : "#2a2d40" }} />
                  </div>
                ))}

                {/* BLR */}
                <div style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 7, padding: "9px 11px" }}>
                  <div style={{ fontSize: 10.5, color: "#52566e", marginBottom: 6 }}>
                    Currently in Bangalore?
                    {edited.inBLR === true  && <span style={{ marginLeft: 8, color: "#818cf8", fontSize: 10 }}>auto-detected ✓</span>}
                    {edited.inBLR === false && <span style={{ marginLeft: 8, color: "#fbbf24", fontSize: 10 }}>auto-detected ✓</span>}
                  </div>
                  <BLRToggle value={edited.inBLR} onChange={(v) => setEdited({ ...edited, inBLR: v })} />
                </div>

                {/* Zone — shows auto-detected value plus manual override */}
                <div style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 7, padding: "9px 11px" }}>
                  <div style={{ fontSize: 10.5, color: "#52566e", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    Zone
                    {edited.zone
                      ? <><ZonePill zoneName={edited.zone} size="small" /><span style={{ fontSize: 9, color: "#22c55e" }}>auto-detected ✓</span></>
                      : <span style={{ fontSize: 9, color: "#6b7280" }}>not detected — select manually</span>}
                  </div>
                  <ZoneSelector value={edited.zone} onSelect={(z) => setEdited({ ...edited, zone: z })} />
                </div>

                {/* Quality */}
                <div style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 7, padding: "9px 11px" }}>
                  <div style={{ fontSize: 10.5, color: "#52566e", marginBottom: 6 }}>Lead Quality</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.entries(QUALITY).map(([k, q]) => (
                      <button key={k} onClick={() => setEdited({ ...edited, quality: k })}
                        style={{ flex: 1, fontSize: 12, padding: "7px 0", borderRadius: 7, fontWeight: edited.quality===k ? 700 : 400,
                          background: edited.quality===k ? q.bg : "transparent",
                          color: edited.quality===k ? q.color : "#52566e",
                          border: `1px solid ${edited.quality===k ? q.border : "#1f2235"}` }}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={saveSingle}
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }}>
                  Save Lead →
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 40, gap: 8 }}>
                <div style={{ fontSize: 40 }}>📋</div>
                <p style={{ fontSize: 13, color: "#52566e", textAlign: "center" }}>Paste any lead form above.<br />Zone, BLR status, and all fields<br />are extracted automatically.</p>
              </div>
            )}
          </>}

          {/* ── BULK MODE ── */}
          {mode === "bulk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10.5, color: "#52566e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Paste Entire Sheet / Multiple Forms</div>
                <p style={{ fontSize: 11, color: "#3a3f5a", lineHeight: 1.5 }}>
                  Paste the full "Form full" column, a block of WhatsApp messages, or the complete spreadsheet export. The splitter handles all formats automatically.
                </p>
              </div>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Paste hundreds of leads here…\n\nAll of these work:\n• Gharpayy emoji forms\n• Plain name / phone / email\n• WhatsApp chat exports\n• Spreadsheet columns\n• Mixed / garbled messages"}
                style={{ width: "100%", height: 200, background: "#13151f", border: "1px solid #1f2235", borderRadius: 9, padding: "10px 12px", fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#b8bccc", resize: "vertical", lineHeight: 1.6 }} />

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={doBulkParse} disabled={!bulkText.trim()}
                  style={{ flex: 1, background: "#1a1d2b", border: "1px solid #2d3055", color: "#818cf8", borderRadius: 9, padding: "9px", fontSize: 12.5, fontWeight: 600 }}>
                  🔍 Parse Leads
                </button>
                {bulkText && <button onClick={() => { setBulkText(""); setBulkPreview(null); }} style={{ fontSize: 11, color: "#52566e", background: "transparent", border: "none", padding: "0 8px" }}>✕</button>}
              </div>

              {bulkPreview && (
                <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Summary stats */}
                  <div style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10.5, color: "#52566e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Parse Results</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        { n: bulkPreview.total, sub: "blocks found", c: "#6366f1" },
                        { n: bulkPreview.valid, sub: "valid leads",  c: "#22c55e" },
                        { n: bulkPreview.parsed.filter(l=>l.phone).length, sub: "with phone", c: "#f97316" },
                      ].map(({ n, sub, c }) => (
                        <div key={sub} style={{ background: "#0b0d14", borderRadius: 8, padding: "9px", textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{n}</div>
                          <div style={{ fontSize: 10, color: "#52566e" }}>{sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Zone breakdown */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: "#52566e", marginBottom: 5 }}>Zone breakdown</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {ZONES.map((z) => {
                          const c = bulkPreview.parsed.filter(l => l.zone === z.zone).length;
                          if (!c) return null;
                          return (
                            <span key={z.zone} style={{ background: z.bg, color: z.color, border: `1px solid ${z.border}`, borderRadius: 6, fontSize: 10.5, padding: "2px 9px", fontWeight: 700 }}>
                              {z.zone} {c}
                            </span>
                          );
                        })}
                        {(() => { const n = bulkPreview.parsed.filter(l=>!l.zone).length; return n > 0 ? <span style={{ background: "#1a1d2b", color: "#52566e", border: "1px solid #1f2235", borderRadius: 6, fontSize: 10.5, padding: "2px 9px" }}>Unknown {n}</span> : null; })()}
                      </div>
                    </div>
                  </div>

                  {/* First 5 preview */}
                  <div style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10.5, color: "#52566e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Preview (first 5)</div>
                    {bulkPreview.parsed.slice(0, 5).map((l, i) => (
                      <div key={i} style={{ padding: "6px 0", borderBottom: i < 4 ? "1px solid #1f2235" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: `hsl(${i*72},40%,18%)`, border: `1.5px solid hsl(${i*72},40%,30%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: `hsl(${i*72},55%,70%)`, flexShrink: 0 }}>
                            {(l.name || "?")[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#dde0f0" }}>{l.name || <span style={{ color: "#3a3f5a", fontStyle: "italic", fontWeight: 400 }}>No name</span>}</span>
                              {l.phone && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6366f1" }}>{l.phone}</span>}
                              {l.zone && <ZonePill zoneName={l.zone} size="small" />}
                            </div>
                            <div style={{ fontSize: 10.5, color: "#52566e", marginTop: 2 }}>
                              {[l.location?.substring(0,32), l.budget, l.moveIn?.substring(0,15)].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {bulkPreview.valid > 5 && <div style={{ fontSize: 11, color: "#52566e", textAlign: "center", marginTop: 6 }}>…and {bulkPreview.valid - 5} more</div>}
                  </div>

                  {/* Default quality */}
                  <div style={{ background: "#13151f", border: "1px solid #1f2235", borderRadius: 8, padding: "9px 11px" }}>
                    <div style={{ fontSize: 10.5, color: "#52566e", marginBottom: 6 }}>Import all as</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {Object.entries(QUALITY).map(([k, q]) => (
                        <button key={k} onClick={() => setBulkQuality(k)}
                          style={{ flex: 1, fontSize: 11.5, padding: "6px 0", borderRadius: 7, fontWeight: bulkQuality===k ? 700 : 400,
                            background: bulkQuality===k ? q.bg : "transparent",
                            color: bulkQuality===k ? q.color : "#52566e",
                            border: `1px solid ${bulkQuality===k ? q.border : "#1f2235"}` }}>
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={doBulkImport} disabled={bulkBusy}
                    style={{ background: bulkBusy ? "#1f2235" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600 }}>
                    {bulkBusy ? <span className="blink">Importing…</span> : `📦 Import ${bulkPreview.valid} Leads →`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT PANEL — pipeline
        ══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Month bar */}
          {leads.length > 0 && (
            <div style={{ borderBottom: "1px solid #1f2235", padding: "10px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, color: "#52566e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Move-in Pipeline — click to filter</span>
                {fMonth !== "all" && <button onClick={() => setFMonth("all")} style={{ fontSize: 11, color: "#52566e", background: "transparent", border: "none" }}>✕ clear</button>}
              </div>
              <MonthBar leads={leads} activeMonth={fMonth} onSelect={setFMonth} />
            </div>
          )}

          {/* Filter bar */}
          <div style={{ borderBottom: "1px solid #1f2235", background: "#13151f", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ background: "#0b0d14", border: "1px solid #1f2235", borderRadius: 7, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6, flex: "1 1 150px" }}>
              <span style={{ fontSize: 13, color: "#3a3f5a" }}>🔍</span>
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search name, phone, location…"
                style={{ background: "transparent", border: "none", color: "#b8bccc", fontSize: 12.5, flex: 1 }} />
              {searchQ && <button onClick={() => setSearchQ("")} style={{ fontSize: 11, color: "#52566e", background: "transparent", border: "none" }}>✕</button>}
            </div>

            {/* Quality filter */}
            {["all","hot","good","bad"].map((q) => {
              const active = fQuality === q;
              const col = q==="hot" ? "#ef4444" : q==="good" ? "#22c55e" : q==="bad" ? "#9ca3af" : "#818cf8";
              return (
                <button key={q} onClick={() => setFQuality(q)}
                  style={{ fontSize: 11, padding: "5px 10px", borderRadius: 7,
                    background: active ? (q==="all" ? "#1a1d2b" : QUALITY[q]?.bg) : "transparent",
                    color: active ? col : "#52566e",
                    border: `1px solid ${active ? "#2d3055" : "#1f2235"}` }}>
                  {q === "all" ? "All" : QUALITY[q].label}
                </button>
              );
            })}

            {/* BLR filter */}
            {[["all","All"],["in","🏙 In BLR"],["out","✈️ Out BLR"]].map(([v, lbl]) => (
              <button key={v} onClick={() => setFBLR(v)}
                style={{ fontSize: 11, padding: "5px 10px", borderRadius: 7,
                  background: fBLR===v ? "#1a1d2b" : "transparent",
                  color: fBLR===v ? "#818cf8" : "#52566e",
                  border: `1px solid ${fBLR===v ? "#2d3055" : "#1f2235"}` }}>
                {lbl}
              </button>
            ))}

            {/* Zone filter */}
            <select value={fZone} onChange={(e) => setFZone(e.target.value)}
              style={{ background: "#13151f", color: fZone!=="all" ? "#818cf8" : "#52566e", border: "1px solid #1f2235", borderRadius: 7, padding: "5px 10px", fontSize: 11 }}>
              <option value="all">All Zones</option>
              {ZONES.map((z) => <option key={z.zone} value={z.zone}>{z.zone}</option>)}
            </select>

            {/* Month filter */}
            {monthOptions.length > 0 && (
              <select value={fMonth} onChange={(e) => setFMonth(e.target.value)}
                style={{ background: "#13151f", color: fMonth!=="all" ? "#818cf8" : "#52566e", border: "1px solid #1f2235", borderRadius: 7, padding: "5px 10px", fontSize: 11 }}>
                <option value="all">All Months</option>
                {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}

            <button onClick={() => setByMonth(!byMonth)}
              style={{ fontSize: 11, padding: "5px 10px", borderRadius: 7,
                background: byMonth ? "#1a1d2b" : "transparent",
                color: byMonth ? "#818cf8" : "#52566e",
                border: `1px solid ${byMonth ? "#2d3055" : "#1f2235"}` }}>
              📅 By Month
            </button>

            <span style={{ fontSize: 11, color: "#3a3f5a", marginLeft: "auto" }}>{filtered.length} shown</span>
          </div>

          {/* Lead cards */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", maxHeight: "calc(100vh - 230px)" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
                <span style={{ fontSize: 13, color: "#52566e" }} className="blink">Loading…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 }}>
                <div style={{ fontSize: 48 }}>{leads.length === 0 ? "🏠" : "🔍"}</div>
                <p style={{ fontSize: 13, color: "#52566e", textAlign: "center" }}>
                  {leads.length === 0
                    ? "No leads yet.\nUse Bulk Import to load your full sheet at once."
                    : "No leads match the current filters."}
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([month, mLeads]) => (
                <div key={month} style={{ marginBottom: 6 }}>
                  {byMonth && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, marginBottom: 8 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6366f1", fontFamily: "'DM Mono',monospace", letterSpacing: "0.05em" }}>{month}</span>
                      <div style={{ flex: 1, height: 1, background: "#1f2235" }} />
                      <span style={{ fontSize: 10.5, color: "#52566e" }}>
                        {mLeads.length} lead{mLeads.length!==1?"s":""} · 🔥{mLeads.filter(l=>l.quality==="hot").length} ✅{mLeads.filter(l=>l.quality==="good").length} ❌{mLeads.filter(l=>l.quality==="bad").length}
                      </span>
                    </div>
                  )}

                  {mLeads.map((lead) => {
                    const q = QUALITY[lead.quality];
                    const exp = expandedId === lead.id;
                    return (
                      <div key={lead.id} className="row fade"
                        style={{ background: "#13151f", border: `1px solid ${q?.rowBorder ?? "#1f2235"}`, borderRadius: 10, padding: "11px 13px", marginBottom: 5, cursor: "pointer", transition: "background 0.13s" }}
                        onClick={() => setExpandedId(exp ? null : lead.id)}>

                        {/* ── Summary row ── */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          {/* Left quality stripe */}
                          <div style={{ width: 3, borderRadius: 3, alignSelf: "stretch", background: q?.stripe ?? "#1f2235", flexShrink: 0 }} />

                          {/* Avatar */}
                          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `hsl(${(lead.id%360)},40%,18%)`, border: `2px solid hsl(${(lead.id%360)},40%,30%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, color: `hsl(${(lead.id%360)},55%,70%)` }}>
                            {(lead.name || "?")[0]?.toUpperCase()}
                          </div>

                          {/* Main info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#dde0f0" }}>
                                {lead.name || <span style={{ color: "#3a3f5a", fontStyle: "italic", fontWeight: 400, fontSize: 12 }}>No name</span>}
                              </span>
                              {lead.phone && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11.5, color: "#6366f1" }}>{lead.phone}</span>}
                              <BLRBadge value={lead.inBLR} />
                              <ZonePill zoneName={lead.zone} />
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 3 }}>
                              {lead.location && <span style={{ fontSize: 11, color: "#52566e" }}>📍 {lead.location.substring(0,38)}{lead.location.length>38?"…":""}</span>}
                              {lead.budget   && <span style={{ fontSize: 11, color: "#52566e" }}>💰 {lead.budget.substring(0,22)}</span>}
                              {lead.moveIn   && <span style={{ fontSize: 11, color: "#52566e" }}>📅 {lead.moveIn.substring(0,20)}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                              {lead.type && <Badge text={lead.type} />}
                              {lead.room && <Badge text={lead.room} />}
                              {lead.need && lead.need.split(/\s*\/\s*/).map((n) => <Badge key={n} text={n.trim()} />)}
                            </div>
                          </div>

                          {/* Right controls — quality + BLR toggles, inline */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 9.5, color: "#3a3f5a" }}>{lead.addedAt}</span>
                              <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} style={{ fontSize: 12, color: "#3a3f5a", background: "transparent", border: "none", lineHeight: 1 }}>✕</button>
                            </div>
                            <QualityRow quality={lead.quality} onChange={(q) => updateLead(lead.id, { quality: q })} />
                            <BLRToggle value={lead.inBLR} onChange={(v) => updateLead(lead.id, { inBLR: v })} />
                          </div>
                        </div>

                        {/* ── Expanded detail ── */}
                        {exp && (
                          <div className="fade" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1f2235" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                              {FIELDS.map(({ key, label, icon }) =>
                                lead[key] ? (
                                  <div key={key} style={{ background: "#0b0d14", borderRadius: 7, padding: "7px 9px" }}>
                                    <div style={{ fontSize: 9, color: "#52566e", marginBottom: 2 }}>{icon} {label}</div>
                                    <div style={{ fontSize: 12.5, color: "#b8bccc" }}>{lead[key]}</div>
                                  </div>
                                ) : null
                              )}
                            </div>
                            {/* Zone override in expanded view */}
                            <div style={{ marginTop: 10 }}>
                              <div style={{ fontSize: 10, color: "#52566e", marginBottom: 5 }}>Override zone</div>
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                                {ZONES.map((z) => (
                                  <button key={z.zone} onClick={() => updateLead(lead.id, { zone: lead.zone === z.zone ? "" : z.zone })}
                                    style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6,
                                      background: lead.zone === z.zone ? z.bg : "transparent",
                                      color: lead.zone === z.zone ? z.color : "#52566e",
                                      border: `1px solid ${lead.zone === z.zone ? z.border : "#1f2235"}` }}>
                                    {z.zone}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}
                                  style={{ fontSize: 11.5, color: "#6366f1", textDecoration: "none" }}>✉️ {lead.email}</a>
                              )}
                              {lead.specialReqs && <div style={{ fontSize: 11.5, color: "#a78bfa" }}>⭐ {lead.specialReqs}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
