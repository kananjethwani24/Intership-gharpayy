import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   GHARPAYY INVENTORY OS  ·  3X BUILD  ·  RULES FIRST
   State Machine · Two-Layer Inventory · Full Action Ledger
═══════════════════════════════════════════════════════════════ */

// ── FONTS ──────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";

// ── DESIGN TOKENS ──────────────────────────────────────────────
const T = {
  bg0: "#050507",
  bg1: "#0A0A0F",
  bg2: "#111118",
  bg3: "#18181F",
  bg4: "#1F1F28",
  line: "rgba(255,255,255,0.055)",
  lineH:"rgba(255,255,255,0.11)",
  lineA:"rgba(255,255,255,0.18)",
  // Text
  t0: "#F4F4F8",
  t1: "#AAAAB8",
  t2: "#5E5E72",
  t3: "#2E2E3A",
  // Brand
  gold:   "#F2A318",
  goldD:  "rgba(242,163,24,0.1)",
  goldB:  "rgba(242,163,24,0.25)",
  // Status colors
  green:  "#22C55E",
  greenD: "rgba(34,197,94,0.09)",
  greenB: "rgba(34,197,94,0.25)",
  amber:  "#F59E0B",
  amberD: "rgba(245,158,11,0.09)",
  amberB: "rgba(245,158,11,0.25)",
  red:    "#EF4444",
  redD:   "rgba(239,68,68,0.09)",
  redB:   "rgba(239,68,68,0.25)",
  blue:   "#3B82F6",
  blueD:  "rgba(59,130,246,0.09)",
  blueB:  "rgba(59,130,246,0.25)",
  violet: "#8B5CF6",
  violetD:"rgba(139,92,246,0.09)",
  violetB:"rgba(139,92,246,0.25)",
  cyan:   "#06B6D4",
  cyanD:  "rgba(6,182,212,0.09)",
  cyanB:  "rgba(6,182,212,0.25)",
  // Typography
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ── ROOM STATE MACHINE ─────────────────────────────────────────
// LOCKED → AVAILABLE → APPROVED → SOFT_LOCKED → HARD_LOCKED
// Owner submits → moves from LOCKED to AVAILABLE
// Retail approves → AVAILABLE to APPROVED
// Visit scheduled → APPROVED to SOFT_LOCKED
// Pre-booking → SOFT_LOCKED to HARD_LOCKED
// Owner occupied → any → LOCKED

const ROOM_STATES = {
  LOCKED:      { label:"Locked",        color:"#5E5E72",       bg:"rgba(94,94,114,0.1)",  border:"rgba(94,94,114,0.3)",  desc:"No owner update" },
  AVAILABLE:   { label:"Available",     color:T.amber,         bg:T.amberD,               border:T.amberB,               desc:"Owner updated, awaiting retail" },
  APPROVED:    { label:"Approved",      color:T.green,         bg:T.greenD,               border:T.greenB,               desc:"Live – sellable" },
  SOFT_LOCKED: { label:"Visit Sched.",  color:T.blue,          bg:T.blueD,                border:T.blueB,                desc:"Visit scheduled – temp hold" },
  HARD_LOCKED: { label:"Pre-booked",    color:T.violet,        bg:T.violetD,              border:T.violetB,              desc:"Pre-booking in progress" },
  OCCUPIED:    { label:"Occupied",      color:T.red,           bg:T.redD,                 border:T.redB,                 desc:"Currently occupied" },
};

// ── SEED DATA ──────────────────────────────────────────────────
const OWNERS_DATA = [
  { id:"ow1", name:"Ramesh Nair",      initials:"RN", phone:"9876543210", area:"Koramangala",  propertyIds:["pr1"] },
  { id:"ow2", name:"Priya Subramaniam",initials:"PS", phone:"8765432109", area:"HSR Layout",   propertyIds:["pr2"] },
  { id:"ow3", name:"Suresh Mehta",     initials:"SM", phone:"7654321098", area:"Indiranagar",  propertyIds:["pr3"] },
  { id:"ow4", name:"Anita Reddy",      initials:"AR", phone:"6543210987", area:"Whitefield",   propertyIds:["pr4"] },
];

const PROPERTIES_DATA = [
  { id:"pr1", name:"142 Gharpayy",        ownerId:"ow1", area:"Koramangala", gender:"Boys",  floors:4, amenities:["WiFi","AC","Laundry","CCTV","Parking"] },
  { id:"pr2", name:"78 Gharpayy Suites",  ownerId:"ow2", area:"HSR Layout",  gender:"Girls", floors:3, amenities:["WiFi","AC","Tiffin","Hot Water","CCTV"] },
  { id:"pr3", name:"203 Gharpayy Hub",    ownerId:"ow3", area:"Indiranagar", gender:"Co-ed", floors:5, amenities:["WiFi","Gym","AC","Rooftop","Parking"] },
  { id:"pr4", name:"57 Gharpayy Classic", ownerId:"ow4", area:"Whitefield",  gender:"Boys",  floors:3, amenities:["WiFi","AC","Mess","Laundry","CCTV"] },
];

// RoomMaster = immutable truth
const ROOM_MASTER = [
  // 142 Gharpayy
  { id:"rm1",  propId:"pr1", num:"101", type:"Double", beds:2, basePrice:8000 },
  { id:"rm2",  propId:"pr1", num:"102", type:"Single", beds:1, basePrice:6500 },
  { id:"rm3",  propId:"pr1", num:"201", type:"Double", beds:2, basePrice:8200 },
  { id:"rm4",  propId:"pr1", num:"202", type:"Triple", beds:3, basePrice:5800 },
  { id:"rm5",  propId:"pr1", num:"301", type:"Double", beds:2, basePrice:9000 },
  { id:"rm6",  propId:"pr1", num:"302", type:"Single", beds:1, basePrice:7000 },
  { id:"rm7",  propId:"pr1", num:"401", type:"Premium",beds:2, basePrice:11000},
  // 78 Gharpayy Suites
  { id:"rm8",  propId:"pr2", num:"101", type:"Single", beds:1, basePrice:9500 },
  { id:"rm9",  propId:"pr2", num:"102", type:"Double", beds:2, basePrice:8000 },
  { id:"rm10", propId:"pr2", num:"201", type:"Single", beds:1, basePrice:9800 },
  { id:"rm11", propId:"pr2", num:"301", type:"Premium",beds:2, basePrice:13000},
  { id:"rm12", propId:"pr2", num:"302", type:"Double", beds:2, basePrice:8500 },
  // 203 Gharpayy Hub
  { id:"rm13", propId:"pr3", num:"101", type:"Triple", beds:3, basePrice:5500 },
  { id:"rm14", propId:"pr3", num:"201", type:"Double", beds:2, basePrice:8800 },
  { id:"rm15", propId:"pr3", num:"401", type:"Single", beds:1, basePrice:8500 },
  { id:"rm16", propId:"pr3", num:"501", type:"Premium",beds:2, basePrice:14000},
  // 57 Classic
  { id:"rm17", propId:"pr4", num:"101", type:"Double", beds:2, basePrice:7500 },
  { id:"rm18", propId:"pr4", num:"102", type:"Triple", beds:3, basePrice:5200 },
  { id:"rm19", propId:"pr4", num:"201", type:"Single", beds:1, basePrice:6800 },
];

// AvailabilityUpdate — only owner writes here
const AVAILABILITY_SEED = [
  { id:"av1",  roomId:"rm1",  type:"available_now",  availFrom:null,      price:8800,  remarks:"Repainted, new AC installed",     updatedAt:"Mar 24, 10:12 AM", updatedBy:"ow1" },
  { id:"av2",  roomId:"rm2",  type:"available_now",  availFrom:null,      price:7200,  remarks:"",                                updatedAt:"Mar 24, 11:30 AM", updatedBy:"ow1" },
  { id:"av3",  roomId:"rm3",  type:"available_on_date", availFrom:"Apr 1",price:8500,  remarks:"Tenant shifting, confirmed April 1",updatedAt:"Mar 22, 3:00 PM",  updatedBy:"ow1" },
  { id:"av4",  roomId:"rm5",  type:"available_now",  availFrom:null,      price:9800,  remarks:"City view, top floor",            updatedAt:"Mar 23, 9:45 AM",  updatedBy:"ow1" },
  { id:"av5",  roomId:"rm7",  type:"available_now",  availFrom:null,      price:12500, remarks:"Best room in property, premium fittings", updatedAt:"Mar 21, 2:00 PM", updatedBy:"ow1" },
  { id:"av6",  roomId:"rm8",  type:"available_now",  availFrom:null,      price:10000, remarks:"",                                updatedAt:"Mar 25, 8:00 AM",  updatedBy:"ow2" },
  { id:"av7",  roomId:"rm9",  type:"available_on_date",availFrom:"Apr 15",price:8200,  remarks:"",                                updatedAt:"Mar 22, 4:00 PM",  updatedBy:"ow2" },
  { id:"av8",  roomId:"rm13", type:"available_now",  availFrom:null,      price:5800,  remarks:"Ground floor, easy access",       updatedAt:"Mar 25, 9:00 AM",  updatedBy:"ow3" },
  { id:"av9",  roomId:"rm14", type:"available_now",  availFrom:null,      price:9200,  remarks:"",                                updatedAt:"Mar 24, 1:00 PM",  updatedBy:"ow3" },
  { id:"av10", roomId:"rm16", type:"available_on_date",availFrom:"Apr 5", price:15000, remarks:"Penthouse style — rare availability",updatedAt:"Mar 23, 11:00 AM",updatedBy:"ow3" },
  { id:"av11", roomId:"rm17", type:"available_now",  availFrom:null,      price:7800,  remarks:"",                                updatedAt:"Mar 20, 2:30 PM",  updatedBy:"ow4" },
];

// RetailRoom — Gharpayy team manages
const RETAIL_SEED = [
  { roomId:"rm1",  status:"APPROVED",    retailPrice:10200, tier:"Mid",     brandNotes:"Well-maintained, ideal for IT workers", approvedBy:"Karan S",  approvedAt:"Mar 24, 2:00 PM" },
  { roomId:"rm2",  status:"APPROVED",    retailPrice:8200,  tier:"Budget",  brandNotes:"Good value — starter room",             approvedBy:"Karan S",  approvedAt:"Mar 24, 2:30 PM" },
  { roomId:"rm3",  status:"AVAILABLE",   retailPrice:null,  tier:null,      brandNotes:"",                                       approvedBy:null,       approvedAt:null },
  { roomId:"rm5",  status:"SOFT_LOCKED", retailPrice:11500, tier:"Premium", brandNotes:"Top floor with view — strong sell",      approvedBy:"Karan S",  approvedAt:"Mar 23, 4:00 PM" },
  { roomId:"rm7",  status:"APPROVED",    retailPrice:14500, tier:"Premium", brandNotes:"Best inventory — close first",           approvedBy:"Karan S",  approvedAt:"Mar 21, 5:00 PM" },
  { roomId:"rm8",  status:"AVAILABLE",   retailPrice:null,  tier:null,      brandNotes:"",                                       approvedBy:null,       approvedAt:null },
  { roomId:"rm9",  status:"AVAILABLE",   retailPrice:null,  tier:null,      brandNotes:"",                                       approvedBy:null,       approvedAt:null },
  { roomId:"rm13", status:"APPROVED",    retailPrice:6500,  tier:"Budget",  brandNotes:"Best budget option in Indiranagar",      approvedBy:"Priya R",  approvedAt:"Mar 25, 11:00 AM" },
  { roomId:"rm14", status:"APPROVED",    retailPrice:10800, tier:"Mid",     brandNotes:"Great location, close to MG Road",       approvedBy:"Priya R",  approvedAt:"Mar 24, 3:00 PM" },
  { roomId:"rm16", status:"AVAILABLE",   retailPrice:null,  tier:null,      brandNotes:"",                                       approvedBy:null,       approvedAt:null },
  { roomId:"rm17", status:"HARD_LOCKED", retailPrice:8900,  tier:"Budget",  brandNotes:"Pre-booking in progress — do not pitch", approvedBy:"Raj K",    approvedAt:"Mar 20, 5:00 PM" },
  { roomId:"rm11", status:"APPROVED",    retailPrice:14800, tier:"Premium", brandNotes:"Top room in HSR — last one available",   approvedBy:"Neha M",   approvedAt:"Mar 19, 2:00 PM" },
];

// compute initial room state from data
function computeRoomState(roomId, retail, avail) {
  const r = retail.find(x => x.roomId === roomId);
  const a = avail.find(x => x.roomId === roomId);
  if (!a) return "LOCKED";
  if (!r || r.status === "AVAILABLE") return "AVAILABLE";
  return r.status;
}

const VISITS_SEED = [
  { id:"vi1", roomId:"rm5",  customer:"Rohan Gupta",     phone:"9876001234", type:"Physical", time:"Today 11:00 AM", status:"Confirmed", rep:"Karan S",  notes:"Looking for 3+ months" },
  { id:"vi2", roomId:"rm1",  customer:"Amit Patel",      phone:"9876005678", type:"Virtual",  time:"Today 2:30 PM",  status:"Pending",   rep:"Karan S",  notes:"Referred by existing tenant" },
  { id:"vi3", roomId:"rm7",  customer:"Neha Joshi",      phone:"9900112233", type:"Physical", time:"Tomorrow 10:00", status:"Confirmed", rep:"Priya R",  notes:"Premium room ask" },
  { id:"vi4", roomId:"rm13", customer:"Dev Kumar",       phone:"9800990011", type:"Virtual",  time:"Tomorrow 3:00",  status:"Pending",   rep:"Raj K",    notes:"Budget conscious" },
  { id:"vi5", roomId:"rm14", customer:"Sneha Iyer",      phone:"9988776655", type:"Physical", time:"Mar 27 10:00",   status:"Confirmed", rep:"Priya R",  notes:"Wants to move Apr 1" },
  { id:"vi6", roomId:"rm11", customer:"Arjun Mehta",     phone:"9776655443", type:"Physical", time:"Mar 27 4:00 PM", status:"Pending",   rep:"Neha M",   notes:"Referred, high intent" },
];

const ACTIONS_SEED = [
  { id:"ac1",  roomId:"rm1",  type:"pitch",          note:"Pitched to Wipro engineer. Strong interest in double room.",           ts:"Today 9:30 AM",    by:"Karan S",  userId:"u2" },
  { id:"ac2",  roomId:"rm5",  type:"virtual_tour",   note:"Sent property video + room walkthrough via WhatsApp.",                 ts:"Today 8:45 AM",    by:"Karan S",  userId:"u2" },
  { id:"ac3",  roomId:"rm7",  type:"pitch",          note:"Pitched to 3 leads from Naukri. One has confirmed interest.",         ts:"Yesterday 5:00 PM",by:"Karan S",  userId:"u2" },
  { id:"ac4",  roomId:"rm1",  type:"visit_done",     note:"Physical visit completed. Customer very positive. Follow-up tomorrow.",ts:"Yesterday 4:00 PM",by:"Karan S",  userId:"u2" },
  { id:"ac5",  roomId:"rm14", type:"pitch",          note:"Pitched IIM student looking for co-ed PG near MG Road.",              ts:"Yesterday 2:00 PM",by:"Priya R",  userId:"u3" },
  { id:"ac6",  roomId:"rm13", type:"pitch",          note:"Pitched to Accenture fresher. Budget option perfectly fits.",         ts:"Yesterday 1:00 PM",by:"Raj K",    userId:"u4" },
  { id:"ac7",  roomId:"rm11", type:"virtual_tour",   note:"Shared premium room video. Customer impressed.",                       ts:"Mar 24 3:00 PM",   by:"Neha M",   userId:"u5" },
  { id:"ac8",  roomId:"rm7",  type:"pre_booking",    note:"Customer paid ₹2,000 token. Pre-booking confirmed.",                  ts:"Mar 24 11:00 AM",  by:"Karan S",  userId:"u2" },
  { id:"ac9",  roomId:"rm5",  type:"visit_scheduled",note:"Physical visit booked for Today 11AM with Rohan Gupta.",              ts:"Mar 24 10:00 AM",  by:"Karan S",  userId:"u2" },
  { id:"ac10", roomId:"rm14", type:"visit_done",     note:"Customer visited, liked the property. Asked for April availability.", ts:"Mar 23 5:00 PM",   by:"Priya R",  userId:"u3" },
  { id:"ac11", roomId:"rm1",  type:"pitch",          note:"Pitched via housing.com lead. Sent property details.",                ts:"Mar 23 11:00 AM",  by:"Karan S",  userId:"u2" },
  { id:"ac12", roomId:"rm13", type:"visit_done",     note:"Site visit done. Customer interested pending parent visit.",          ts:"Mar 23 2:00 PM",   by:"Raj K",    userId:"u4" },
  { id:"ac13", roomId:"rm11", type:"pitch",          note:"3 pitches to housing leads. 2 show high intent.",                    ts:"Mar 22 4:00 PM",   by:"Neha M",   userId:"u5" },
  { id:"ac14", roomId:"rm5",  type:"pitch",          note:"Pitched to LinkedIn connection. Very interested in premium room.",    ts:"Mar 22 10:00 AM",  by:"Karan S",  userId:"u2" },
  { id:"ac15", roomId:"rm14", type:"visit_scheduled",note:"Scheduled physical visit for Sneha Iyer on Mar 27.",                 ts:"Mar 22 9:00 AM",   by:"Priya R",  userId:"u3" },
];

const OVERRIDES_SEED = [
  { id:"ov1", roomId:"rm4",  action:"Force unlock",      reason:"Owner confirmed verbally — system update delayed", by:"Admin", ts:"Mar 23 3:00 PM" },
  { id:"ov2", roomId:"rm6",  action:"Status reset",      reason:"Incorrect entry by sales team corrected",          by:"Admin", ts:"Mar 20 11:00 AM" },
];

// ── GLOBAL STATE ──────────────────────────────────────────────
function useGharpayy() {
  const [rooms]    = useState(ROOM_MASTER);
  const [props]    = useState(PROPERTIES_DATA);
  const [owners]   = useState(OWNERS_DATA);
  const [avail,   setAvail]   = useState(AVAILABILITY_SEED);
  const [retail,  setRetail]  = useState(RETAIL_SEED);
  const [visits,  setVisits]  = useState(VISITS_SEED);
  const [actions, setActions] = useState(ACTIONS_SEED);
  const [overrides, setOverrides] = useState(OVERRIDES_SEED);
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((msg, type="success") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4500);
  }, []);

  // COMPUTED: full room state
  const getRoomState = useCallback((roomId) => {
    const r = retail.find(x => x.roomId === roomId);
    const a = avail.find(x => x.roomId === roomId);
    if (!a) return "LOCKED";
    if (!r || r.status === "AVAILABLE") return "AVAILABLE";
    return r.status;
  }, [retail, avail]);

  // OWNER: update availability
  const ownerUpdateRoom = useCallback((roomId, update, ownerId) => {
    const existing = avail.find(a => a.roomId === roomId);
    const entry = { id:"av"+Date.now(), roomId, ...update, updatedAt:"Just now", updatedBy:ownerId };
    if (existing) {
      setAvail(prev => prev.map(a => a.roomId === roomId ? entry : a));
    } else {
      setAvail(prev => [...prev, entry]);
    }
    // auto-move retail to AVAILABLE state for team to review
    const hasRetail = retail.find(r => r.roomId === roomId);
    if (!hasRetail) {
      setRetail(prev => [...prev, { roomId, status:"AVAILABLE", retailPrice:null, tier:null, brandNotes:"", approvedBy:null, approvedAt:null }]);
    } else {
      setRetail(prev => prev.map(r => r.roomId === roomId && (r.status === "LOCKED" || r.status === "OCCUPIED") ? { ...r, status:"AVAILABLE" } : r));
    }
    setActions(prev => [{ id:"ac"+Date.now(), roomId, type:"owner_update", note:`Owner updated: ${update.type === "available_now" ? "Available Now" : "Available from "+update.availFrom}. Price ₹${update.price.toLocaleString()}`, ts:"Just now", by:"Owner", userId:ownerId }, ...prev]);
    addNotification("Room updated · Sales team notified · Retail review queue updated", "success");
  }, [avail, retail, addNotification]);

  // SALES/ADMIN: approve room for retail
  const approveRoom = useCallback((roomId, price, tier, brandNotes, by) => {
    setRetail(prev => prev.map(r => r.roomId === roomId ? { ...r, status:"APPROVED", retailPrice:price, tier, brandNotes, approvedBy:by, approvedAt:"Just now" } : r));
    setActions(prev => [{ id:"ac"+Date.now(), roomId, type:"retail_approved", note:`Retail approved at ₹${price.toLocaleString()}/${tier} tier. ${brandNotes}`, ts:"Just now", by, userId:"retail" }, ...prev]);
    addNotification("Room approved · Now live in sales inventory", "success");
  }, [addNotification]);

  // SALES: schedule visit
  const scheduleVisit = useCallback((roomId, visitData, by) => {
    const newVisit = { id:"vi"+Date.now(), roomId, ...visitData, status:"Pending", rep:by };
    setVisits(prev => [newVisit, ...prev]);
    setRetail(prev => prev.map(r => r.roomId === roomId && r.status === "APPROVED" ? { ...r, status:"SOFT_LOCKED" } : r));
    setActions(prev => [{ id:"ac"+Date.now(), roomId, type:"visit_scheduled", note:`${visitData.type} visit scheduled for ${visitData.customer} · ${visitData.time}`, ts:"Just now", by, userId:"sales" }, ...prev]);
    addNotification(`Visit scheduled · Room soft-locked for ${visitData.customer}`, "info");
  }, [addNotification]);

  // SALES: log action
  const logAction = useCallback((roomId, type, note, by) => {
    setActions(prev => [{ id:"ac"+Date.now(), roomId, type, note, ts:"Just now", by, userId:"sales" }, ...prev]);
    if (type === "pre_booking") {
      setRetail(prev => prev.map(r => r.roomId === roomId ? { ...r, status:"HARD_LOCKED" } : r));
      addNotification("Pre-booking logged · Room hard-locked · Owner notified", "success");
    } else {
      addNotification("Action logged · Effort ledger updated", "success");
    }
  }, [addNotification]);

  // ADMIN: override
  const adminOverride = useCallback((roomId, newStatus, reason, by) => {
    setRetail(prev => prev.map(r => r.roomId === roomId ? { ...r, status:newStatus } : r));
    setOverrides(prev => [{ id:"ov"+Date.now(), roomId, action:`Status → ${newStatus}`, reason, by, ts:"Just now" }, ...prev]);
    setActions(prev => [{ id:"ac"+Date.now(), roomId, type:"admin_override", note:`[ADMIN OVERRIDE] Status set to ${newStatus}. Reason: ${reason}`, ts:"Just now", by, userId:"admin" }, ...prev]);
    addNotification(`Override applied · Logged and visible to all stakeholders`, "warning");
  }, [addNotification]);

  return { rooms, props, owners, avail, retail, visits, actions, overrides, notifications, getRoomState, ownerUpdateRoom, approveRoom, scheduleVisit, logAction, adminOverride, addNotification };
}

// ── FONT INJECTOR ──────────────────────────────────────────────
function Fonts() {
  useEffect(() => {
    if (!document.getElementById("gp-fonts")) {
      const l = document.createElement("link");
      l.id = "gp-fonts"; l.rel = "stylesheet"; l.href = FONT_URL;
      document.head.appendChild(l);
    }
    if (!document.getElementById("gp-global")) {
      const s = document.createElement("style");
      s.id = "gp-global";
      s.textContent = `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.bg0} !important;overflow-x:hidden}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:${T.bg1}}
        ::-webkit-scrollbar-thumb{background:${T.bg4};border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideRight{from{transform:translateX(-6px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toast-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        .gp-fade{animation:fadeUp .2s ease}
        .gp-slide{animation:slideRight .15s ease}
        .gp-pulse{animation:pulse 2.2s infinite}
        input:focus,textarea:focus,select:focus{outline:none}
        button{font-family:${T.sans};cursor:pointer}
        input,textarea,select{font-family:${T.sans};color:${T.t0}}
      `;
      document.head.appendChild(s);
    }
  }, []);
  return null;
}

// ── PRIMITIVE COMPONENTS ───────────────────────────────────────

function Tag({ state }) {
  const s = ROOM_STATES[state] || ROOM_STATES.LOCKED;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontFamily:T.mono, fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:4, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {s.label.toUpperCase()}
    </span>
  );
}

function Chip({ label, color=T.t1, bg="transparent", border }) {
  return (
    <span style={{ fontFamily:T.mono, fontSize:10, fontWeight:600, color, background:bg, border:`1px solid ${border||color+"44"}`, padding:"2px 7px", borderRadius:3, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
      {label.toUpperCase()}
    </span>
  );
}

function Btn({ children, onClick, variant="ghost", disabled, style:extStyle }) {
  const variants = {
    ghost:   { bg:"transparent",  col:T.t1,    brd:T.line },
    primary: { bg:T.gold,          col:"#000",  brd:T.gold },
    green:   { bg:T.greenD,        col:T.green, brd:T.greenB },
    amber:   { bg:T.amberD,        col:T.amber, brd:T.amberB },
    blue:    { bg:T.blueD,         col:T.blue,  brd:T.blueB },
    violet:  { bg:T.violetD,       col:T.violet,brd:T.violetB },
    red:     { bg:T.redD,          col:T.red,   brd:T.redB },
    dark:    { bg:T.bg3,           col:T.t0,    brd:T.line },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button disabled={disabled} onClick={onClick} style={{ background:v.bg, color:v.col, border:`1px solid ${v.brd}`, borderRadius:7, padding:"7px 14px", fontSize:13, fontFamily:T.sans, fontWeight:500, transition:"all .14s", opacity:disabled?.8:1, cursor:disabled?"not-allowed":"pointer", ...extStyle }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type="text", style:ext }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background:T.bg3, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 13px", fontSize:13, color:T.t0, width:"100%", ...ext }}
      onFocus={e => e.target.style.borderColor = T.lineA}
      onBlur={e => e.target.style.borderColor = T.line} />
  );
}

function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={{ background:T.bg3, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 13px", fontSize:13, color:T.t0, width:"100%", resize:"none", lineHeight:1.6 }}
      onFocus={e => e.target.style.borderColor = T.lineA}
      onBlur={e => e.target.style.borderColor = T.line} />
  );
}

function Select({ value, onChange, children, style:ext }) {
  return (
    <select value={value} onChange={onChange} style={{ background:T.bg3, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 13px", fontSize:13, color:T.t0, width:"100%", ...ext }}
      onFocus={e => e.target.style.borderColor = T.lineA}
      onBlur={e => e.target.style.borderColor = T.line}>
      {children}
    </select>
  );
}

function Label({ children }) {
  return <div style={{ fontFamily:T.mono, fontSize:10, fontWeight:600, color:T.t2, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:7 }}>{children}</div>;
}

function Card({ children, style:ext, glow }) {
  return (
    <div style={{ background:T.bg2, border:`1px solid ${glow || T.line}`, borderRadius:10, padding:"16px 18px", ...ext }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, color=T.t0, sub, icon }) {
  return (
    <Card style={{ flex:1, minWidth:100 }}>
      <div style={{ fontSize:10, fontFamily:T.mono, color:T.t2, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:30, fontWeight:700, color, lineHeight:1, marginBottom:3 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.t2, fontFamily:T.mono }}>{sub}</div>}
    </Card>
  );
}

function Avatar({ name, size=36 }) {
  const colors = [T.gold, T.green, T.blue, T.violet, T.cyan, T.amber];
  const c = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:c+"1A", border:`1.5px solid ${c}50`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.mono, fontSize:size*.32, fontWeight:600, color:c, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:T.line, margin:"14px 0" }} />;
}

function EmptyState({ msg }) {
  return <div style={{ textAlign:"center", padding:"48px 24px", color:T.t2, fontFamily:T.mono, fontSize:12 }}>{msg}</div>;
}

// ── NOTIFICATION TOASTS ────────────────────────────────────────
function Toasts({ items }) {
  const typeColors = { success:T.green, info:T.blue, warning:T.amber, error:T.red };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, display:"flex", flexDirection:"column-reverse", gap:8, zIndex:9999, maxWidth:340 }}>
      {items.map(n => (
        <div key={n.id} style={{ background:T.bg3, border:`1px solid ${typeColors[n.type||"success"]}50`, borderLeft:`3px solid ${typeColors[n.type||"success"]}`, borderRadius:8, padding:"11px 14px", fontSize:13, color:T.t0, animation:"toast-in .25s ease", boxShadow:"0 8px 24px rgba(0,0,0,0.5)", lineHeight:1.5 }}>
          {n.msg}
        </div>
      ))}
    </div>
  );
}

// ── TOP BAR ────────────────────────────────────────────────────
function TopBar({ role, userName, onSwitch, notifCount }) {
  const roleMap = { owner:["LISTING PARTNER", T.gold], sales:["SALES TEAM", T.green], admin:["ADMIN", T.blue] };
  const [rLabel, rColor] = roleMap[role] || ["", T.t1];
  return (
    <div style={{ background:T.bg1, borderBottom:`1px solid ${T.line}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", justifyContent:"space-between", position:"sticky", top:0, zIndex:200 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:26, height:26, background:T.gold, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:9, height:9, background:T.bg0, borderRadius:1, transform:"rotate(45deg)" }} />
          </div>
          <span style={{ fontFamily:T.sans, fontWeight:700, fontSize:16, color:T.t0, letterSpacing:"-0.02em" }}>
            Gharpayy<span style={{ color:T.gold }}>OS</span>
          </span>
        </div>
        <div style={{ width:1, height:20, background:T.line }} />
        <div style={{ fontFamily:T.mono, fontSize:11, color:rColor, background:rColor+"18", border:`1px solid ${rColor}35`, borderRadius:4, padding:"3px 9px", letterSpacing:"0.06em" }}>{rLabel}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {userName && <span style={{ fontSize:13, color:T.t1 }}>{userName}</span>}
        <Btn onClick={onSwitch}>Switch Role</Btn>
      </div>
    </div>
  );
}

// ── TAB BAR ────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:2, background:T.bg1, borderRadius:9, padding:4, width:"fit-content" }}>
      {tabs.map(([id, label, count]) => (
        <button key={id} onClick={() => onChange(id)} style={{ background:active===id ? T.bg3 : "transparent", border:active===id ? `1px solid ${T.line}` : "1px solid transparent", color:active===id ? T.t0 : T.t2, borderRadius:6, padding:"6px 14px", fontSize:12, fontFamily:T.sans, fontWeight:500, cursor:"pointer", transition:"all .13s", display:"flex", alignItems:"center", gap:6 }}>
          {label}
          {count !== undefined && count > 0 && <span style={{ background:T.gold+"22", color:T.gold, borderRadius:3, fontSize:10, fontFamily:T.mono, padding:"0 5px", lineHeight:"16px" }}>{count}</span>}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════
function Login({ onLogin }) {
  return (
    <div className="gp-fade" style={{ minHeight:"100vh", background:T.bg0, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <div style={{ width:52, height:52, background:T.gold, borderRadius:13, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:18, height:18, background:T.bg0, borderRadius:3, transform:"rotate(45deg)" }} />
          </div>
          <div style={{ fontFamily:T.sans, fontWeight:700, fontSize:24, color:T.t0, letterSpacing:"-0.03em" }}>Gharpayy<span style={{ color:T.gold }}>OS</span></div>
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.t2, marginTop:6 }}>Inventory Operating System · 3X Build</div>
        </div>
        <div style={{ fontFamily:T.mono, fontSize:10, color:T.t3, letterSpacing:"0.12em", marginBottom:12, paddingLeft:2 }}>SELECT YOUR ROLE</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { role:"owner", label:"Listing Partner", sub:"Ramesh Nair · 142 Gharpayy, Koramangala", color:T.gold,   owner:OWNERS_DATA[0] },
            { role:"sales", label:"Gharpayy Sales",  sub:"Koramangala + HSR + Indiranagar zones",   color:T.green,  owner:null },
            { role:"admin", label:"Admin",            sub:"Full system access · All zones",          color:T.blue,   owner:null },
          ].map(({ role, label, sub, color, owner }) => (
            <button key={role} onClick={() => onLogin(role, owner)} style={{ background:T.bg2, border:`1px solid ${T.line}`, borderRadius:10, padding:"14px 16px", cursor:"pointer", textAlign:"left", transition:"border .13s", display:"flex", alignItems:"center", gap:13 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color+"55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.line}>
              <div style={{ width:38, height:38, background:color+"18", border:`1px solid ${color}35`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:color }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:T.sans, fontWeight:600, fontSize:14, color:T.t0 }}>{label}</div>
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.t2, marginTop:2 }}>{sub}</div>
              </div>
              <div style={{ color:T.t3 }}>→</div>
            </button>
          ))}
        </div>
        <Card style={{ marginTop:24, background:T.goldD, borderColor:T.goldB }}>
          <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, lineHeight:1.8 }}>
            Rule #1 · No owner update = room not sellable<br/>
            Rule #2 · No retail approval = room hidden from sales<br/>
            Rule #3 · Every action is logged. No exceptions.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OWNER PORTAL
// ══════════════════════════════════════════════════════════════
function OwnerPortal({ owner, data }) {
  const { rooms, props, avail, retail, actions, getRoomState, ownerUpdateRoom } = data;
  const [tab, setTab] = useState("rooms");
  const [updateModal, setUpdateModal] = useState(null);
  const [form, setForm] = useState({ type:"available_now", availFrom:"", price:"", remarks:"" });

  const myProps = props.filter(p => owner.propertyIds.includes(p.id));
  const myRooms = rooms.filter(r => myProps.some(p => p.id === r.propId));

  const openUpdate = (room) => {
    const existing = avail.find(a => a.roomId === room.id);
    setForm({ type: existing?.type || "available_now", availFrom: existing?.availFrom || "", price: existing?.price || room.basePrice, remarks: existing?.remarks || "" });
    setUpdateModal(room);
  };

  const submit = () => {
    ownerUpdateRoom(updateModal.id, { type:form.type, availFrom:form.availFrom||null, price:parseInt(form.price)||updateModal.basePrice, remarks:form.remarks }, owner.id);
    setUpdateModal(null);
  };

  // Stats for owner's property
  const myAvails = avail.filter(a => myRooms.some(r => r.id === a.roomId));
  const totalPitches  = actions.filter(a => myRooms.some(r => r.id === a.roomId) && a.type === "pitch").length;
  const totalVirtual  = actions.filter(a => myRooms.some(r => r.id === a.roomId) && a.type === "virtual_tour").length;
  const totalVisitsSch= actions.filter(a => myRooms.some(r => r.id === a.roomId) && a.type === "visit_scheduled").length;
  const totalVisitsDone=actions.filter(a => myRooms.some(r => r.id === a.roomId) && a.type === "visit_done").length;
  const totalPrebook  = actions.filter(a => myRooms.some(r => r.id === a.roomId) && a.type === "pre_booking").length;

  const myActions = actions.filter(a => myRooms.some(r => r.id === a.roomId)).slice(0, 20);

  const actionColors = { pitch:T.violet, virtual_tour:T.cyan, visit_scheduled:T.blue, visit_done:T.green, pre_booking:T.gold, admin_override:T.red, retail_approved:T.green, owner_update:T.amber };
  const actionLabels = { pitch:"Pitch",virtual_tour:"Virtual Tour",visit_scheduled:"Visit Sched.",visit_done:"Visit Done",pre_booking:"Pre-Booking",admin_override:"Admin Override",retail_approved:"Retail Approved",owner_update:"Owner Updated" };

  const prop = myProps[0];
  const vacantCount   = myRooms.filter(r => getRoomState(r.id) === "APPROVED" || getRoomState(r.id) === "AVAILABLE").length;
  const lockedCount   = myRooms.filter(r => getRoomState(r.id) === "LOCKED").length;

  return (
    <div className="gp-fade" style={{ minHeight:"100vh", background:T.bg0, fontFamily:T.sans }}>
      <div style={{ padding:"20px", maxWidth:720, margin:"0 auto" }}>

        {/* Property card */}
        <Card glow={T.goldB} style={{ marginBottom:16, background:`linear-gradient(135deg, ${T.goldD}, transparent 70%)` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
            <div>
              <div style={{ fontFamily:T.mono, fontSize:10, color:T.gold, letterSpacing:"0.1em", marginBottom:5 }}>YOUR PROPERTY</div>
              <div style={{ fontWeight:700, fontSize:22, color:T.t0, letterSpacing:"-0.025em" }}>{prop?.name}</div>
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.t1, marginTop:4 }}>{prop?.area} · {prop?.gender} PG · {myRooms.length} rooms · {prop?.floors} floors</div>
              <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                {prop?.amenities.map(a => <Chip key={a} label={a} color={T.t2} />)}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ textAlign:"center", background:T.greenD, border:`1px solid ${T.greenB}`, borderRadius:8, padding:"10px 16px" }}>
                <div style={{ fontWeight:700, fontSize:24, color:T.green }}>{vacantCount}</div>
                <div style={{ fontFamily:T.mono, fontSize:9, color:T.green, marginTop:2 }}>ACTIVE</div>
              </div>
              <div style={{ textAlign:"center", background:T.redD, border:`1px solid ${T.redB}`, borderRadius:8, padding:"10px 16px" }}>
                <div style={{ fontWeight:700, fontSize:24, color:T.red }}>{lockedCount}</div>
                <div style={{ fontFamily:T.mono, fontSize:9, color:T.red, marginTop:2 }}>LOCKED</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Effort summary strip */}
        <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
          {[[totalPitches,"Pitches",T.violet],[totalVirtual,"Virtual Tours",T.cyan],[totalVisitsSch,"Visits Sched.",T.blue],[totalVisitsDone,"Visits Done",T.green],[totalPrebook,"Pre-bookings",T.gold]].map(([v,l,c]) => (
            <div key={l} style={{ flexShrink:0, background:c+"10", border:`1px solid ${c}30`, borderRadius:8, padding:"8px 12px", textAlign:"center", minWidth:88 }}>
              <div style={{ fontWeight:700, fontSize:20, color:c }}>{v}</div>
              <div style={{ fontFamily:T.mono, fontSize:9, color:c, marginTop:2 }}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <TabBar tabs={[["rooms","Rooms",lockedCount],["effort","Activity Feed",myActions.length]]} active={tab} onChange={setTab} />
        <div style={{ height:14 }} />

        {/* ── ROOMS TAB ── */}
        {tab === "rooms" && (
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {myRooms.map(room => {
              const roomState = getRoomState(room.id);
              const roomAvail = avail.find(a => a.roomId === room.id);
              const roomRetail = retail.find(r => r.roomId === room.id);
              const stateInfo = ROOM_STATES[roomState];
              const needsUpdate = roomState === "LOCKED";
              return (
                <div key={room.id} style={{ background:T.bg2, border:`1px solid ${needsUpdate ? T.redB : stateInfo.border}`, borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", transition:"border .15s" }}>
                  {/* Room number badge */}
                  <div style={{ width:46, height:46, background:T.bg3, border:`1px solid ${T.line}`, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <div style={{ fontFamily:T.mono, fontWeight:600, fontSize:15, color:T.t0 }}>{room.num}</div>
                    <div style={{ fontFamily:T.mono, fontSize:9, color:T.t3 }}>ROOM</div>
                  </div>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:600, fontSize:14, color:T.t0 }}>{room.type}</span>
                      <Tag state={roomState} />
                      {roomRetail?.tier && <Chip label={roomRetail.tier} color={T.amber} />}
                    </div>
                    {roomAvail ? (
                      <div style={{ fontFamily:T.mono, fontSize:12, color:T.t1 }}>
                        ₹{roomAvail.price.toLocaleString()}/mo
                        {roomRetail?.retailPrice && <span style={{ color:T.gold, marginLeft:8 }}>→ Retail ₹{roomRetail.retailPrice.toLocaleString()}</span>}
                        {roomAvail.availFrom && <span style={{ color:T.amber, marginLeft:8 }}>· From {roomAvail.availFrom}</span>}
                      </div>
                    ) : (
                      <div style={{ fontFamily:T.mono, fontSize:12, color:T.red }}>No availability update · Room is locked</div>
                    )}
                    {roomAvail?.remarks && <div style={{ fontSize:11, color:T.t2, marginTop:3 }}>{roomAvail.remarks}</div>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    {roomAvail && <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2 }}>{roomAvail.updatedAt}</div>}
                    <Btn onClick={() => openUpdate(room)} variant={needsUpdate ? "amber" : "ghost"} style={{ fontSize:12, padding:"6px 12px" }}>
                      {needsUpdate ? "⚠ Update Now" : "Update"}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── EFFORT TAB ── */}
        {tab === "effort" && (
          <div>
            <Card style={{ marginBottom:12, background:T.greenD, borderColor:T.greenB }}>
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.green, lineHeight:1.75 }}>
                Every action below is our live effort ledger for your property.<br/>
                This is how we earn your trust — through transparent work, not talk.
              </div>
            </Card>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {myActions.length ? myActions.map(a => {
                const room = rooms.find(r => r.id === a.roomId);
                const col = actionColors[a.type] || T.t2;
                return (
                  <div key={a.id} style={{ background:T.bg2, border:`1px solid ${T.line}`, borderRadius:9, padding:"12px 14px", display:"flex", gap:12 }}>
                    <div style={{ width:3, background:col, borderRadius:2, flexShrink:0, alignSelf:"stretch", minHeight:36 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <Chip label={actionLabels[a.type] || a.type} color={col} />
                        <span style={{ fontFamily:T.mono, fontSize:10, color:T.t2 }}>Room {room?.num}</span>
                      </div>
                      <div style={{ fontSize:13, color:T.t0, lineHeight:1.5 }}>{a.note}</div>
                    </div>
                    <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2, textAlign:"right", whiteSpace:"nowrap" }}>
                      <div style={{ color:T.t1 }}>{a.ts}</div>
                      <div style={{ marginTop:2 }}>{a.by}</div>
                    </div>
                  </div>
                );
              }) : <EmptyState msg="No activity logged yet for your property" />}
            </div>
          </div>
        )}
      </div>

      {/* ── UPDATE MODAL ── */}
      {updateModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:998, backdropFilter:"blur(3px)" }} onClick={e => e.target === e.currentTarget && setUpdateModal(null)}>
          <div className="gp-fade" style={{ background:T.bg2, border:`1px solid ${T.lineH}`, borderRadius:"14px 14px 0 0", padding:"24px 20px", width:"100%", maxWidth:460, paddingBottom:34 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.gold, letterSpacing:"0.1em", marginBottom:4 }}>UPDATE ROOM AVAILABILITY</div>
            <div style={{ fontWeight:700, fontSize:20, color:T.t0, marginBottom:4 }}>Room {updateModal.num} · {updateModal.type}</div>
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.t2, marginBottom:20 }}>Base price: ₹{updateModal.basePrice.toLocaleString()}/mo · {updateModal.beds} bed(s)</div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <Label>Availability</Label>
                <div style={{ display:"flex", gap:8 }}>
                  {[["available_now","Available Now"],["available_on_date","Available On Date"]].map(([v,l]) => (
                    <button key={v} onClick={() => setForm({...form, type:v})} style={{ flex:1, background:form.type===v ? T.gold : T.bg3, border:`1px solid ${form.type===v ? T.gold : T.line}`, borderRadius:7, padding:"9px 0", fontSize:13, color:form.type===v ? T.bg0 : T.t1, fontFamily:T.sans, fontWeight:500, cursor:"pointer", transition:"all .12s" }}>{l}</button>
                  ))}
                </div>
              </div>
              {form.type === "available_on_date" && (
                <div>
                  <Label>Available From (Date)</Label>
                  <Input type="text" value={form.availFrom} onChange={e=>setForm({...form,availFrom:e.target.value})} placeholder="e.g. Apr 1 or Apr 15" />
                </div>
              )}
              <div>
                <Label>Expected Rent (₹/month)</Label>
                <Input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder={updateModal.basePrice} />
              </div>
              <div>
                <Label>Remarks (optional · max 150 chars)</Label>
                <Textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value.slice(0,150)})} placeholder="Why should a tenant take this room? Any highlights?" />
                <div style={{ textAlign:"right", fontFamily:T.mono, fontSize:10, color:T.t3, marginTop:3 }}>{form.remarks.length}/150</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <Btn onClick={() => setUpdateModal(null)} style={{ flex:1 }}>Cancel</Btn>
              <Btn onClick={submit} variant="primary" style={{ flex:2, fontWeight:700 }}>Submit Update</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SALES PORTAL
// ══════════════════════════════════════════════════════════════
function SalesPortal({ data }) {
  const { rooms, props, avail, retail, visits, actions, getRoomState, approveRoom, scheduleVisit, logAction } = data;
  const [tab, setTab]     = useState("inventory");
  const [areaF, setAreaF] = useState("All");
  const [stateF, setStF]  = useState("All");
  const [approveModal, setApproveModal] = useState(null);
  const [visitModal,   setVisitModal]   = useState(null);
  const [actionModal,  setActionModal]  = useState(null);
  const [customNote, setCustomNote] = useState("");
  const [apForm, setApForm] = useState({ price:"", tier:"Mid", notes:"" });
  const [vForm, setVForm]  = useState({ customer:"", phone:"", type:"Physical", time:"", notes:"" });

  const allAreas = ["All", ...new Set(props.map(p => p.area))];

  // Inventory build
  const inventoryItems = rooms.map(room => {
    const prop = props.find(p => p.id === room.propId);
    const roomAvail = avail.find(a => a.roomId === room.id);
    const roomRetail = retail.find(r => r.roomId === room.id);
    const state = getRoomState(room.id);
    return { room, prop, avail:roomAvail, retail:roomRetail, state };
  }).filter(({ state, prop }) => {
    const areaOk = areaF === "All" || prop?.area === areaF;
    const stOk   = stateF === "All" || state === stateF;
    return areaOk && stOk && state !== "LOCKED" && state !== "OCCUPIED";
  });

  const needsReview = inventoryItems.filter(i => i.state === "AVAILABLE");
  const live        = inventoryItems.filter(i => i.state === "APPROVED");
  const softLocked  = inventoryItems.filter(i => i.state === "SOFT_LOCKED");
  const hardLocked  = inventoryItems.filter(i => i.state === "HARD_LOCKED");

  const openApprove = (item) => {
    setApForm({ price: Math.round((item.avail?.price || item.room.basePrice) * 1.12), tier:"Mid", notes:"" });
    setApproveModal(item);
  };

  const submitApprove = () => {
    approveRoom(approveModal.room.id, parseInt(apForm.price), apForm.tier, apForm.notes, "Sales Team");
    setApproveModal(null);
  };

  const submitVisit = () => {
    scheduleVisit(visitModal.room.id, { customer:vForm.customer, phone:vForm.phone, type:vForm.type, time:vForm.time||"TBD", notes:vForm.notes }, "Sales Team");
    setVisitModal(null);
    setVForm({ customer:"", phone:"", type:"Physical", time:"", notes:"" });
  };

  const submitAction = (type) => {
    logAction(actionModal.room.id, type, customNote || `${type.replace("_"," ")} logged for Room ${actionModal.room.num}`, "Sales Team");
    setActionModal(null);
    setCustomNote("");
  };

  const myVisits  = visits.slice(0, 20);
  const myActions = actions.filter(a => a.type !== "owner_update").slice(0, 30);

  const actionColors = { pitch:T.violet, virtual_tour:T.cyan, visit_scheduled:T.blue, visit_done:T.green, pre_booking:T.gold, retail_approved:T.green };
  const actionLabels = { pitch:"Pitch",virtual_tour:"Virtual Tour",visit_scheduled:"Visit Sched.",visit_done:"Visit Done",pre_booking:"Pre-Booking",retail_approved:"Retail Approved",admin_override:"Admin Override",owner_update:"Owner Updated" };

  return (
    <div className="gp-fade" style={{ minHeight:"100vh", background:T.bg0, fontFamily:T.sans }}>
      <div style={{ padding:"20px", maxWidth:1040, margin:"0 auto" }}>

        {/* Metrics row */}
        <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
          <StatBox label="Live Inventory"  value={live.length}       color={T.green}  sub="Retail approved · sellable" />
          <StatBox label="Needs Review"    value={needsReview.length} color={T.amber}  sub="Owner updated, not approved" />
          <StatBox label="Visit Holds"     value={softLocked.length}  color={T.blue}   sub="Soft locked – visits sched." />
          <StatBox label="Pre-booked"      value={hardLocked.length}  color={T.violet} sub="Hard locked – token paid" />
          <StatBox label="Visits Today"    value={visits.filter(v=>v.time.includes("Today")).length} color={T.cyan} sub="Scheduled today" />
        </div>

        {/* Filter row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:12 }}>
          <TabBar
            tabs={[["inventory",`Inventory`,needsReview.length],["visits","Visits",visits.filter(v=>v.status==="Pending").length],["log","Action Log",0]]}
            active={tab}
            onChange={setTab}
          />
          {tab === "inventory" && (
            <div style={{ display:"flex", gap:8 }}>
              <Select value={areaF} onChange={e=>setAreaF(e.target.value)} style={{ width:"auto", padding:"6px 10px", fontSize:12 }}>
                {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
              <Select value={stateF} onChange={e=>setStF(e.target.value)} style={{ width:"auto", padding:"6px 10px", fontSize:12 }}>
                {["All","AVAILABLE","APPROVED","SOFT_LOCKED","HARD_LOCKED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </Select>
            </div>
          )}
        </div>

        {/* ── INVENTORY ── */}
        {tab === "inventory" && (
          inventoryItems.length ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(310px, 1fr))", gap:10 }}>
              {inventoryItems.map(({ room, prop, avail:ra, retail:rr, state }) => {
                const stInfo = ROOM_STATES[state];
                return (
                  <div key={room.id} style={{ background:T.bg2, border:`1px solid ${stInfo.border}`, borderRadius:10, padding:"14px 16px", display:"flex", flexDirection:"column", gap:11 }}>
                    {/* Header */}
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", gap:10 }}>
                        <div style={{ width:44, height:44, background:T.bg3, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`1px solid ${T.line}`, flexShrink:0 }}>
                          <div style={{ fontFamily:T.mono, fontWeight:600, fontSize:14, color:T.t0 }}>{room.num}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14, color:T.t0 }}>{prop?.name}</div>
                          <div style={{ fontFamily:T.mono, fontSize:11, color:T.t1 }}>{room.type} · {room.beds} bed · {prop?.area}</div>
                        </div>
                      </div>
                      <Tag state={state} />
                    </div>

                    {/* Price dual display */}
                    <div style={{ display:"flex", background:T.bg3, borderRadius:7, overflow:"hidden", border:`1px solid ${T.line}` }}>
                      <div style={{ flex:1, padding:"8px 10px", borderRight:`1px solid ${T.line}` }}>
                        <div style={{ fontFamily:T.mono, fontSize:9, color:T.t3, marginBottom:3 }}>WHOLESALE</div>
                        <div style={{ fontFamily:T.mono, fontWeight:500, fontSize:13, color:T.t1 }}>₹{(ra?.price || room.basePrice).toLocaleString()}</div>
                      </div>
                      <div style={{ flex:1, padding:"8px 10px" }}>
                        <div style={{ fontFamily:T.mono, fontSize:9, color:T.t3, marginBottom:3 }}>RETAIL</div>
                        <div style={{ fontFamily:T.mono, fontWeight:500, fontSize:13, color:rr?.retailPrice ? T.gold : T.t3 }}>
                          {rr?.retailPrice ? `₹${rr.retailPrice.toLocaleString()}` : "— Pending"}
                        </div>
                      </div>
                    </div>

                    {/* Availability info */}
                    {ra && (
                      <div style={{ fontFamily:T.mono, fontSize:11, color:T.t2 }}>
                        {ra.type === "available_now" ? "Available immediately" : `Available from ${ra.availFrom}`}
                        {ra.remarks && <div style={{ color:T.t1, marginTop:2 }}>{ra.remarks}</div>}
                      </div>
                    )}

                    {/* Retail brand notes */}
                    {rr?.brandNotes && <div style={{ fontSize:12, color:T.t1, fontStyle:"italic", borderLeft:`2px solid ${T.gold}`, paddingLeft:8 }}>{rr.brandNotes}</div>}

                    {/* Tier + approved by */}
                    {rr?.tier && (
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <Chip label={rr.tier} color={T.amber} />
                        {rr.approvedBy && <span style={{ fontFamily:T.mono, fontSize:10, color:T.t2 }}>by {rr.approvedBy}</span>}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display:"flex", gap:6, borderTop:`1px solid ${T.line}`, paddingTop:10, flexWrap:"wrap" }}>
                      {state === "AVAILABLE" && (
                        <Btn onClick={() => openApprove({room,prop,avail:ra,retail:rr})} variant="green" style={{ flex:1, fontSize:11 }}>Approve for Retail</Btn>
                      )}
                      {(state === "APPROVED") && (
                        <>
                          <Btn onClick={() => setVisitModal({room,prop})} variant="blue" style={{ flex:1, fontSize:11 }}>Schedule Visit</Btn>
                          <Btn onClick={() => setActionModal({room,prop})} style={{ flex:1, fontSize:11 }}>Log Action</Btn>
                        </>
                      )}
                      {state === "SOFT_LOCKED" && (
                        <>
                          <Btn onClick={() => setActionModal({room,prop})} variant="violet" style={{ flex:1, fontSize:11 }}>Log Action</Btn>
                          <Btn onClick={() => submitAction && logAction(room.id, "pre_booking", `Pre-booking initiated for Room ${room.num}`, "Sales Team")} variant="amber" style={{ flex:1, fontSize:11 }}>Mark Pre-booked</Btn>
                        </>
                      )}
                      {state === "HARD_LOCKED" && (
                        <span style={{ fontFamily:T.mono, fontSize:11, color:T.violet, padding:"4px 0" }}>Pre-booking in progress · do not pitch</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState msg="No inventory matches current filters" />
        )}

        {/* ── VISITS ── */}
        {tab === "visits" && (
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {myVisits.map(v => {
              const room = rooms.find(r => r.id === v.roomId);
              const prop = props.find(p => p.id === room?.propId);
              const statusColor = v.status === "Confirmed" ? T.green : T.amber;
              return (
                <Card key={v.id} style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:statusColor, flexShrink:0 }} className={v.status === "Pending" ? "gp-pulse" : ""} />
                  <Avatar name={v.customer} size={40} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:T.t0 }}>{v.customer}</div>
                    <div style={{ fontFamily:T.mono, fontSize:11, color:T.t1, marginTop:2 }}>{prop?.name} · Room {room?.num} · {v.type}</div>
                    {v.notes && <div style={{ fontSize:12, color:T.t2, marginTop:2 }}>{v.notes}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:500, color:T.t0 }}>{v.time}</div>
                    <div style={{ fontFamily:T.mono, fontSize:11, color:T.t2, marginTop:2 }}>{v.rep}</div>
                    <div style={{ marginTop:5 }}><Chip label={v.status} color={statusColor} /></div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── ACTION LOG ── */}
        {tab === "log" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {myActions.map(a => {
              const room = rooms.find(r => r.id === a.roomId);
              const prop = props.find(p => p.id === room?.propId);
              const col = actionColors[a.type] || T.t2;
              return (
                <div key={a.id} style={{ background:T.bg2, border:`1px solid ${T.line}`, borderRadius:9, padding:"11px 14px", display:"flex", gap:12 }}>
                  <div style={{ width:3, background:col, borderRadius:2, flexShrink:0, alignSelf:"stretch", minHeight:36 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                      <Chip label={actionLabels[a.type]||a.type} color={col} />
                      <span style={{ fontFamily:T.mono, fontSize:10, color:T.t2 }}>{prop?.name} · Room {room?.num}</span>
                    </div>
                    <div style={{ fontSize:13, color:T.t0, lineHeight:1.5 }}>{a.note}</div>
                  </div>
                  <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2, textAlign:"right", flexShrink:0 }}>
                    <div style={{ color:T.t1 }}>{a.ts}</div>
                    <div style={{ marginTop:2 }}>{a.by}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── APPROVE MODAL ── */}
      {approveModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:998, padding:20 }} onClick={e=>e.target===e.currentTarget&&setApproveModal(null)}>
          <div className="gp-fade" style={{ background:T.bg2, border:`1px solid ${T.lineH}`, borderRadius:12, padding:"24px 22px", width:"100%", maxWidth:420 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.green, letterSpacing:"0.1em", marginBottom:4 }}>RETAIL APPROVAL</div>
            <div style={{ fontWeight:700, fontSize:18, color:T.t0, marginBottom:16 }}>{approveModal.prop?.name} · Room {approveModal.room.num}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <Label>Retail Price (₹/month)</Label>
                <Input type="number" value={apForm.price} onChange={e=>setApForm({...apForm,price:e.target.value})} placeholder="Enter retail price" />
                <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2, marginTop:4 }}>Wholesale: ₹{(approveModal.avail?.price || approveModal.room.basePrice).toLocaleString()} · Suggested: ₹{Math.round((approveModal.avail?.price||approveModal.room.basePrice)*1.12).toLocaleString()}</div>
              </div>
              <div>
                <Label>Pricing Tier</Label>
                <div style={{ display:"flex", gap:6 }}>
                  {["Budget","Mid","Premium"].map(t => (
                    <button key={t} onClick={()=>setApForm({...apForm,tier:t})} style={{ flex:1, background:apForm.tier===t?T.amberD:T.bg3, border:`1px solid ${apForm.tier===t?T.amberB:T.line}`, borderRadius:7, padding:"8px 0", fontSize:12, color:apForm.tier===t?T.amber:T.t1, cursor:"pointer", fontFamily:T.sans, transition:"all .12s" }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Brand Notes (pitch talking points)</Label>
                <Textarea value={apForm.notes} onChange={e=>setApForm({...apForm,notes:e.target.value})} placeholder="Key highlights for sales team to pitch..." />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <Btn onClick={()=>setApproveModal(null)} style={{ flex:1 }}>Cancel</Btn>
              <Btn onClick={submitApprove} variant="green" style={{ flex:2, fontWeight:700 }} disabled={!apForm.price}>Approve Room</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── VISIT MODAL ── */}
      {visitModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:998 }} onClick={e=>e.target===e.currentTarget&&setVisitModal(null)}>
          <div className="gp-fade" style={{ background:T.bg2, border:`1px solid ${T.lineH}`, borderRadius:"14px 14px 0 0", padding:"24px 20px 34px", width:"100%", maxWidth:460 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.blue, letterSpacing:"0.1em", marginBottom:4 }}>SCHEDULE VISIT</div>
            <div style={{ fontWeight:700, fontSize:18, color:T.t0, marginBottom:18 }}>{visitModal.prop?.name} · Room {visitModal.room.num}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1 }}>
                  <Label>Customer Name</Label>
                  <Input value={vForm.customer} onChange={e=>setVForm({...vForm,customer:e.target.value})} placeholder="Full name" />
                </div>
                <div style={{ flex:1 }}>
                  <Label>Phone</Label>
                  <Input value={vForm.phone} onChange={e=>setVForm({...vForm,phone:e.target.value})} placeholder="10-digit" />
                </div>
              </div>
              <div>
                <Label>Visit Type</Label>
                <div style={{ display:"flex", gap:8 }}>
                  {["Physical","Virtual"].map(t=>(
                    <button key={t} onClick={()=>setVForm({...vForm,type:t})} style={{ flex:1, background:vForm.type===t?T.blueD:T.bg3, border:`1px solid ${vForm.type===t?T.blueB:T.line}`, borderRadius:7, padding:"8px 0", fontSize:13, color:vForm.type===t?T.blue:T.t1, cursor:"pointer", fontFamily:T.sans }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Time</Label>
                <Input value={vForm.time} onChange={e=>setVForm({...vForm,time:e.target.value})} placeholder="e.g. Today 3:00 PM / Tomorrow 11:00 AM" />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={vForm.notes} onChange={e=>setVForm({...vForm,notes:e.target.value})} placeholder="Customer context, requirements..." />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <Btn onClick={()=>setVisitModal(null)} style={{ flex:1 }}>Cancel</Btn>
              <Btn onClick={submitVisit} variant="blue" style={{ flex:2, fontWeight:700 }} disabled={!vForm.customer}>Confirm Visit · Lock Room</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION MODAL ── */}
      {actionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:998 }} onClick={e=>e.target===e.currentTarget&&setActionModal(null)}>
          <div className="gp-fade" style={{ background:T.bg2, border:`1px solid ${T.lineH}`, borderRadius:"14px 14px 0 0", padding:"24px 20px 34px", width:"100%", maxWidth:430 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.amber, letterSpacing:"0.1em", marginBottom:4 }}>LOG ACTION</div>
            <div style={{ fontWeight:700, fontSize:18, color:T.t0, marginBottom:4 }}>{actionModal.prop?.name} · Room {actionModal.room.num}</div>
            <div style={{ marginBottom:14 }}>
              <Label>Note (what did you do?)</Label>
              <Textarea value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="Describe the action in detail..." rows={2} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {[["pitch","Pitch to Lead","Logged a new lead contact",T.violet],["virtual_tour","Virtual Tour Sent","Sent room video / walkthrough",T.cyan],["visit_done","Visit Completed","Mark physical visit as done",T.green],["pre_booking","Pre-Booking","Customer paid token amount",T.gold]].map(([type,label,sub,col])=>(
                <button key={type} onClick={()=>submitAction(type)} style={{ background:col+"12", border:`1px solid ${col}35`, borderRadius:8, padding:"11px 14px", textAlign:"left", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:T.sans, fontWeight:600, fontSize:13, color:col }}>{label}</div>
                    <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2, marginTop:2 }}>{sub}</div>
                  </div>
                  <span style={{ color:T.t3 }}>→</span>
                </button>
              ))}
            </div>
            <Btn onClick={()=>{setActionModal(null);setCustomNote("")}} style={{ width:"100%", marginTop:10 }}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN PORTAL
// ══════════════════════════════════════════════════════════════
function AdminPortal({ data }) {
  const { rooms, props, owners, avail, retail, visits, actions, overrides, getRoomState, approveRoom, adminOverride } = data;
  const [tab, setTab] = useState("overview");
  const [overrideModal, setOverrideModal] = useState(null);
  const [ovForm, setOvForm] = useState({ newStatus:"APPROVED", reason:"" });
  const [approveModal, setApproveModal] = useState(null);
  const [apForm, setApForm] = useState({ price:"", tier:"Mid", notes:"" });

  const allStates = rooms.map(r => getRoomState(r.id));
  const stats = {
    total:    rooms.length,
    locked:   allStates.filter(s=>s==="LOCKED").length,
    available:allStates.filter(s=>s==="AVAILABLE").length,
    approved: allStates.filter(s=>s==="APPROVED").length,
    softLock: allStates.filter(s=>s==="SOFT_LOCKED").length,
    hardLock: allStates.filter(s=>s==="HARD_LOCKED").length,
    occupied: allStates.filter(s=>s==="OCCUPIED").length,
  };

  const complianceScores = owners.map(o => {
    const oProps = props.filter(p => p.ownerId === o.id).map(p => p.id);
    const oRooms = rooms.filter(r => oProps.includes(r.propId));
    const updated = oRooms.filter(r => avail.some(a => a.roomId === r.id)).length;
    const score   = Math.round((updated / Math.max(oRooms.length, 1)) * 100);
    const lastActivity = avail.filter(a => oRooms.some(r => r.id === a.roomId)).sort((a,b)=>0)[0];
    return { ...o, totalRooms:oRooms.length, updated, score, lastActivity };
  }).sort((a,b) => b.score - a.score);

  const submitOverride = () => {
    adminOverride(overrideModal.id, ovForm.newStatus, ovForm.reason||"Admin decision", "Admin");
    setOverrideModal(null);
    setOvForm({ newStatus:"APPROVED", reason:"" });
  };

  const openAdminApprove = (room) => {
    const ra = avail.find(a => a.roomId === room.id);
    setApForm({ price: Math.round((ra?.price || room.basePrice) * 1.12), tier:"Mid", notes:"" });
    setApproveModal(room);
  };

  const submitAdminApprove = () => {
    approveRoom(approveModal.id, parseInt(apForm.price), apForm.tier, apForm.notes, "Admin");
    setApproveModal(null);
  };

  const actionColors = { pitch:T.violet, virtual_tour:T.cyan, visit_scheduled:T.blue, visit_done:T.green, pre_booking:T.gold, retail_approved:T.green, admin_override:T.red, owner_update:T.amber };
  const actionLabels = { pitch:"Pitch",virtual_tour:"Virtual Tour",visit_scheduled:"Visit Sched.",visit_done:"Visit Done",pre_booking:"Pre-Booking",retail_approved:"Retail Approved",admin_override:"Admin Override",owner_update:"Owner Updated" };

  return (
    <div className="gp-fade" style={{ minHeight:"100vh", background:T.bg0, fontFamily:T.sans }}>
      <div style={{ padding:"20px", maxWidth:1060, margin:"0 auto" }}>

        {/* Stats grid */}
        <div style={{ display:"flex", gap:9, marginBottom:18, flexWrap:"wrap" }}>
          <StatBox label="Total Rooms"   value={stats.total}     color={T.t0}     sub="All properties" />
          <StatBox label="Locked"        value={stats.locked}    color={T.t2}     sub="No owner update" />
          <StatBox label="Needs Review"  value={stats.available} color={T.amber}  sub="Owner updated" />
          <StatBox label="Live / Sell."  value={stats.approved}  color={T.green}  sub="Retail approved" />
          <StatBox label="Visit Holds"   value={stats.softLock}  color={T.blue}   sub="Soft locked" />
          <StatBox label="Pre-booked"    value={stats.hardLock}  color={T.violet} sub="Hard locked" />
        </div>

        <TabBar tabs={[["overview","Overview"],["rooms","Room Matrix"],["compliance","Owner Compliance"],["overrides","Overrides",overrides.length]]} active={tab} onChange={setTab} />
        <div style={{ height:14 }} />

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(290px, 1fr))", gap:14 }}>
            {/* Pipeline */}
            <Card>
              <div style={{ fontWeight:600, fontSize:14, color:T.t0, marginBottom:14 }}>Inventory Pipeline</div>
              {[["LOCKED", stats.locked, T.t2,"No owner update"],["AVAILABLE",stats.available,T.amber,"Owner updated → needs retail"],["APPROVED",stats.approved,T.green,"Live · sellable now"],["SOFT_LOCKED",stats.softLock,T.blue,"Visit scheduled"],["HARD_LOCKED",stats.hardLock,T.violet,"Pre-booking active"]].map(([s,v,c,d])=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:c, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:T.t0 }}>{s.replace("_"," ")}</div>
                    <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2 }}>{d}</div>
                  </div>
                  <div style={{ fontFamily:T.mono, fontWeight:600, fontSize:16, color:c }}>{v}</div>
                </div>
              ))}
              <Divider />
              <div style={{ height:6, borderRadius:3, background:T.bg3, overflow:"hidden", position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${Math.round((stats.approved/Math.max(stats.total,1))*100)}%`, background:`linear-gradient(90deg,${T.amber},${T.green})`, transition:"width .5s" }} />
              </div>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.t2, marginTop:6 }}>{Math.round((stats.approved/Math.max(stats.total,1))*100)}% live inventory ratio</div>
            </Card>

            {/* Business rules */}
            <Card>
              <div style={{ fontWeight:600, fontSize:14, color:T.t0, marginBottom:14 }}>System Rules · Active</div>
              {[["No owner update → room stays LOCKED","Enforced"],["No retail approval → hidden from sales","Enforced"],["Visit scheduled → room auto SOFT_LOCKED","Enforced"],["Pre-booking → HARD_LOCKED, no pitches","Enforced"],["Admin override → logged to all stakeholders","Enforced"],["Every action tied to a room_id","Enforced"],["No silent backdoors at any role level","Enforced"]].map(([r,s])=>(
                <div key={r} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:9 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:T.green, marginTop:5, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:12, color:T.t0 }}>{r}</div>
                    <div style={{ fontFamily:T.mono, fontSize:10, color:T.green }}>{s}</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Recent activity */}
            <Card>
              <div style={{ fontWeight:600, fontSize:14, color:T.t0, marginBottom:14 }}>Recent Activity</div>
              {actions.slice(0,8).map(a => {
                const room = rooms.find(r => r.id === a.roomId);
                const col = actionColors[a.type] || T.t2;
                return (
                  <div key={a.id} style={{ display:"flex", gap:8, marginBottom:9 }}>
                    <div style={{ width:4, background:col, borderRadius:2, flexShrink:0, alignSelf:"stretch", minHeight:28 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:T.t0 }}>{a.note.length > 55 ? a.note.slice(0,55)+"…" : a.note}</div>
                      <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2, marginTop:1 }}>Room {room?.num} · {a.ts}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* ── ROOM MATRIX ── */}
        {tab === "rooms" && (
          <Card style={{ padding:0, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:T.mono, fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.line}`, background:T.bg3 }}>
                    {["Room","Property","Type","State","W.Price","R.Price","Tier","Approved By","Pitches","Actions"].map(h=>(
                      <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:10, color:T.t2, fontWeight:600, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => {
                    const prop = props.find(p => p.id === room.propId);
                    const ra   = avail.find(a => a.roomId === room.id);
                    const rr   = retail.find(r => r.roomId === room.id);
                    const st   = getRoomState(room.id);
                    const pitchCount = actions.filter(a => a.roomId === room.id && a.type === "pitch").length;
                    return (
                      <tr key={room.id} style={{ borderBottom:`1px solid ${T.line}` }}>
                        <td style={{ padding:"9px 12px", fontFamily:T.mono, fontWeight:600, color:T.t0 }}>{room.num}</td>
                        <td style={{ padding:"9px 12px", color:T.t1, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{prop?.name}</td>
                        <td style={{ padding:"9px 12px", color:T.t1 }}>{room.type}</td>
                        <td style={{ padding:"9px 12px" }}><Tag state={st} /></td>
                        <td style={{ padding:"9px 12px", color:T.t1 }}>{ra ? `₹${ra.price.toLocaleString()}` : <span style={{color:T.t3}}>—</span>}</td>
                        <td style={{ padding:"9px 12px", color:rr?.retailPrice ? T.gold : T.t3 }}>{rr?.retailPrice ? `₹${rr.retailPrice.toLocaleString()}` : "—"}</td>
                        <td style={{ padding:"9px 12px" }}>{rr?.tier ? <Chip label={rr.tier} color={T.amber} /> : <span style={{color:T.t3}}>—</span>}</td>
                        <td style={{ padding:"9px 12px", color:T.t2 }}>{rr?.approvedBy || "—"}</td>
                        <td style={{ padding:"9px 12px", color:pitchCount > 5 ? T.violet : T.t1 }}>{pitchCount}</td>
                        <td style={{ padding:"9px 12px" }}>
                          <div style={{ display:"flex", gap:5 }}>
                            {st === "AVAILABLE" && <button onClick={()=>openAdminApprove(room)} style={{ background:T.greenD, border:`1px solid ${T.greenB}`, color:T.green, borderRadius:4, padding:"3px 8px", fontSize:10, cursor:"pointer", fontFamily:T.sans }}>Approve</button>}
                            <button onClick={()=>{setOvForm({newStatus:"APPROVED",reason:""});setOverrideModal(room)}} style={{ background:T.redD, border:`1px solid ${T.redB}`, color:T.red, borderRadius:4, padding:"3px 8px", fontSize:10, cursor:"pointer", fontFamily:T.sans }}>Override</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── COMPLIANCE ── */}
        {tab === "compliance" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Card style={{ background:T.amberD, borderColor:T.amberB, marginBottom:4 }}>
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.amber, lineHeight:1.7 }}>
                Owner Compliance = % of rooms with active availability update.<br/>
                Below 80% = proactive chase required. Below 50% = system intervention.
              </div>
            </Card>
            {complianceScores.map(o => {
              const scoreColor = o.score >= 80 ? T.green : o.score >= 50 ? T.amber : T.red;
              const oProps = props.filter(p => p.ownerId === o.id);
              return (
                <Card key={o.id} style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                  <Avatar name={o.name} size={48} />
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontWeight:600, fontSize:15, color:T.t0 }}>{o.name}</div>
                    <div style={{ fontFamily:T.mono, fontSize:11, color:T.t1, marginTop:2 }}>{o.area} · {oProps.map(p=>p.name).join(", ")}</div>
                    <div style={{ fontFamily:T.mono, fontSize:11, color:T.t2, marginTop:2 }}>{o.totalRooms} rooms · {o.updated} updated</div>
                  </div>
                  <div style={{ minWidth:180 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontFamily:T.mono, fontSize:11, color:T.t2 }}>{o.updated}/{o.totalRooms} rooms updated</span>
                      <span style={{ fontFamily:T.mono, fontWeight:600, fontSize:16, color:scoreColor }}>{o.score}%</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:T.bg3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${o.score}%`, background:scoreColor, borderRadius:3, transition:"width .5s" }} />
                    </div>
                    <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2, marginTop:4 }}>Last update: {o.lastActivity?.updatedAt || "Never"}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <Chip label={o.score>=80?"Good Standing":o.score>=50?"Needs Follow-up":"Critical"} color={scoreColor} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── OVERRIDES ── */}
        {tab === "overrides" && (
          <div>
            <Card style={{ background:T.redD, borderColor:T.redB, marginBottom:12 }}>
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.red, lineHeight:1.7 }}>
                Every override is permanently logged. No silent changes. Visible to all stakeholders.<br/>
                This is by design — trust requires full transparency at the admin level.
              </div>
            </Card>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {overrides.map(ov => {
                const room = rooms.find(r => r.id === ov.roomId);
                const prop = props.find(p => p.id === room?.propId);
                return (
                  <Card key={ov.id}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div style={{ width:4, background:T.red, borderRadius:2, alignSelf:"stretch", flexShrink:0, minHeight:40 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                          <Chip label="Admin Override" color={T.red} />
                          <span style={{ fontFamily:T.mono, fontSize:10, color:T.t2 }}>{prop?.name} · Room {room?.num}</span>
                        </div>
                        <div style={{ fontWeight:600, fontSize:13, color:T.t0 }}>{ov.action}</div>
                        <div style={{ fontSize:12, color:T.t2, marginTop:3 }}>Reason: {ov.reason}</div>
                      </div>
                      <div style={{ fontFamily:T.mono, fontSize:10, color:T.t2, textAlign:"right" }}>
                        <div style={{ color:T.t1 }}>{ov.ts}</div>
                        <div style={{ marginTop:2 }}>{ov.by}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── OVERRIDE MODAL ── */}
      {overrideModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:998, padding:20 }} onClick={e=>e.target===e.currentTarget&&setOverrideModal(null)}>
          <div className="gp-fade" style={{ background:T.bg2, border:`1px solid ${T.redB}`, borderRadius:12, padding:"24px 22px", width:"100%", maxWidth:400 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.red, letterSpacing:"0.1em", marginBottom:4 }}>ADMIN OVERRIDE · WILL BE LOGGED</div>
            <div style={{ fontWeight:700, fontSize:18, color:T.t0, marginBottom:18 }}>Room {overrideModal.num}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <Label>Force New State</Label>
                <Select value={ovForm.newStatus} onChange={e=>setOvForm({...ovForm,newStatus:e.target.value})}>
                  {Object.keys(ROOM_STATES).map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
                </Select>
              </div>
              <div>
                <Label>Reason (mandatory — will be logged)</Label>
                <Textarea value={ovForm.reason} onChange={e=>setOvForm({...ovForm,reason:e.target.value})} placeholder="Why is this override necessary?" rows={3} />
              </div>
            </div>
            <Card style={{ background:T.redD, borderColor:T.redB, marginTop:14 }}>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.red }}>This override will be visible to the owner, sales team, and permanently stored in the audit log.</div>
            </Card>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <Btn onClick={()=>setOverrideModal(null)} style={{ flex:1 }}>Cancel</Btn>
              <Btn onClick={submitOverride} variant="red" style={{ flex:2, fontWeight:700 }} disabled={!ovForm.reason}>Apply Override</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN APPROVE MODAL ── */}
      {approveModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:998, padding:20 }} onClick={e=>e.target===e.currentTarget&&setApproveModal(null)}>
          <div className="gp-fade" style={{ background:T.bg2, border:`1px solid ${T.lineH}`, borderRadius:12, padding:"24px 22px", width:"100%", maxWidth:380 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.green, letterSpacing:"0.1em", marginBottom:4 }}>RETAIL APPROVAL · ADMIN</div>
            <div style={{ fontWeight:700, fontSize:18, color:T.t0, marginBottom:16 }}>Room {approveModal.num}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <Label>Retail Price</Label>
                <Input type="number" value={apForm.price} onChange={e=>setApForm({...apForm,price:e.target.value})} placeholder="Retail price" />
              </div>
              <div>
                <Label>Tier</Label>
                <div style={{ display:"flex", gap:6 }}>
                  {["Budget","Mid","Premium"].map(t=><button key={t} onClick={()=>setApForm({...apForm,tier:t})} style={{ flex:1, background:apForm.tier===t?T.amberD:T.bg3, border:`1px solid ${apForm.tier===t?T.amberB:T.line}`, borderRadius:7, padding:"8px 0", fontSize:12, color:apForm.tier===t?T.amber:T.t1, cursor:"pointer", fontFamily:T.sans }}>{t}</button>)}
                </div>
              </div>
              <div>
                <Label>Brand Notes</Label>
                <Textarea value={apForm.notes} onChange={e=>setApForm({...apForm,notes:e.target.value})} placeholder="Sales talking points..." rows={2} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <Btn onClick={()=>setApproveModal(null)} style={{ flex:1 }}>Cancel</Btn>
              <Btn onClick={submitAdminApprove} variant="green" style={{ flex:2, fontWeight:700 }} disabled={!apForm.price}>Approve</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const data = useGharpayy();

  const login  = (r, owner) => { setRole(r); setUser(owner); };
  const logout = () => { setRole(null); setUser(null); };

  const userNames = { owner: user?.name, sales:"Sales Team", admin:"Admin" };

  return (
    <div style={{ fontFamily:T.sans, background:T.bg0, minHeight:"100vh", color:T.t0 }}>
      <Fonts />
      {!role && <Login onLogin={login} />}
      {role && (
        <>
          <TopBar role={role} userName={userNames[role]} onSwitch={logout} />
          {role === "owner" && <OwnerPortal owner={user || OWNERS_DATA[0]} data={data} />}
          {role === "sales" && <SalesPortal data={data} />}
          {role === "admin" && <AdminPortal data={data} />}
          <Toasts items={data.notifications} />
        </>
      )}
    </div>
  );
}
