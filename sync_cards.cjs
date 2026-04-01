const fs = require('fs');

const inventoryPath = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/inventory/page.tsx';
const matchingPath  = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/matching/page.tsx';

// 1. Extract the good PropertyCard logic from Inventory Page
let inventoryCode = fs.readFileSync(inventoryPath, 'utf8');

// Extract STATUS_CFG 
const startStatus = inventoryCode.indexOf('const STATUS_CFG');
const endStatus = inventoryCode.indexOf('};', startStatus) + 2;
const statusCfgCode = inventoryCode.substring(startStatus, endStatus);

// Extract ROOM ROW
const startRoomRow = inventoryCode.indexOf('const RoomRow');
const endRoomRow = inventoryCode.indexOf('};', startRoomRow) + 2;
const roomRowCode = inventoryCode.substring(startRoomRow, endRoomRow);

// Extract PropertyCard function bounds precisely
const startPropInventory = inventoryCode.indexOf('// ─── MAIN PROPERTY CARD ───────────────────────────────');
const endPropInventory = inventoryCode.indexOf('// ─── MAIN PAGE ────────────────────────────────────────');
let newPropertyCard = inventoryCode.slice(startPropInventory, endPropInventory).trim();

// Tweak newPropertyCard for MatchingPage:
newPropertyCard = newPropertyCard.replace(
  /const minPrice = getMinPrice\(pg\);/g,
  `const minPrice = getMinPrice(pg);\n  const matchPercent = lead ? calculateMatchScore(pg, lead) : 100;`
);

// We must also update the PropertyCard parameters to accept 'lead' properly and NOT complain about Room & { state: RoomState } imported incorrectly.
newPropertyCard = newPropertyCard.replace(
  /pgRooms: \(Room & \{ state: RoomState \}\)\[\];/g,
  `pgRooms: any[];\n  lead?: any;\n  onClick?: () => void;` // Replace generic type with 'any[]' to avoid type issue
);

newPropertyCard = newPropertyCard.replace(
  /pgRooms, onScheduleVisit, viewMode = 'grid'/g,
  `pgRooms, onScheduleVisit, onClick, lead, viewMode = 'grid'`
);

// Add the matchPercent UI to Grid mode
newPropertyCard = newPropertyCard.replace(
  /<h3 style=\{\{ fontFamily: T.sans, fontWeight: 800, fontSize: 14, color: '#111827', margin: 0, letterSpacing: '-0.01em' \}\}>\{pg.name.toUpperCase\(\)\}<\/h3>/g,
  `<h3 onClick={() => onClick && onClick()} style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 14, color: '#111827', margin: 0, letterSpacing: '-0.01em', cursor: 'pointer' }}>{pg.name.toUpperCase()}</h3>`
);

// In List view, we need to add the Match Percent Bubble
newPropertyCard = newPropertyCard.replace(
  /\{(\/\*.*?\*\/)?\s*<div style=\{\{ display:\s*'flex', alignItems:\s*'center', gap: 6/g,
  `{lead && (<div style={{ width:38, height:38, borderRadius:8, background: matchPercent >= 80 ? '#22C55E' : matchPercent >= 50 ? '#F59E0B' : '#EF4444', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1.5px solid #000' }}><span style={{ color:'#fff', fontSize:10, fontWeight:900, lineHeight:1 }}>{matchPercent}%</span></div>)}\n            <div style={{ display: 'flex', alignItems: 'center', gap: 6`
);

// In Grid view, add Match Percent
newPropertyCard = newPropertyCard.replace(
  /<span style=\{\{ fontFamily: T.mono, fontSize: 8, color: T.gold, fontWeight: 800, background: T.goldD, padding: '2px 4px', borderRadius: 4 \}\}>\{pg.pid\}<\/span>/g,
  `<span style={{ fontFamily: T.mono, fontSize: 8, color: T.gold, fontWeight: 800, background: T.goldD, padding: '2px 4px', borderRadius: 4 }}>{pg.pid}</span>\n              {lead && (<span style={{ background: matchPercent >= 80 ? '#22C55E' : matchPercent >= 50 ? '#F59E0B' : '#EF4444', color: '#fff', borderRadius: 4, fontSize: 9, fontWeight: 900, padding: '2px 8px', border: '1.5px solid #000' }}>{matchPercent}% MATCH</span>)}`
);


// 2. Overwrite the PropertyCard in Matching Page
let matchingCode = fs.readFileSync(matchingPath, 'utf8');

const startPropMatching = matchingCode.indexOf('// ─── PROPERTY CARD ─────────────────────────────────────────────');
const endPropMatching = matchingCode.indexOf('// ─── DETAIL MODAL ──────────────────────────────────────────────');

if (startPropMatching === -1 || endPropMatching === -1) {
  console.log("Could not find matching page boundaries");
  process.exit(1);
}

// Prepare injection payload
const injection = \`
// ─── ROOM ROW ─────────────────────────────────────────
\${statusCfgCode}

\${roomRowCode}

\${newPropertyCard}

\`;

matchingCode = matchingCode.substring(0, startPropMatching) + injection + matchingCode.substring(endPropMatching);

// 3. Inject Imports if missing
if (!matchingCode.includes('import { useRoomStore')) {
  matchingCode = matchingCode.replace(
    \`import { T, GlobalStyles, Card, Btn, Label } from '@/components/Gharpayy3X';\`,
    \`import { T, GlobalStyles, Card, Btn, Label } from '@/components/Gharpayy3X';\\nimport { useRoomStore, type RoomState } from '@/hooks/useInventoryStore';\\nimport { getRoomsForPG, type Room } from '@/data/roomMasterData';\`
  );
}

if (!matchingCode.includes('ChevronUp')) {
  matchingCode = matchingCode.replace('ChevronDown, List', 'ChevronDown, ChevronUp, Users, List');
}

// 4. Inject getRoom hook into MatchingPage
const matchingPageStart = matchingCode.indexOf('export default function MatchingPage() {');
if (!matchingCode.substring(matchingPageStart, matchingPageStart + 500).includes('const { getRoom }')) {
  matchingCode = matchingCode.replace(
    \`export default function MatchingPage() {\\n  const { data: leads } = useLeads();\`,
    \`export default function MatchingPage() {\\n  const { getRoom } = useRoomStore();\\n  const { data: leads } = useLeads();\`
  );
}

// 5. Update PropertyCard Instantiation
matchingCode = matchingCode.replace(
  /<PropertyCard key=\\{\`\\\$\{p.source\}-\\\$\{p.id \|\| idx\}-\\\$\{idx\}\`} p=\{p\} idx=\{idx\} onClick=\{\(\) => setSelectedProfile\(p\)\} onScheduleVisit=\{handleScheduleVisit\} lead=\{parsedLead\} viewMode=\{viewMode\} \\/>/g,
  \`<PropertyCard key={\\\`\\\${p.source}-\\\${p.id || idx}-\\\${idx}\\\`} pg={p} idx={idx} onClick={() => setSelectedProfile(p)} onScheduleVisit={() => handleScheduleVisit(p)} lead={parsedLead} viewMode={viewMode} pgRooms={getRoomsForPG(p.id).map((r: any) => ({ ...r, state: getRoom(r) }))} />\`
);

// Save it back
fs.writeFileSync(matchingPath, matchingCode);
console.log("Successfully cloned Inventory style to Matching cards.");
