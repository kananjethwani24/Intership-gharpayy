const fs = require('fs');

function applyButtonFix() {
  const matchPath = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/matching/page.tsx';
  const invPath = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/inventory/page.tsx';
  
  let matchCode = fs.readFileSync(matchPath, 'utf8');
  let invCode = fs.readFileSync(invPath, 'utf8');

  // We wrap the FileText button in both files
  const searchStr = `<button onClick={(e) => { e.stopPropagation(); const url = getBrochureUrl(pg.name); if(url) window.open(url, '_blank'); }} title="Download Brochure"
            style={{ background: '#fff', border: \`1.5px solid #000\`, borderRadius: 8, padding: '10px', display: 'flex', alignItems: 'center', color: '#000', cursor: 'pointer', boxShadow: '1px 1px 0 #000' }}>
            <FileText size={14} strokeWidth={3} />
          </button>`;
          
  const replaceStr = `{getBrochureUrl(pg.name) && (
          <button onClick={(e) => { e.stopPropagation(); window.open(getBrochureUrl(pg.name), '_blank'); }} title="Download Brochure"
            style={{ background: '#fff', border: \`1.5px solid #000\`, borderRadius: 8, padding: '10px', display: 'flex', alignItems: 'center', color: '#000', cursor: 'pointer', boxShadow: '1px 1px 0 #000' }}>
            <FileText size={14} strokeWidth={3} />
          </button>
          )}`;

  if (matchCode.includes(searchStr)) {
     matchCode = matchCode.replace(searchStr, replaceStr);
  }
  if (invCode.includes(searchStr)) {
     invCode = invCode.replace(searchStr, replaceStr);
  }

  // Handle the List View button in matchCode if it exists
  const searchStrListMatch = `<button onClick={(e) => { e.stopPropagation(); const url = getBrochureUrl(p.name); if(url) window.open(url, '_blank'); }} title="Download Brochure"`;
  if (matchCode.includes(searchStrListMatch)) {
     // I will just use regex to target the button
     const regexListBtn = /<button onClick=\{\(e\) => \{ e\.stopPropagation\(\); const url = getBrochureUrl\(p\.name\); if\(url\) window\.open\(url, '_blank'\); \}\} title="Download Brochure"[\s\S]*?<\/button>/;
     const replacementListBtn = `{getBrochureUrl(p.name) && (
          <button onClick={(e) => { e.stopPropagation(); window.open(getBrochureUrl(p.name), '_blank'); }} title="Download Brochure" style={{ background:'#fff', border:'1.5px solid #000', borderRadius:6, padding:'6px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700 }}>
            <FileText size={12} strokeWidth={3} />
          </button>
          )}`;
     matchCode = matchCode.replace(regexListBtn, replacementListBtn);
  }
  
  fs.writeFileSync(matchPath, matchCode);
  fs.writeFileSync(invPath, invCode);
  console.log('Fixed button visibility!');
}
applyButtonFix();
