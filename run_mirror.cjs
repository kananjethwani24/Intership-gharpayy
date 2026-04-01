const fs = require('fs');

const tp = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/matching/page.tsx';
let txt = fs.readFileSync(tp, 'utf8');

// 1. Add imported utilities
if (!txt.includes("import { useRoomStore")) {
  txt = txt.replace(
    /import brochureMap from '@\/data\/brochureMap\.json';/,
    `import brochureMap from '@/data/brochureMap.json';\nimport { useRoomStore, type VisitData, type RoomState } from '@/hooks/useInventoryStore';\nimport { ROOM_MASTER, getRoomsForPG, type Room } from '@/data/roomMasterData';`
  );
}

if (!txt.includes("ChevronUp")) {
  txt = txt.replace("ChevronDown, List", "ChevronDown, ChevronUp, Users, List");
}

// 2. Add hook to MatchingPage
if (!txt.includes("const { getRoom } = useRoomStore();")) {
  txt = txt.replace(
    `export default function MatchingPage() {\n  const { data: leads }`,
    `export default function MatchingPage() {\n  const { getRoom } = useRoomStore();\n  const { data: leads }`
  );
}

// 3. Update instantiation
txt = txt.replace(
  /<PropertyCard key=\{`\$\{p\.source\}\-\$\{p\.id \|\| idx\}\-\$\{idx\}`\} p=\{p\} idx=\{idx\} onClick=\{\(\) => setSelectedProfile\(p\)\} onScheduleVisit=\{handleScheduleVisit\} lead=\{parsedLead\} viewMode=\{viewMode\} \/>/g,
  `<PropertyCard key={\`\${p.source}-\${p.id || idx}-\${idx}\`} pg={p} idx={idx} onClick={() => setSelectedProfile(p)} onScheduleVisit={() => handleScheduleVisit(p)} lead={parsedLead} viewMode={viewMode} pgRooms={getRoomsForPG(p.id).map(r => ({ ...r, state: getRoom(r) }))} />`
);

// 4. Overwrite PropertyCard completely
const targetCard = `
// ─── STATUS CFG AND ROOM ROW ───────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  LOCKED:      { label: 'Live',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   dot: '#22C55E' },
  AVAILABLE:   { label: 'Live',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   dot: '#22C55E' },
  APPROVED:    { label: 'Live',       color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   dot: '#22C55E' },
  SOFT_LOCKED: { label: 'Tour Hold', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',   dot: '#60A5FA' },
  HARD_LOCKED: { label: 'Pre-Booked',color: '#A78BFA', bg: 'rgba(167,139,250,0.1)',  dot: '#A78BFA' },
  OCCUPIED:    { label: 'Occupied',   color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   dot: '#EF4444' },
};

const RoomRow = ({ room, state }: { room: Room; state: RoomState }) => {
  const cfg = STATUS_CFG[state.status] || STATUS_CFG.LOCKED;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, marginBottom: 4 }}>
      <div style={{ width: 28, height: 28, borderRadius: 5, background: T.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', border: \`1px solid \${T.line}\`, fontFamily: T.mono, fontSize: 10, color: T.t0, fontWeight: 700 }}>{room.num}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.t0, fontWeight: 600 }}>{room.type}</div>
      </div>
      <div style={{ background: cfg.bg, borderRadius: 3, padding: '1px 4px', border: \`1px solid \${cfg.color}20\` }}>
        <span style={{ fontFamily: T.mono, fontSize: 7, color: cfg.color, fontWeight: 700 }}>{cfg.label.toUpperCase()}</span>
      </div>
      <div style={{ textAlign: 'right', minWidth: 60 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.t1, fontWeight: 700 }}>₹{(state.retailPrice || state.expectedRent || room.basePrice).toLocaleString()}</div>
      </div>
    </div>
  );
};

// ─── MAIN PROPERTY CARD ───────────────────────────────
const PropertyCard = ({
  pg, idx, pgRooms, onScheduleVisit, onClick, lead, viewMode = 'grid'
}: {
  pg: PGEntry;
  idx: number;
  pgRooms: (Room & { state: RoomState })[];
  onScheduleVisit: () => void;
  onClick?: () => void;
  lead?: any;
  viewMode?: 'grid' | 'list';
}) => {
  const [expanded, setExpanded]           = useState(false);
  const [roomsExpanded, setRoomsExpanded]   = useState(false);
  const [copiedWA, setCopiedWA]             = useState(false);
  const [copiedMap, setCopiedMap]           = useState(false);
  
  const minPrice = getMinPrice(pg);
  const matchPercent = lead ? calculateMatchScore(pg, lead) : 100;

  const genderConfig = pg.gender?.toLowerCase().includes('girl') || pg.gender?.toLowerCase().includes('female')
    ? { color: '#EC4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.22)', label: 'Girls' }
    : pg.gender?.toLowerCase().includes('boy') || pg.gender?.toLowerCase().includes('male')
      ? { color: T.blue, bg: T.blueD, border: T.blueB, label: 'Boys' }
      : { color: T.t1, bg: T.bg3, border: T.line, label: 'coed' };

  const copyWA = (e: React.MouseEvent) => {
    e.stopPropagation();
    const t_was = pg.triplePrice ? Math.round((pg.triplePrice + 2000)/1000) : 15;
    const t_now = pg.triplePrice ? Math.round(pg.triplePrice/1000) : 13;
    const d_was = pg.doublePrice ? Math.round((pg.doublePrice + 2000)/1000) : 18;
    const d_now = pg.doublePrice ? Math.round(pg.doublePrice/1000) : 16;
    const s_was = pg.singlePrice ? Math.round((pg.singlePrice + 2000)/1000) : 27;
    const s_now = pg.singlePrice ? Math.round(pg.singlePrice/1000) : 23;

    const msg = \`⚡️ Welcome to Gharpayy \${pg.name.toUpperCase()} - \${(pg.gender || 'COED').toUpperCase()}! ⚡️ ❤️ We're thrilled you loved our rooms.🚀 *Exclusive Offer Alert:* **2K OFF MONTHLY** \\n\\n\` +
      \`🧡Triple Sharing. - ~Was \${t_was}K~, **now only \${t_now}k!*\\n\` +
      \`💛Dual Sharing. - ~Originally \${d_was}K~, **now just \${d_now}K!*\\n\` +
      \`❤️Private rooms - ~Formerly \${s_was}k~, **now specially priced at \${s_now}K!*\\n\\n\` +
      \`💥 Act Fast: Lock in your reservation NOW and save 2000+ RS every month on a 12-month stay! *Offer expires in 4 hours. *Prebook* now for just 20k!*🔥   enjoy complimentary good food.\`;

    navigator.clipboard.writeText(msg);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2000);
    toast.success('Exclusive Offer Message Copied! ⚡️');
  };

  const copyMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = pg.mapsLink || \`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent((pg.name || '') + ' ' + (pg.locality || pg.area || '') + ' Bangalore')}\`;
    const pName = pg.name.toUpperCase();
    const displayName = pName.startsWith('GHARPAYY') ? pName : \`GHARPAYY \${pName}\`;
    const msg = \`📍 \${displayName}\\n\` +
      \`🚀 Attention: Pre-Booking Required! _enjoy a seamless experience upon arrival!_\\n\\n\` +
      \`🎯 DESTINATION \${link} |\\n\\n\` +
      \`Secure your spot before you regret it! See you soon in Bangalore! ✨ 🚀\`;
    navigator.clipboard.writeText(msg);
    setCopiedMap(true);
    setTimeout(() => setCopiedMap(false), 2000);
    toast.success('Location Message copied! 📍');
  };

  const isList = viewMode === 'list';

  return (
    <div className={\`gp-card \${isList ? 'inventory-list-card' : ''}\`} style={{ 
      background: T.bg2, 
      border: \`1px solid \${T.line}\`, 
      borderRadius: 12, 
      overflow: 'hidden', 
      height: 'fit-content',
      transition: 'all 0.2s'
    }}>
      
      {/* Small Header */}
      <div style={{ padding: '14px 16px', flex: isList ? '1' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isList && lead && (<div style={{ width:38, height:38, borderRadius:8, background: matchPercent >= 80 ? '#22C55E' : matchPercent >= 50 ? '#F59E0B' : '#EF4444', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1.5px solid #000', marginRight: 10 }}><span style={{ color:'#fff', fontSize:10, fontWeight:900, lineHeight:1 }}>{matchPercent}%</span></div>)}
              <h3 onClick={onClick} style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 14, color: '#111827', margin: 0, letterSpacing: '-0.01em', cursor: 'pointer' }}>{pg.name.toUpperCase()}</h3>
              <span style={{ fontFamily: T.mono, fontSize: 8, color: T.gold, fontWeight: 800, background: T.goldD, padding: '2px 4px', borderRadius: 4 }}>{pg.pid}</span>
              {!isList && lead && (<span style={{ background: matchPercent >= 80 ? '#22C55E' : matchPercent >= 50 ? '#F59E0B' : '#EF4444', color: '#fff', borderRadius: 4, fontSize: 9, fontWeight: 900, padding: '2px 8px', border: '1.5px solid #000' }}>{matchPercent}% MATCH</span>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={10} style={{ color: T.t2 }} />
              <span style={{ fontFamily: T.mono, fontSize: 9, color: T.t2, fontWeight: 600 }}>{pg.area}</span>
              {pg.landmarks && <span style={{ fontFamily: T.mono, fontSize: 8, color: T.t2, marginLeft: 6 }}>• {pg.landmarks}</span>}
            </div>
          </div>
            {!isList && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: T.gold, fontWeight: 900, fontSize: 13, textTransform: 'uppercase' }}>{formatPrice(minPrice)}</div>
                <div style={{ fontFamily: T.mono, fontSize: 8, color: T.t2, fontWeight: 700, marginTop: 2 }}>
                  {[
                    pg.triplePrice && pg.triplePrice > 0 ? \`T:₹\${Math.round(pg.triplePrice/1000)}k\` : null,
                    pg.doublePrice && pg.doublePrice > 0 ? \`D:₹\${Math.round(pg.doublePrice/1000)}k\` : null,
                    pg.singlePrice && pg.singlePrice > 0 ? \`S:₹\${Math.round(pg.singlePrice/1000)}k\` : null,
                  ].filter(Boolean).join(' ')}
                </div>
              </div>
            )}
          </div>
  
          {/* Essential Badges Only */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
            <span style={{ background: genderConfig.bg, color: genderConfig.color, border: \`1px solid \${genderConfig.border}\`, borderRadius: 6, fontFamily: T.mono, fontSize: 8, fontWeight: 800, padding: '2px 8px' }}>
              {genderConfig.label.toUpperCase()}
            </span>
            {pg.propertyType && <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 6, fontFamily: T.mono, fontSize: 8, fontWeight: 800, padding: '2px 8px' }}>{pg.propertyType.toUpperCase()}</span>}
            
            {/* Inventory Status Badges */}
            {pgRooms && pgRooms.some(r => r.state.status === 'APPROVED') && <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 6, fontFamily: T.mono, fontSize: 8, fontWeight: 800, padding: '2px 8px' }}>LIVE</span>}
            {pgRooms && pgRooms.some(r => r.state.status === 'SOFT_LOCKED') && <span style={{ background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 6, fontFamily: T.mono, fontSize: 8, fontWeight: 800, padding: '2px 8px' }}>BOOKED</span>}
            {pg.managerContact && <span style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 6, fontFamily: T.mono, fontSize: 8, fontWeight: 800, padding: '2px 8px' }}>MGR: {pg.managerContact}</span>}
          </div>
        </div>
  
        {isList && (
          <div className="list-price-panel" style={{ width: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: \`1px solid \${T.line}\`, padding: '0 12px', background: '#fff' }}>
            <div style={{ color: T.gold, fontWeight: 900, fontSize: 13 }}>{formatPrice(minPrice)}</div>
            <div style={{ fontFamily: T.mono, fontSize: 8, color: T.t2, fontWeight: 700, marginTop: 2 }}>
              {[
                pg.triplePrice && pg.triplePrice > 0 ? \`T:₹\${Math.round(pg.triplePrice/1000)}k\` : null,
                pg.doublePrice && pg.doublePrice > 0 ? \`D:₹\${Math.round(pg.doublePrice/1000)}k\` : null,
                pg.singlePrice && pg.singlePrice > 0 ? \`S:₹\${Math.round(pg.singlePrice/1000)}k\` : null,
              ].filter(Boolean).join(' ')}
            </div>
          </div>
        )}

      {/* ── ROOMS DRAWER (Collapsible) - Hide in List View initially to keep it clean */}
      {!isList && pgRooms && pgRooms.length > 0 && (
        <div style={{ borderTop: \`1px solid \${T.line}\` }}>
          <button onClick={() => setRoomsExpanded(!roomsExpanded)}
            style={{ width: '100%', background: roomsExpanded ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: roomsExpanded ? \`1px solid \${T.line}\` : 'none', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#111827', fontFamily: T.mono, fontSize: 9 }}>
            <span style={{ fontWeight: 900 }}>ROOM INVENTORY ({pgRooms.filter(r => r.state && r.state.status !== 'LOCKED').length})</span>
            {roomsExpanded ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
          </button>
          {roomsExpanded && (
            <div style={{ padding: '8px 12px' }}>
              {pgRooms.map(r => <RoomRow key={r.id} room={r} state={r.state} />)}
            </div>
          )}
        </div>
      )}

      {/* compact Actions */}
      <div style={{ 
        padding: '12px 16px', 
        display: 'flex', 
        gap: 8, 
        borderTop: isList ? 'none' : \`1px solid \${T.line}\`,
        borderLeft: isList ? \`1px solid \${T.line}\` : 'none',
        width: isList ? 'auto' : '100%',
        alignItems: 'center',
        background: '#fff'
      }}>
        <button onClick={onScheduleVisit}
          style={{ flex: isList ? 'none' : 2, background: '#fff', border: \`1.5px solid #000\`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#000', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '1px 1px 0 #000' }}>
          <Calendar size={13} strokeWidth={3} /> TOUR
        </button>
        
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); const url = getBrochureUrl(pg.name); if(url) window.open(url, '_blank'); }} title="Download Brochure"
            style={{ background: '#fff', border: \`1.5px solid #000\`, borderRadius: 8, padding: '10px', display: 'flex', alignItems: 'center', color: '#000', cursor: 'pointer', boxShadow: '1px 1px 0 #000' }}>
            <FileText size={14} strokeWidth={3} />
          </button>
          <button onClick={copyWA} title="Copy WhatsApp Offer"
            style={{ background: '#fff', border: \`1.5px solid #000\`, borderRadius: 8, padding: '10px', display: 'flex', alignItems: 'center', color: copiedWA ? '#16A34A' : '#000', cursor: 'pointer', boxShadow: '1px 1px 0 #000' }}>
            {copiedWA ? <Check size={14} strokeWidth={3} /> : <DollarSign size={14} strokeWidth={3} />}
          </button>
          
          <button onClick={copyMap} title="Copy Map Location"
            style={{ background: '#fff', border: \`1.5px solid #000\`, borderRadius: 8, padding: '10px', display: 'flex', alignItems: 'center', color: copiedMap ? '#16A34A' : '#000', cursor: 'pointer', boxShadow: '1px 1px 0 #000' }}>
            {copiedMap ? <Check size={14} strokeWidth={3} /> : <MapPin size={14} strokeWidth={3} />}
          </button>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          style={{ flex: isList ? 'none' : 1, width: isList ? 'auto' : 'auto', background: 'none', border: 'none', padding: '8px', fontSize: 11, color: T.t2, fontWeight: 600, cursor: 'pointer' }}>
          {expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      {/* Details Drawer */}
      {expanded && (
        <div style={{ borderTop: \`1px solid \${T.line}\`, padding: '16px 14px', background: T.bg3, animation: 'fadeIn 0.2s', width: isList ? '100%' : 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            <div><div style={{ fontFamily: T.mono, fontSize: 8, color: '#111827', fontWeight: 900, marginBottom: 2 }}>DEPOSIT</div><div style={{ fontSize: 10, color: T.t1 }}>{pg.deposit || '—'}</div></div>
            <div><div style={{ fontFamily: T.mono, fontSize: 8, color: '#111827', fontWeight: 900, marginBottom: 2 }}>MIN STAY</div><div style={{ fontSize: 10, color: T.t1 }}>{pg.minStay || '—'}</div></div>
            <div><div style={{ fontFamily: T.mono, fontSize: 8, color: '#111827', fontWeight: 900, marginBottom: 2 }}>MEALS</div><div style={{ fontSize: 10, color: T.t1 }}>{pg.meals || '—'}</div></div>
          </div>
          {pg.vibe && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 8, color: '#111827', fontWeight: 900, marginBottom: 4 }}>BRAND VIBE</div>
              <div style={{ fontSize: 11, color: T.t1, lineHeight: 1.5 }}>{pg.vibe}</div>
            </div>
          )}
          {pg.houseRules && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 8, color: '#111827', fontWeight: 900, marginBottom: 4 }}>HOUSE RULES</div>
              <div style={{ fontSize: 11, color: T.t1, fontWeight: 700, textTransform: 'uppercase' }}>{pg.houseRules}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
`

const startPos = txt.indexOf('// ─── PROPERTY CARD ─────────────────────────────────────────────');
const endPos = txt.indexOf('// ─── DETAIL MODAL ──────────────────────────────────────────────');

if (startPos > -1 && endPos > -1) {
  txt = txt.substring(0, startPos) + targetCard + '\\n' + txt.substring(endPos);
  fs.writeFileSync(tp, txt);
  console.log("Successfully replaced property card block!");
} else {
  console.error("Could not find boundaries!");
}
