const fs = require('fs');

function applyFixes() {
  const matchPath = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/matching/page.tsx';
  const invPath = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/inventory/page.tsx';
  
  let matchCode = fs.readFileSync(matchPath, 'utf8');
  let invCode = fs.readFileSync(invPath, 'utf8');

  // Fix 1: Stop fallback brochures
  const fallbackRegex = /return map\['zone'\] \? `\/brochures\/\$\{map\['zone'\]\}` : `\/brochures\/\$\{Object\.values\(map\)\[0\]\}`;/g;
  matchCode = matchCode.replace(fallbackRegex, 'return null;');
  invCode = invCode.replace(fallbackRegex, 'return null;');

  // Fix 2: Add Amenities and Safety to Matching Card Drawer
  // Let's locate the House Rules block
  const searchStr = `          {pg.houseRules && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 8, color: '#111827', fontWeight: 900, marginBottom: 4 }}>HOUSE RULES</div>
              <div style={{ fontSize: 11, color: T.t1, fontWeight: 700, textTransform: 'uppercase' }}>{pg.houseRules}</div>
            </div>
          )}`;
  
  const injectStr = searchStr + `
          {pg.amenities && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {pg.amenities.slice(0, 12).map((a: any) => <span key={a} style={{ background: '#fff', border: \`1.5px solid #000\`, color: '#000', fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontSize: 9 }}>{a}</span>)}
              {(pg.commonAreas || []).map((a: any) => <span key={a} style={{ background: T.amberD, border: \`1.5px solid \${T.amber}\`, color: T.amber, fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontSize: 9 }}>🏠 {a}</span>)}
            </div>
          )}
          {pg.safety && pg.safety.length > 0 && (
             <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {pg.safety.map((s: any) => <span key={s} style={{ background: T.redD, border: \`1.5px solid \${T.red}\`, color: T.red, fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontSize: 9 }}>🛡️ {s}</span>)}
             </div>
          )}`;
  
  // ensure we don't duplicate
  if (!matchCode.includes('pg.amenities.slice')) {
    matchCode = matchCode.replace(searchStr, injectStr);
  }
  
  fs.writeFileSync(matchPath, matchCode);
  fs.writeFileSync(invPath, invCode);
  console.log('Fixed functionality!');
}
applyFixes();
