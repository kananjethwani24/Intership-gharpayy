import { useState, useEffect, useCallback } from "react";

// =================================================================================
//  ZONE ENGINE
// =================================================================================
const ZONES = [
  {
    zone: "South", priority: 1,
    color: "#f97316", bg: "rgba(249,115,22,0.13)", border: "rgba(249,115,22,0.4)",
    keywords: [
      "koramangala","kormangala","korma","btm layout","btm","jayanagar","jp nagar","jpnagar",
      "hsr layout","hsr","banashankari","basavanagudi","lalbagh","south end","southend",
      "electronic city","electronic cit","neeladri","begur","bommanahalli","hulimavu",
      "sg palya","sgpalya","silk board","silkboard","agara","madiwala","tavarekere",
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
      "whitefield","white field","hopefarm","itpl","kundanahalli","kundalahalli","kadugodi",
      "pattandur","pat tundur","brookfield","aces layout","hoodi","hoodi circle",
      "garudacharpalya","varthur","nallurhalli","kr puram","kr  puram","seetharampalya",
      "bellandur","bellandur nexus","sarjapur","ecospace","rmz ecoworld","rmz eco",
      "embassy tech village","prestige tech park","global technology park","yemalur",
      "indiranagar","indranagar","indira nagar","domlur","ejipura","murgeshpalya",
      "cv raman nagar","new thippasandra","old airport road","airport road","hal",
      "marathahalli","marathalli","mahadevapura","mahadevpura","bagmane","bagmane tech",
      "kadubeesanahalli","kadubeesana","kadubisanahalli","nallurhalli","divyasree",
      "spice garden","kundanhalli","kaverappa layout","deloitte bellandur",
      "embassy golf links","phoenix market city","brigade metropolis",
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

function detectZone(rawText: string | null) {
  if (!rawText) return null;
  const t = rawText.toLowerCase();
  for (const z of [...ZONES].sort((a, b) => a.priority - b.priority)) {
    if (z.keywords.some((kw) => t.includes(kw))) return z;
  }
  return null;
}

// =================================================================================
//  PARSERS
// =================================================================================
function parseLead(raw: string) {
  if (!raw || raw.trim().length < 4) return null;
  const clean = raw.replace(/\*{1,2}([^*\n]+)\*{1,2}/g, "$1").replace(/_{1,3}([^_\n]+)_{1,3}/g, "$1");
  const grab = (...patterns: RegExp[]) => {
    for (const re of patterns) {
      const m = clean.match(re);
      if (m?.[1]) return m[1].replace(/[📝📱✉️📍💰📆👨🏢👫✨💥💯⚡🔥💛]/g, "").trim();
    }
    return "";
  };

  let name = grab(
    /(?:^|\n)\s*Name\s*[:\-–*]+\s*([^\n,📱\d]{2,40})/im,
    /(?:^|\n)\s*\.Name\s+([^\n.]{2,35})/im,
  ).replace(/^\W+|\W+$/g, "").trim();

  const phoneMatch = clean.match(/(?:\+?91[-\s]?)?([6-9]\d{9})/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "").replace(/^91/, "91") : "";
  const emailMatch = clean.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] ?? "";
  const location = grab(/Preferred Location[^:\n]*[:\-–]+\s*([^\n💰📆👨🏢]{3,80})/i, /Location\s*[:\-–]+\s*([^\n💰📆👨🏢]{3,60})/i).trim();
  const budget = grab(/(?:Actual budget|Budget Range|Budget)\s*[:\-–(]+\s*([^\n)📆👨🏢]{2,35})/i).trim();
  const moveIn = grab(/Move[- ]?in[- ]?Date\s*[:\-–*]+\s*([^\n👨🏢]{2,35})/i).trim();
  const zoneObj = detectZone(raw);

  if (!phone && !email && !name) return null;

  return {
    name, phone, email, location, budget, moveIn,
    zone: zoneObj?.zone ?? "",
    quality: "good",
    inBLR: /\bin\s*blr\b/i.test(raw)
  };
}

// =================================================================================
//  MAIN DASHBOARD
// =================================================================================
export default function LeadDashboard() {
  const [mode, setMode] = useState("single");
  const [rawText, setRawText] = useState("");
  const [edited, setEdited] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingLeadId, setMatchingLeadId] = useState<string | null>(null);
  const [matchedProperties, setMatchedProperties] = useState<any[]>([]);

  // ── Persistence: MongoDB ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        setLeads(data);
      } catch (err) {
        console.error("Failed to fetch leads", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onTextChange = (v: string) => {
    setRawText(v);
    if (v.trim().length > 8) {
      const p = parseLead(v);
      setEdited(p);
    } else { setEdited(null); }
  };

  const saveSingle = async () => {
    if (!edited) return;
    setLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: edited.name,
          phone: edited.phone,
          email: edited.email,
          preferredLocation: edited.location,
          budget: edited.budget,
          movingDate: edited.moveIn,
          occupation: edited.type,
          gender: edited.need,
          notes: edited.rawText || rawText || `Zonename: ${edited.zone}`,
          source: 'WhatsApp',
          status: 'new'
        })
      });

      if (!response.ok) throw new Error('Failed to save lead');
      
      const newLead = await response.json();
      setLeads([newLead, ...leads]);
      setRawText("");
      setEdited(null);
      alert("✅ Lead saved to database!");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving lead");
    } finally {
      setLoading(false);
    }
  };

  // ── AI Matching ────────────────────────────────────────────────────────────
  const handleAiMatch = async (lead: any) => {
    setMatchingLeadId(lead._id || lead.id);
    setMatchedProperties([]);
    try {
      const res = await fetch('/api/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadText: lead.notes || lead.preferredLocation || lead.name })
      });
      const data = await res.json();
      if (data.error) {
        console.warn("AI Match warning:", data.error);
        alert(`Matching note: ${data.error}`);
        return;
      }
      setMatchedProperties(data.matches || []);
      if (data.reasoning) console.log("AI Reasoning:", data.reasoning);
    } catch (err) {
      console.error(err);
      alert("Network error during matching. Check your connection.");
    } finally {
      setMatchingLeadId(null);
    }
  };

  return (
    <div style={{ padding: "20px", background: "#0b0d14", minHeight: "100vh", color: "#e2e4f0" }}>
      <header style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
         <button onClick={() => setMode("single")} style={{ background: mode === "single" ? "#6366f1" : "transparent" }}>Single Lead</button>
         <button onClick={() => setMode("bulk")} style={{ background: mode === "bulk" ? "#6366f1" : "transparent" }}>Bulk Import</button>
      </header>

      {mode === "single" && (
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <h3>Paste Lead Form</h3>
            <textarea value={rawText} onChange={e=>onTextChange(e.target.value)} rows={10} style={{ width: "100%", background: "#13151f", color: "#fff" }} />
          </div>
          {edited && (
            <div>
              <h3>Parsed Data</h3>
              {Object.keys(edited).map(k => (
                <div key={k} style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "10px", color: "#666" }}>{k.toUpperCase()}</label>
                  <input value={edited[k] || ""} onChange={e => setEdited({ ...edited, [k]: e.target.value })} style={{ display: "block", width: "100%", background: "#13151f", color: "#fff" }} />
                </div>
              ))}
              <button onClick={saveSingle} style={{ padding: "10px 20px", background: "#6366f1" }}>Save Lead</button>
            </div>
          )}
        </section>
      )}

      <hr style={{ margin: "40px 0", borderColor: "#1f2235" }} />

      <div style={{ display: "grid", gridTemplateColumns: matchedProperties.length > 0 ? "1fr 400px" : "1fr", gap: "20px" }}>
        <section>
          <h3>Leads ({leads.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {leads.map(l => (
              <div key={l._id || l.id} style={{ 
                background: "#13151f", 
                padding: "15px", 
                borderRadius: "8px",
                border: matchingLeadId === (l._id || l.id) ? "1px solid #6366f1" : "1px solid transparent"
              }}>
                <h4 style={{ margin: 0 }}>{l.name || "Anonymous"}</h4>
                <p style={{ fontSize: "12px", color: "#6366f1" }}>{l.phone}</p>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "5px" }}>
                  <p style={{ margin: "2px 0" }}>📍 {l.preferredLocation || l.location}</p>
                  <p style={{ margin: "2px 0" }}>💰 {l.budget}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "10px", padding: "2px 6px", background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e44", borderRadius: "4px" }}>
                    {l.zone || (l.notes?.includes('Zonename:') ? l.notes.split('Zonename: ')[1] : 'Unknown')}
                  </span>
                  <button 
                    onClick={() => handleAiMatch(l)} 
                    disabled={!!matchingLeadId}
                    style={{ 
                      fontSize: "10px", 
                      padding: "4px 8px", 
                      background: "#6366f1", 
                      border: "none", 
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {matchingLeadId === (l._id || l.id) ? "Matching..." : "AI Match"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {matchedProperties.length > 0 && (
          <aside style={{ background: "#13151f", padding: "20px", borderRadius: "10px", border: "1px solid #1f2235", position: "sticky", top: "20px", height: "calc(100vh - 40px)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>AI Matches</h3>
              <button onClick={() => setMatchedProperties([])} style={{ background: "transparent", border: "none", color: "#52566e", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {matchedProperties.map((p, idx) => (
                <div key={idx} style={{ background: "#0b0d14", padding: "12px", borderRadius: "8px", border: "1px solid #1f2235" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#6366f1", marginBottom: "4px" }}>
                    <span>{p.source.toUpperCase()}</span>
                    <span>{p.gender}</span>
                  </div>
                  <h5 style={{ margin: "0 0 4px 0" }}>{p.name}</h5>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 8px 0" }}>{p.area}</p>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#22c55e" }}>
                    {p.price || p.priceRange || "Contact for price"}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
