'use client';
import { useState, useEffect } from "react";

// ─── FONT INJECTION ─────────────────────────────────────────────────────────
function FontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #07070A !important; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: #0E0E12; }
      ::-webkit-scrollbar-thumb { background: #2A2A35; border-radius: 2px; }
      @keyframes gp-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes gp-pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
      @keyframes gp-spin { to { transform: rotate(360deg); } }
      .gp-in { animation: gp-in 0.18s ease; }
      .gp-pulse { animation: gp-pulse 2s infinite; }
      .gp-spin { animation: gp-spin 0.7s linear infinite; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#07070A",
  surface:   "#0E0E12",
  card:      "#141418",
  border:    "rgba(255,255,255,0.065)",
  borderHov: "rgba(255,255,255,0.13)",
  amber:     "#F59E0B",
  amberDim:  "rgba(245,158,11,0.12)",
  amberBrd:  "rgba(245,158,11,0.3)",
  green:     "#10B981",
  greenDim:  "rgba(16,185,129,0.1)",
  greenBrd:  "rgba(16,185,129,0.28)",
  red:       "#EF4444",
  redDim:    "rgba(239,68,68,0.1)",
  redBrd:    "rgba(239,68,68,0.28)",
  blue:      "#60A5FA",
  blueDim:   "rgba(96,165,250,0.1)",
  blueBrd:   "rgba(96,165,250,0.28)",
  purple:    "#A78BFA",
  purpleDim: "rgba(167,139,250,0.1)",
  txt:       "#EEEEF2",
  txt2:      "#7A7A85",
  txt3:      "#3A3A45",
  mono:      "'IBM Plex Mono', monospace",
  sans:      "'Syne', system-ui, sans-serif",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const OWNERS = [
  { id:"o1", name:"Ramesh Nair",    initials:"RN", phone:"9876543210", area:"Koramangala",  props:["p1"] },
  { id:"o2", name:"Priya Sharma",   initials:"PS", phone:"8765432109", area:"HSR Layout",   props:["p2"] },
  { id:"o3", name:"Suresh Mehta",   initials:"SM", phone:"7654321098", area:"Indiranagar",  props:["p3"] },
];

const PROPERTIES = [
  { id:"p1", name:"142 Gharpayy",       area:"Koramangala", owner_id:"o1", gender:"boys",  floors:3 },
  { id:"p2", name:"78 Gharpayy Suites", area:"HSR Layout",  owner_id:"o2", gender:"girls", floors:4 },
  { id:"p3", name:"203 Gharpayy Hub",   area:"Indiranagar", owner_id:"o3", gender:"coed",  floors:2 },
];

const ROOMS_BASE = [
  { id:"r1",  pid:"p1", num:"101", type:"Double", base:8000,  ws:{ status:"vacant",   from:null,         price:8500,  confirmed:"Mar 24", remarks:"Recently repainted, AC working" }, rt:{ status:"approved", price:9500,  tier:"Mid",     by:"Karan S" }, m:{ pitches:7,  vs:3, vd:2 } },
  { id:"r2",  pid:"p1", num:"102", type:"Single", base:6500,  ws:{ status:"vacant",   from:null,         price:7000,  confirmed:"Mar 24", remarks:"" },                               rt:{ status:"approved", price:7800,  tier:"Budget",  by:"Karan S" }, m:{ pitches:4,  vs:1, vd:1 } },
  { id:"r3",  pid:"p1", num:"201", type:"Double", base:8000,  ws:{ status:"vacating", from:"Apr 1",      price:8800,  confirmed:"Mar 22", remarks:"Tenant leaving April 1st" },       rt:{ status:"draft",    price:null,  tier:null,      by:null      }, m:{ pitches:2,  vs:0, vd:0 } },
  { id:"r4",  pid:"p1", num:"202", type:"Quad",   base:5500,  ws:{ status:"occupied", from:null,         price:6000,  confirmed:"Mar 20", remarks:"" },                               rt:{ status:"locked",   price:6500,  tier:"Budget",  by:"Priya R" }, m:{ pitches:0,  vs:0, vd:0 } },
  { id:"r5",  pid:"p1", num:"301", type:"Double", base:9000,  ws:{ status:"vacant",   from:null,         price:9500,  confirmed:"Mar 23", remarks:"Top floor, city view" },           rt:{ status:"approved", price:11000, tier:"Premium", by:"Karan S" }, m:{ pitches:12, vs:4, vd:3 } },
  { id:"r6",  pid:"p2", num:"101", type:"Single", base:9000,  ws:{ status:"vacant",   from:null,         price:9500,  confirmed:"Mar 25", remarks:"" },                               rt:{ status:"approved", price:10500, tier:"Mid",     by:"Neha R"  }, m:{ pitches:5,  vs:2, vd:1 } },
  { id:"r7",  pid:"p2", num:"201", type:"Double", base:7500,  ws:{ status:"vacating", from:"Apr 15",     price:8000,  confirmed:"Mar 22", remarks:"" },                               rt:{ status:"draft",    price:null,  tier:null,      by:null      }, m:{ pitches:0,  vs:0, vd:0 } },
  { id:"r8",  pid:"p2", num:"301", type:"Double", base:10000, ws:{ status:"occupied", from:null,         price:10500, confirmed:"Mar 18", remarks:"" },                               rt:{ status:"locked",   price:11500, tier:"Premium", by:"Neha R"  }, m:{ pitches:0,  vs:0, vd:0 } },
  { id:"r9",  pid:"p3", num:"101", type:"Quad",   base:4500,  ws:{ status:"vacant",   from:null,         price:5000,  confirmed:"Mar 25", remarks:"Ground floor, easy access" },     rt:{ status:"approved", price:5800,  tier:"Budget",  by:"Raj K"   }, m:{ pitches:3,  vs:1, vd:0 } },
  { id:"r10", pid:"p3", num:"201", type:"Single", base:7000,  ws:{ status:"vacating", from:"Mar 31",     price:7500,  confirmed:"Mar 23", remarks:"" },                               rt:{ status:"draft",    price:null,  tier:null,      by:null      }, m:{ pitches:1,  vs:0, vd:0 } },
  { id:"r11", pid:"p3", num:"202", type:"Double", base:8500,  ws:{ status:"occupied", from:null,         price:9000,  confirmed:"Mar 21", remarks:"" },                               rt:{ status:"locked",   price:9800,  tier:"Mid",     by:"Raj K"   }, m:{ pitches:0,  vs:0, vd:0 } },
];

const VISITS_BASE = [
  { id:"v1", rid:"r1",  customer:"Amit Patel",   type:"Physical", time:"Today 11:00 AM", status:"confirmed", rep:"Karan S" },
  { id:"v2", rid:"r5",  customer:"Rohan Gupta",  type:"Virtual",  time:"Today 2:00 PM",  status:"pending",   rep:"Karan S" },
  { id:"v3", rid:"r6",  customer:"Meera Joshi",  type:"Physical", time:"Tomorrow 10:00", status:"confirmed", rep:"Neha R"  },
  { id:"v4", rid:"r9",  customer:"Dev Kumar",    type:"Virtual",  time:"Tomorrow 3:00",  status:"pending",   rep:"Raj K"   },
];

const ACTIONS_BASE = [
  { id:"a1", rid:"r1",  type:"pitch",        note:"Pitched to Wipro engineer, 2BHK requirement",  ts:"Today 9:30 AM",  by:"Karan S" },
  { id:"a2", rid:"r5",  type:"virtual_tour", note:"Sent video tour link via WhatsApp",             ts:"Today 11:00 AM", by:"Karan S" },
  { id:"a3", rid:"r1",  type:"visit_done",   note:"Visit done. Customer very interested.",         ts:"Yesterday 4 PM", by:"Karan S" },
  { id:"a4", rid:"r6",  type:"pitch",        note:"Pitched to IIM student, single room needed",   ts:"Yesterday 1 PM", by:"Neha R"  },
  { id:"a5", rid:"r9",  type:"visit_done",   note:"Site visit completed. Liked the property.",    ts:"Mar 23 2:00 PM", by:"Raj K"   },
  { id:"a6", rid:"r5",  type:"pitch",        note:"Pitched to Infosys engineer, premium interest",ts:"Mar 23 10:00",   by:"Karan S" },
];

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const S = {
  card: { background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px" },
  btn: (bg,col,brd) => ({ background:bg||"transparent", color:col||C.txt, border:`1px solid ${brd||C.border}`, borderRadius:7, padding:"8px 14px", cursor:"pointer", fontFamily:C.sans, fontSize:13, fontWeight:500, transition:"all 0.15s" }),
  input: { background:C.surface, border:`1px solid ${C.border}`, borderRadius:7, padding:"9px 12px", color:C.txt, fontFamily:C.sans, fontSize:13, width:"100%", outline:"none" },
  label: { fontSize:11, fontWeight:700, color:C.txt2, letterSpacing:"0.08em", textTransform:"uppercase" },
};

function Badge({ status }) {
  const map = {
    vacant:   [C.green,  C.greenDim,  C.greenBrd,  "VACANT"],
    vacating: [C.amber,  C.amberDim,  C.amberBrd,  "VACATING"],
    occupied: [C.red,    C.redDim,    C.redBrd,    "OCCUPIED"],
    approved: [C.green,  C.greenDim,  C.greenBrd,  "APPROVED"],
    draft:    [C.amber,  C.amberDim,  C.amberBrd,  "NEEDS REVIEW"],
    locked:   [C.red,    C.redDim,    C.redBrd,    "LOCKED"],
    confirmed:[C.green,  C.greenDim,  C.greenBrd,  "CONFIRMED"],
    pending:  [C.amber,  C.amberDim,  C.amberBrd,  "PENDING"],
    budget:   [C.blue,   C.blueDim,   C.blueBrd,   "BUDGET"],
    mid:      [C.purple, C.purpleDim, C.purpleDim, "MID"],
    premium:  [C.amber,  C.amberDim,  C.amberBrd,  "PREMIUM"],
  };
  const [col, bg, brd, label] = map[status?.toLowerCase()] || [C.txt2, "transparent", C.border, status?.toUpperCase()];
  return (
    <span style={{ background:bg, border:`1px solid ${brd}`, color:col, fontFamily:C.mono, fontSize:10, fontWeight:500, padding:"3px 7px", borderRadius:4, letterSpacing:"0.05em", whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function Dot({ color }) {
  return <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:color, marginRight:5, flexShrink:0 }} />;
}

function MetricCard({ label, value, color, sub }) {
  return (
    <div style={{ ...S.card, flex:1, minWidth:100 }}>
      <div style={{ fontSize:11, color:C.txt2, fontWeight:500, marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, color:color||C.txt, lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.txt2 }}>{sub}</div>}
    </div>
  );
}

function Avatar({ name, initials, size=32 }) {
  const colors = ["#F59E0B","#10B981","#60A5FA","#A78BFA","#F87171"];
  const i = name.charCodeAt(0) % colors.length;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:colors[i]+"22", border:`1.5px solid ${colors[i]}55`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:C.mono, fontSize:size*0.35, fontWeight:500, color:colors[i], flexShrink:0 }}>
      {initials}
    </div>
  );
}

function TopBar({ role, onSwitch }) {
  const roleColors = { owner:C.amber, sales:C.green, admin:C.blue };
  return (
    <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 24px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:24, height:24, background:C.amber, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:8, height:8, background:C.bg, borderRadius:1, transform:"rotate(45deg)" }} />
        </div>
        <span style={{ fontFamily:C.sans, fontWeight:800, fontSize:15, color:C.txt, letterSpacing:"-0.02em" }}>GHARPAYY<span style={{ color:C.amber }}>OS</span></span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ background:roleColors[role]+"18", border:`1px solid ${roleColors[role]}40`, borderRadius:5, padding:"4px 10px", fontFamily:C.mono, fontSize:11, color:roleColors[role], fontWeight:500 }}>
          {role.toUpperCase()}
        </div>
        <button onClick={onSwitch} style={{ ...S.btn(), fontSize:12, padding:"5px 12px" }}>Switch Role</button>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  return (
    <div className="gp-in" style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ width:48, height:48, background:C.amber, borderRadius:12, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:16, height:16, background:C.bg, borderRadius:2, transform:"rotate(45deg)" }} />
          </div>
          <div style={{ fontFamily:C.sans, fontWeight:800, fontSize:26, color:C.txt, letterSpacing:"-0.03em" }}>GHARPAYY<span style={{ color:C.amber }}>OS</span></div>
          <div style={{ fontFamily:C.mono, fontSize:12, color:C.txt2, marginTop:8 }}>Inventory Operating System · v1.0</div>
        </div>
        <div style={{ marginBottom:16, fontSize:11, color:C.txt3, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:C.mono }}>Sign in as</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { role:"owner", label:"Listing Partner", sub:"Ramesh Nair · 142 Gharpayy", icon:"🏠", color:C.amber, owner:OWNERS[0] },
            { role:"sales", label:"Sales Team",       sub:"Koramangala + HSR Zone",    icon:"📊", color:C.green, owner:null },
            { role:"admin", label:"Admin",            sub:"Full system access",         icon:"⚡", color:C.blue,  owner:null },
          ].map(({ role, label, sub, color, owner }) => (
            <button key={role} onClick={() => onLogin(role, owner)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px", cursor:"pointer", textAlign:"left", transition:"border 0.15s", display:"flex", alignItems:"center", gap:14 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color+"60"}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ width:40, height:40, background:color+"18", border:`1px solid ${color}40`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:color }} />
              </div>
              <div>
                <div style={{ fontFamily:C.sans, fontWeight:700, fontSize:15, color:C.txt }}>{label}</div>
                <div style={{ fontFamily:C.mono, fontSize:11, color:C.txt2, marginTop:2 }}>{sub}</div>
              </div>
              <div style={{ marginLeft:"auto", color:C.txt3, fontSize:16 }}>→</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop:32, background:C.amberDim, border:`1px solid ${C.amberBrd}`, borderRadius:8, padding:"10px 14px", fontFamily:C.mono, fontSize:11, color:C.amber, lineHeight:1.6 }}>
          Demo system · No owner confirmation = no selling · All rooms locked by default
        </div>
      </div>
    </div>
  );
}

// ─── OWNER PORTAL ─────────────────────────────────────────────────────────────
function OwnerPortal({ owner }) {
  const [rooms, setRooms] = useState(ROOMS_BASE);
  const [tab, setTab] = useState("rooms");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ status:"vacant", from:"", price:"", remarks:"" });
  const [saved, setSaved] = useState(null);

  const myProps = PROPERTIES.filter(p => owner.props.includes(p.id));
  const myRooms = rooms.filter(r => myProps.find(p => p.id === r.pid));
  const vacant  = myRooms.filter(r => r.ws.status === "vacant").length;
  const vacating= myRooms.filter(r => r.ws.status === "vacating").length;

  const openUpdate = (room) => {
    setForm({ status: room.ws.status, from: room.ws.from || "", price: room.ws.price, remarks: room.ws.remarks || "" });
    setModal(room);
  };

  const handleSave = () => {
    setRooms(prev => prev.map(r => r.id === modal.id ? { ...r, ws:{ ...r.ws, status:form.status, from:form.from||null, price:parseInt(form.price)||r.ws.price, remarks:form.remarks, confirmed:"Just now" } } : r));
    setSaved(modal.num);
    setModal(null);
    setTimeout(() => setSaved(null), 3000);
  };

  const totalPitches  = myRooms.reduce((s,r) => s + r.m.pitches, 0);
  const totalVisits   = myRooms.reduce((s,r) => s + r.m.vd, 0);
  const totalScheduled= myRooms.reduce((s,r) => s + r.m.vs, 0);

  return (
    <div className="gp-in" style={{ minHeight:"100vh", background:C.bg, fontFamily:C.sans }}>
      <div style={{ padding:"24px 20px", maxWidth:680, margin:"0 auto" }}>

        {/* Property Header */}
        <div style={{ ...S.card, marginBottom:16, background:`linear-gradient(135deg, ${C.amberDim} 0%, transparent 60%)`, borderColor:C.amberBrd }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontFamily:C.mono, fontSize:11, color:C.amber, marginBottom:4, letterSpacing:"0.06em" }}>YOUR PROPERTY</div>
              <div style={{ fontWeight:800, fontSize:22, color:C.txt, letterSpacing:"-0.02em" }}>{myProps[0]?.name}</div>
              <div style={{ fontFamily:C.mono, fontSize:12, color:C.txt2, marginTop:2 }}>{myProps[0]?.area} · {myProps[0]?.gender?.toUpperCase()} PG · {myRooms.length} rooms</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ textAlign:"center", background:C.greenDim, border:`1px solid ${C.greenBrd}`, borderRadius:8, padding:"8px 14px" }}>
                <div style={{ fontWeight:800, fontSize:22, color:C.green }}>{vacant}</div>
                <div style={{ fontSize:10, color:C.green, fontFamily:C.mono, letterSpacing:"0.05em" }}>VACANT</div>
              </div>
              <div style={{ textAlign:"center", background:C.amberDim, border:`1px solid ${C.amberBrd}`, borderRadius:8, padding:"8px 14px" }}>
                <div style={{ fontWeight:800, fontSize:22, color:C.amber }}>{vacating}</div>
                <div style={{ fontSize:10, color:C.amber, fontFamily:C.mono, letterSpacing:"0.05em" }}>VACATING</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:16, background:C.surface, borderRadius:8, padding:4, width:"fit-content" }}>
          {[["rooms","Rooms"],["effort","Gharpayy's Work"]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...S.btn(tab===t ? C.amber : "transparent", tab===t ? C.bg : C.txt2, "transparent"), padding:"6px 14px", fontSize:12 }}>{l}</button>
          ))}
        </div>

        {/* Toast */}
        {saved && (
          <div style={{ background:C.greenDim, border:`1px solid ${C.greenBrd}`, borderRadius:8, padding:"10px 14px", marginBottom:12, fontFamily:C.mono, fontSize:12, color:C.green, display:"flex", alignItems:"center", gap:8 }}>
            <Dot color={C.green} /> Room {saved} updated successfully · Retail team notified
          </div>
        )}

        {tab === "rooms" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {myRooms.map(room => (
              <div key={room.id} style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:44, height:44, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ fontFamily:C.mono, fontWeight:500, fontSize:14, color:C.txt }}>{room.num}</div>
                    <div style={{ fontFamily:C.mono, fontSize:9, color:C.txt3 }}>ROOM</div>
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:14, color:C.txt }}>{room.type}</span>
                      <Badge status={room.ws.status} />
                    </div>
                    <div style={{ fontFamily:C.mono, fontSize:12, color:C.txt2 }}>
                      ₹{room.ws.price.toLocaleString()}/mo
                      {room.ws.from && <span style={{ color:C.amber, marginLeft:8 }}>from {room.ws.from}</span>}
                    </div>
                    {room.ws.remarks && <div style={{ fontSize:11, color:C.txt3, marginTop:2 }}>{room.ws.remarks}</div>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.txt3 }}>Last: {room.ws.confirmed}</div>
                  <button onClick={() => openUpdate(room)} style={{ ...S.btn(C.amber+"18", C.amber, C.amberBrd), fontSize:12, padding:"6px 12px" }}>Update</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "effort" && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              {[["Total Pitches",totalPitches,"Leads contacted",C.purple],["Visits Done",totalVisits,"Completed visits",C.green],["Scheduled",totalScheduled,"Upcoming visits",C.blue]].map(([l,v,s,col]) => (
                <MetricCard key={l} label={l} value={v} sub={s} color={col} />
              ))}
            </div>
            <div style={{ ...S.card, marginBottom:10 }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.txt, marginBottom:14 }}>Activity per room</div>
              {myRooms.filter(r => r.m.pitches > 0 || r.m.vs > 0).map(room => (
                <div key={room.id} style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:10, marginBottom:10, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontFamily:C.mono, fontWeight:500, fontSize:13, color:C.txt, width:36 }}>#{room.num}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                      {Array.from({length: Math.min(room.m.pitches, 10)}).map((_,i) => (
                        <div key={"p"+i} style={{ width:14, height:14, borderRadius:2, background:C.purpleDim, border:`1px solid ${C.purple}40` }} title="Pitch" />
                      ))}
                      {Array.from({length: room.m.vs}).map((_,i) => (
                        <div key={"v"+i} style={{ width:14, height:14, borderRadius:2, background:C.blueDim, border:`1px solid ${C.blue}40` }} title="Visit scheduled" />
                      ))}
                      {Array.from({length: room.m.vd}).map((_,i) => (
                        <div key={"d"+i} style={{ width:14, height:14, borderRadius:2, background:C.greenDim, border:`1px solid ${C.green}40` }} title="Visit done" />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.txt2, textAlign:"right" }}>
                    <div>{room.m.pitches} pitches</div>
                    <div>{room.m.vd} visits done</div>
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", gap:14, marginTop:4 }}>
                {[["■ Pitch",C.purple],[" ■ Visit scheduled",C.blue],[" ■ Visit done",C.green]].map(([l,c]) => (
                  <span key={l} style={{ fontFamily:C.mono, fontSize:10, color:c }}>{l}</span>
                ))}
              </div>
            </div>
            <div style={{ ...S.card, background:C.greenDim, borderColor:C.greenBrd }}>
              <div style={{ fontFamily:C.mono, fontSize:12, color:C.green, lineHeight:1.7 }}>
                ✓ We are actively working on filling your vacant rooms. Every action above is logged in real-time. You earn when we sell — that's the alignment.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:999, backdropFilter:"blur(2px)" }}>
          <div className="gp-in" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"14px 14px 0 0", padding:"24px 20px", width:"100%", maxWidth:480 }}>
            <div style={{ fontFamily:C.mono, fontSize:11, color:C.amber, marginBottom:4, letterSpacing:"0.06em" }}>UPDATE ROOM</div>
            <div style={{ fontWeight:800, fontSize:20, color:C.txt, marginBottom:20 }}>Room {modal.num} · {modal.type}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ ...S.label, marginBottom:8 }}>Availability</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[["vacant","Available Now"],["vacating","Available On Date"]].map(([v,l]) => (
                    <button key={v} onClick={() => setForm({...form, status:v})} style={{ ...S.btn(form.status===v ? C.amber : C.card, form.status===v ? C.bg : C.txt2, form.status===v ? C.amber : C.border), flex:1, fontSize:12 }}>{l}</button>
                  ))}
                </div>
              </div>
              {form.status === "vacating" && (
                <div>
                  <div style={{ ...S.label, marginBottom:6 }}>Available From</div>
                  <input type="date" value={form.from} onChange={e => setForm({...form, from:e.target.value})} style={S.input} />
                </div>
              )}
              <div>
                <div style={{ ...S.label, marginBottom:6 }}>Expected Rent (₹/month)</div>
                <input type="number" value={form.price} onChange={e => setForm({...form, price:e.target.value})} placeholder={modal.ws.price} style={S.input} />
              </div>
              <div>
                <div style={{ ...S.label, marginBottom:6 }}>Remarks (optional · max 150 chars)</div>
                <textarea value={form.remarks} onChange={e => setForm({...form, remarks:e.target.value.slice(0,150)})} placeholder="Why should a tenant take this room?" style={{ ...S.input, height:72, resize:"none" }} />
                <div style={{ fontFamily:C.mono, fontSize:10, color:C.txt3, marginTop:3, textAlign:"right" }}>{form.remarks.length}/150</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={() => setModal(null)} style={{ ...S.btn(), flex:1 }}>Cancel</button>
              <button onClick={handleSave} style={{ ...S.btn(C.amber, C.bg, C.amber), flex:2, fontWeight:700 }}>Submit Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SALES PORTAL ─────────────────────────────────────────────────────────────
function SalesPortal() {
  const [rooms, setRooms] = useState(ROOMS_BASE);
  const [visits, setVisits] = useState(VISITS_BASE);
  const [actions, setActions] = useState(ACTIONS_BASE);
  const [tab, setTab] = useState("inventory");
  const [areaFilter, setAreaFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionModal, setActionModal] = useState(null);
  const [visitModal, setVisitModal] = useState(null);
  const [vForm, setVForm] = useState({ customer:"", type:"Physical", time:"" });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const allAreas = ["All", ...new Set(PROPERTIES.map(p => p.area))];
  const visibleRooms = rooms.filter(r => {
    const prop = PROPERTIES.find(p => p.id === r.pid);
    const areaOk = areaFilter === "All" || prop?.area === areaFilter;
    const statusOk = statusFilter === "All" || r.ws.status === statusFilter || r.rt.status === statusFilter;
    return areaOk && statusOk;
  });

  const approveRoom = (roomId) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, rt: { ...r.rt, status:"approved", price: Math.round(r.ws.price * 1.12), by:"You" } } : r));
    showToast("Room approved for retail sale");
  };

  const logAction = (roomId, type) => {
    const room = rooms.find(r => r.id === roomId);
    setActions(prev => [{ id:"a"+Date.now(), rid:roomId, type, note:`${type.replace("_"," ")} logged for Room ${room.num}`, ts:"Just now", by:"You" }, ...prev]);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, m: { ...r.m, pitches: type==="pitch" ? r.m.pitches+1 : r.m.pitches } } : r));
    showToast("Action logged successfully");
    setActionModal(null);
  };

  const scheduleVisit = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    setVisits(prev => [{ id:"v"+Date.now(), rid:roomId, customer:vForm.customer, type:vForm.type, time:vForm.time||"Today 3:00 PM", status:"pending", rep:"You" }, ...prev]);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, m: { ...r.m, vs: r.m.vs+1 } } : r));
    showToast(`Visit scheduled for Room ${room.num}`);
    setVisitModal(null);
    setVForm({ customer:"", type:"Physical", time:"" });
  };

  const sellableCount = rooms.filter(r => r.ws.status !== "occupied" && r.rt.status === "approved").length;
  const draftCount    = rooms.filter(r => r.rt.status === "draft" && r.ws.status !== "occupied").length;

  return (
    <div className="gp-in" style={{ minHeight:"100vh", background:C.bg, fontFamily:C.sans }}>
      <div style={{ padding:"20px", maxWidth:960, margin:"0 auto" }}>
        {/* Metrics */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          <MetricCard label="Sellable Rooms" value={sellableCount} color={C.green} sub="Retail-approved, available" />
          <MetricCard label="Needs Review"   value={draftCount}    color={C.amber} sub="Awaiting retail approval" />
          <MetricCard label="Visits Today"   value={visits.filter(v=>v.time.includes("Today")).length} color={C.blue} sub="Scheduled today" />
          <MetricCard label="Active Leads"   value={ACTIONS_BASE.length} color={C.purple} sub="Total actions this week" />
        </div>

        {/* Tabs + Filters */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", gap:4, background:C.surface, borderRadius:8, padding:4 }}>
            {[["inventory","Inventory"],["visits","Visits"],["actions","Action Log"]].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ ...S.btn(tab===t ? C.card : "transparent", tab===t ? C.txt : C.txt2, "transparent"), fontSize:12, padding:"5px 12px", border:tab===t ? `1px solid ${C.border}` : "1px solid transparent" }}>{l}</button>
            ))}
          </div>
          {tab === "inventory" && (
            <div style={{ display:"flex", gap:8 }}>
              <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} style={{ ...S.input, width:"auto", padding:"5px 10px", fontSize:12 }}>
                {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...S.input, width:"auto", padding:"5px 10px", fontSize:12 }}>
                {["All","vacant","vacating","occupied","approved","draft"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
          )}
        </div>

        {toast && (
          <div style={{ background:C.greenDim, border:`1px solid ${C.greenBrd}`, borderRadius:8, padding:"9px 14px", marginBottom:12, fontFamily:C.mono, fontSize:12, color:C.green }}>✓ {toast}</div>
        )}

        {/* INVENTORY TAB */}
        {tab === "inventory" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:10 }}>
            {visibleRooms.map(room => {
              const prop = PROPERTIES.find(p => p.id === room.pid);
              const isSellable = room.ws.status !== "occupied" && room.rt.status === "approved";
              const borderColor = room.ws.status === "vacant" ? C.greenBrd : room.ws.status === "vacating" ? C.amberBrd : C.border;
              return (
                <div key={room.id} style={{ ...S.card, borderColor: isSellable ? C.greenBrd : borderColor, display:"flex", flexDirection:"column", gap:10 }}>
                  {/* Room header */}
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:40, height:40, background:C.surface, borderRadius:7, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`1px solid ${C.border}` }}>
                        <div style={{ fontFamily:C.mono, fontWeight:500, fontSize:13, color:C.txt }}>{room.num}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:C.txt }}>{prop?.name}</div>
                        <div style={{ fontFamily:C.mono, fontSize:11, color:C.txt2 }}>{room.type} · {prop?.area}</div>
                      </div>
                    </div>
                    <Badge status={room.ws.status} />
                  </div>
                  {/* Price row */}
                  <div style={{ display:"flex", justifyContent:"space-between", background:C.surface, borderRadius:7, padding:"8px 10px" }}>
                    <div>
                      <div style={{ fontSize:10, color:C.txt3, fontFamily:C.mono }}>WHOLESALE</div>
                      <div style={{ fontFamily:C.mono, fontWeight:500, fontSize:13, color:C.txt2 }}>₹{room.ws.price.toLocaleString()}</div>
                    </div>
                    <div style={{ width:1, background:C.border }} />
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:C.txt3, fontFamily:C.mono }}>RETAIL</div>
                      <div style={{ fontFamily:C.mono, fontWeight:500, fontSize:13, color:room.rt.price ? C.amber : C.txt3 }}>
                        {room.rt.price ? `₹${room.rt.price.toLocaleString()}` : "Pending"}
                      </div>
                    </div>
                  </div>
                  {/* Retail status + tier */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Badge status={room.rt.status} />
                    {room.rt.tier && <Badge status={room.rt.tier?.toLowerCase()} />}
                    {room.ws.from && <span style={{ fontFamily:C.mono, fontSize:10, color:C.amber }}>→ {room.ws.from}</span>}
                  </div>
                  {/* Metrics */}
                  <div style={{ display:"flex", gap:12, fontFamily:C.mono, fontSize:11, color:C.txt2 }}>
                    <span><span style={{ color:C.purple }}>{room.m.pitches}</span> pitches</span>
                    <span><span style={{ color:C.blue }}>{room.m.vs}</span> visits</span>
                    <span><span style={{ color:C.green }}>{room.m.vd}</span> done</span>
                  </div>
                  {/* Actions */}
                  <div style={{ display:"flex", gap:6, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                    {room.rt.status === "draft" && room.ws.status !== "occupied" && (
                      <button onClick={() => approveRoom(room.id)} style={{ ...S.btn(C.greenDim, C.green, C.greenBrd), flex:1, fontSize:11 }}>Approve</button>
                    )}
                    {room.ws.status !== "occupied" && (
                      <>
                        <button onClick={() => { setVisitModal(room); }} style={{ ...S.btn(C.blueDim, C.blue, C.blueBrd), flex:1, fontSize:11 }}>Schedule Visit</button>
                        <button onClick={() => setActionModal(room)} style={{ ...S.btn(), flex:1, fontSize:11 }}>Log Action</button>
                      </>
                    )}
                    {room.ws.status === "occupied" && <span style={{ fontSize:11, color:C.txt3, fontFamily:C.mono, padding:"4px 0" }}>Room occupied · no actions</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VISITS TAB */}
        {tab === "visits" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {visits.map(v => {
              const room = rooms.find(r => r.id === v.rid);
              const prop = PROPERTIES.find(p => p.id === room?.pid);
              return (
                <div key={v.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:v.status==="confirmed" ? C.green : C.amber, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.txt }}>{v.customer}</div>
                    <div style={{ fontFamily:C.mono, fontSize:11, color:C.txt2 }}>{prop?.name} · Room {room?.num} · {v.type}</div>
                  </div>
                  <div style={{ fontFamily:C.mono, fontSize:12, color:C.txt2, textAlign:"right" }}>
                    <div style={{ color:C.txt }}>{v.time}</div>
                    <div>{v.rep}</div>
                  </div>
                  <Badge status={v.status} />
                </div>
              );
            })}
          </div>
        )}

        {/* ACTIONS TAB */}
        {tab === "actions" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {actions.map(a => {
              const room = rooms.find(r => r.id === a.rid);
              const typeColors = { pitch:C.purple, virtual_tour:C.blue, visit_done:C.green, visit_scheduled:C.blue };
              const typeLabels = { pitch:"PITCH", virtual_tour:"VIRTUAL TOUR", visit_done:"VISIT DONE", visit_scheduled:"VISIT SCHEDULED" };
              return (
                <div key={a.id} style={{ ...S.card, display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={{ width:6, background:typeColors[a.type]||C.txt3, borderRadius:3, alignSelf:"stretch", flexShrink:0, minHeight:40 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:C.mono, fontSize:10, color:typeColors[a.type]||C.txt2, letterSpacing:"0.06em" }}>{typeLabels[a.type]||a.type}</span>
                      <span style={{ fontFamily:C.mono, fontSize:10, color:C.txt3 }}>Room {room?.num}</span>
                    </div>
                    <div style={{ fontSize:13, color:C.txt }}>{a.note}</div>
                  </div>
                  <div style={{ fontFamily:C.mono, fontSize:11, color:C.txt3, whiteSpace:"nowrap", textAlign:"right" }}>
                    <div>{a.ts}</div>
                    <div style={{ color:C.txt2 }}>{a.by}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visit Modal */}
      {visitModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:999 }}>
          <div className="gp-in" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"14px 14px 0 0", padding:"24px 20px", width:"100%", maxWidth:460 }}>
            <div style={{ fontFamily:C.mono, fontSize:11, color:C.blue, marginBottom:4 }}>SCHEDULE VISIT</div>
            <div style={{ fontWeight:800, fontSize:18, color:C.txt, marginBottom:18 }}>Room {visitModal.num} · {visitModal.type}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <div style={{ ...S.label, marginBottom:6 }}>Customer Name</div>
                <input value={vForm.customer} onChange={e => setVForm({...vForm, customer:e.target.value})} placeholder="Enter customer name" style={S.input} />
              </div>
              <div>
                <div style={{ ...S.label, marginBottom:6 }}>Visit Type</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["Physical","Virtual"].map(t => (
                    <button key={t} onClick={() => setVForm({...vForm, type:t})} style={{ ...S.btn(vForm.type===t ? C.blue+"22" : C.card, vForm.type===t ? C.blue : C.txt2, vForm.type===t ? C.blueBrd : C.border), flex:1, fontSize:12 }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ ...S.label, marginBottom:6 }}>Date & Time</div>
                <input value={vForm.time} onChange={e => setVForm({...vForm, time:e.target.value})} placeholder="e.g. Tomorrow 11:00 AM" style={S.input} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={() => setVisitModal(null)} style={{ ...S.btn(), flex:1 }}>Cancel</button>
              <button onClick={() => scheduleVisit(visitModal.id)} disabled={!vForm.customer} style={{ ...S.btn(vForm.customer ? C.blue : C.card, vForm.customer ? "#fff" : C.txt3, vForm.customer ? C.blueBrd : C.border), flex:2, fontWeight:700 }}>Confirm Visit</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:999 }}>
          <div className="gp-in" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"14px 14px 0 0", padding:"24px 20px", width:"100%", maxWidth:400 }}>
            <div style={{ fontFamily:C.mono, fontSize:11, color:C.amber, marginBottom:4 }}>LOG ACTION · Room {actionModal.num}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
              {[["pitch","Pitch to Lead","Log a new lead contact",C.purple],["virtual_tour","Virtual Tour","Sent virtual tour link",C.blue],["visit_scheduled","Visit Scheduled","Book a physical visit",C.blue],["visit_done","Visit Completed","Mark visit as done",C.green]].map(([type,label,sub,col]) => (
                <button key={type} onClick={() => logAction(actionModal.id, type)} style={{ ...S.btn(col+"15", col, col+"50"), padding:"12px 14px", textAlign:"left", display:"flex", flexDirection:"column", gap:2 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{label}</span>
                  <span style={{ fontFamily:C.mono, fontSize:11, opacity:0.7 }}>{sub}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setActionModal(null)} style={{ ...S.btn(), width:"100%", marginTop:10 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PORTAL ─────────────────────────────────────────────────────────────
function AdminPortal() {
  const [rooms] = useState(ROOMS_BASE);
  const [tab, setTab] = useState("overview");

  const totalRooms  = rooms.length;
  const vacant      = rooms.filter(r => r.ws.status === "vacant").length;
  const vacating    = rooms.filter(r => r.ws.status === "vacating").length;
  const occupied    = rooms.filter(r => r.ws.status === "occupied").length;
  const approved    = rooms.filter(r => r.rt.status === "approved").length;
  const draftRooms  = rooms.filter(r => r.rt.status === "draft").length;

  const ownerCompliance = OWNERS.map(o => {
    const oProps = PROPERTIES.filter(p => p.owner_id === o.id).map(p => p.id);
    const oRooms = rooms.filter(r => oProps.includes(r.pid));
    const confirmed = oRooms.filter(r => r.ws.confirmed !== "").length;
    const score = Math.round((confirmed / Math.max(oRooms.length, 1)) * 100);
    return { ...o, rooms: oRooms.length, confirmed, score };
  });

  return (
    <div className="gp-in" style={{ minHeight:"100vh", background:C.bg, fontFamily:C.sans }}>
      <div style={{ padding:"20px", maxWidth:1000, margin:"0 auto" }}>
        {/* Top metrics */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          {[["Total Rooms",totalRooms,C.txt,"All properties"],["Vacant",vacant,C.green,"Ready to sell"],["Vacating",vacating,C.amber,"Upcoming"],["Occupied",occupied,C.red,"Not available"],["Retail Live",approved,C.green,"Approved"],["Needs Review",draftRooms,C.amber,"Draft rooms"]].map(([l,v,c,s]) => (
            <MetricCard key={l} label={l} value={v} color={c} sub={s} />
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, background:C.surface, borderRadius:8, padding:4, marginBottom:16, width:"fit-content" }}>
          {[["overview","Overview"],["rooms","All Rooms"],["owners","Owner Compliance"]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...S.btn(tab===t ? C.card : "transparent", tab===t ? C.txt : C.txt2, "transparent"), fontSize:12, padding:"5px 12px", border:tab===t ? `1px solid ${C.border}` : "1px solid transparent" }}>{l}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:14 }}>
            <div style={{ ...S.card }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.txt, marginBottom:14 }}>Wholesale → Retail Pipeline</div>
              {[["Wholesale Confirmed",rooms.filter(r=>r.ws.status!=="occupied").length, C.amber],["Retail Approved",approved,C.green],["On Draft",draftRooms,C.txt2]].map(([l,v,c]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Dot color={c} />
                    <span style={{ fontSize:13, color:C.txt }}>{l}</span>
                  </div>
                  <span style={{ fontFamily:C.mono, fontWeight:500, fontSize:14, color:c }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:12, height:6, borderRadius:3, background:C.surface, overflow:"hidden", position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${(approved/Math.max(totalRooms,1))*100}%`, background:`linear-gradient(90deg,${C.amber},${C.green})`, borderRadius:3 }} />
              </div>
              <div style={{ fontFamily:C.mono, fontSize:11, color:C.txt2, marginTop:6 }}>{Math.round((approved/Math.max(totalRooms,1))*100)}% inventory live</div>
            </div>

            <div style={{ ...S.card }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.txt, marginBottom:14 }}>Recent System Activity</div>
              {ACTIONS_BASE.slice(0,5).map(a => {
                const room = rooms.find(r => r.id === a.rid);
                return (
                  <div key={a.id} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:C.purple, marginTop:5, flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:12, color:C.txt }}>{a.note}</div>
                      <div style={{ fontFamily:C.mono, fontSize:10, color:C.txt3, marginTop:2 }}>Room {room?.num} · {a.ts}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.txt, marginBottom:14 }}>Business Rules Status</div>
              {[["No owner confirmation → no selling","Active"],["Every visit tied to a room","Active"],["Rooms auto-lock on scheduling","Active"],["Admin override always logged","Active"],["No silent backdoors","Active"]].map(([rule, status]) => (
                <div key={rule} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:C.green, marginTop:5, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:12, color:C.txt }}>{rule}</div>
                    <div style={{ fontFamily:C.mono, fontSize:10, color:C.green, marginTop:1 }}>{status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL ROOMS */}
        {tab === "rooms" && (
          <div style={{ ...S.card, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:C.mono, fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                  {["Room","Property","Type","W. Status","W. Price","R. Status","Retail Price","Tier","Actions"].map(h => (
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:C.txt3, fontWeight:600, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => {
                  const prop = PROPERTIES.find(p => p.id === r.pid);
                  return (
                    <tr key={r.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"8px 10px", fontWeight:500, color:C.txt }}>{r.num}</td>
                      <td style={{ padding:"8px 10px", color:C.txt2 }}>{prop?.name}</td>
                      <td style={{ padding:"8px 10px", color:C.txt2 }}>{r.type}</td>
                      <td style={{ padding:"8px 10px" }}><Badge status={r.ws.status} /></td>
                      <td style={{ padding:"8px 10px", color:C.txt }}>₹{r.ws.price.toLocaleString()}</td>
                      <td style={{ padding:"8px 10px" }}><Badge status={r.rt.status} /></td>
                      <td style={{ padding:"8px 10px", color:r.rt.price ? C.amber : C.txt3 }}>{r.rt.price ? `₹${r.rt.price.toLocaleString()}` : "—"}</td>
                      <td style={{ padding:"8px 10px" }}>{r.rt.tier ? <Badge status={r.rt.tier?.toLowerCase()} /> : <span style={{ color:C.txt3 }}>—</span>}</td>
                      <td style={{ padding:"8px 10px", color:C.txt2 }}>{r.m.pitches}P / {r.m.vs}V</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* OWNER COMPLIANCE */}
        {tab === "owners" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {ownerCompliance.map(o => (
              <div key={o.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <Avatar name={o.name} initials={o.initials} size={44} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:C.txt }}>{o.name}</div>
                  <div style={{ fontFamily:C.mono, fontSize:12, color:C.txt2 }}>{o.area} · {o.rooms} rooms</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:C.mono, fontWeight:500, fontSize:22, color: o.score >= 80 ? C.green : o.score >= 60 ? C.amber : C.red }}>{o.score}%</div>
                  <div style={{ fontFamily:C.mono, fontSize:11, color:C.txt3 }}>Compliance Score</div>
                </div>
                <div style={{ width:120 }}>
                  <div style={{ height:5, borderRadius:3, background:C.surface, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${o.score}%`, background: o.score >= 80 ? C.green : o.score >= 60 ? C.amber : C.red, borderRadius:3, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.txt3, marginTop:4 }}>{o.confirmed}/{o.rooms} confirmed</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function GharpayyCMS() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = (r, owner) => { setRole(r); setUser(owner); };
  const handleSwitch = () => { setRole(null); setUser(null); };

  return (
    <div style={{ fontFamily:C.sans, background:C.bg, minHeight:"100vh", color:C.txt }}>
      <FontLoader />
      {!role && <LoginScreen onLogin={handleLogin} />}
      {role && (
        <>
          <TopBar role={role} onSwitch={handleSwitch} />
          {role === "owner" && <OwnerPortal owner={user || OWNERS[0]} />}
          {role === "sales" && <SalesPortal />}
          {role === "admin" && <AdminPortal />}
        </>
      )}
    </div>
  );
}
