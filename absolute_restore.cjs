const fs = require('fs');
const path = 'app/inventory/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const head = lines.slice(0, 375);
const newBody = `
function PropertyDialog({ selectedProperty, onClose }: { selectedProperty: any, onClose: () => void }) {
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  if (!selectedProperty) return null;

  const roomEntries = parseRoomEntries(selectedProperty.price, selectedProperty.lows, selectedProperty.priceMin, selectedProperty.priceMax);
  const brochureData = selectedProperty.brochurePdf || "";
  const hasPdf = brochureData.length > 50;

  const updateField = async (field, value) => {
    try {
      const res = await fetch('/api/iq-properties/update-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedProperty._id, field, value }),
      });
      if (res.ok) queryClient.invalidateQueries({ queryKey: ['iq-properties'] });
    } catch (err) { console.error(err); }
  };

  const uploadPdf = async (file: File) => {
    setIsUploading(true);
    try {
        const reader = new FileReader();
        reader.onload = async () => {
            const res = await fetch('/api/iq-properties/upload-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: selectedProperty._id, pdfBase64: reader.result }),
            });
            if (res.ok) {
                toast.success('Brochure attached');
                queryClient.invalidateQueries({ queryKey: ['iq-properties'] });
            }
        };
        reader.readAsDataURL(file);
    } finally { setIsUploading(false); }
  };

  return (
    <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-[2rem] gap-0">
        <DialogTitle className="sr-only">Property Details</DialogTitle>
        <div className="bg-white overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-8 py-10 relative">
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                   <Badge className="bg-white/10 text-white border-white/20 px-3 hover:bg-white/20 transition-colors uppercase tracking-widest text-[10px]">
                     {selectedProperty.zone || getZoneByArea(selectedProperty.area).zone}
                   </Badge>
                </div>
                <h2 className="text-3xl font-display font-black text-white leading-tight">{selectedProperty.name}</h2>
                <p className="text-slate-400 flex items-center gap-2 text-sm"><MapPin size={14} /> {selectedProperty.area}</p>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-8 space-y-10">
              <section className="space-y-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Bed size={14} className="text-slate-900" /> Availability & Pricing</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {roomEntries.map((entry, idx) => (
                      <div key={idx} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{entry.label}</span>
                        <div className="flex items-baseline gap-1"><span className="text-xl font-black text-slate-900">₹{entry.price.toLocaleString()}</span></div>
                      </div>
                   ))}
                 </div>
              </section>
              <GeoIntelligencePanel p={selectedProperty} />
            </div>

            <div className="md:col-span-4 space-y-8">
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth & Marketing</p>
                  <div className="space-y-4">
                      {(() => {
                        const rows = roomEntries.map(e => \`\${e.label} - *now only \${Math.round(e.price/1000)}k!*\`).join('\\n');
                        const promo = \`⚡️ Welcome to Gharpayy \${selectedProperty.name}! ❤️\\n\\n\${rows}\\n\\n💥 Lock in NOW! 🔥\`;
                        const final = selectedProperty.whatsappPromo || promo;
                        return (
                          <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={10} fill=\"currentColor\" /> Promo Hub</p>
                            <p className="text-[11px] font-bold text-slate-700 leading-relaxed line-clamp-6 select-all whitespace-pre-line bg-white/60 p-3 rounded-xl border border-white">{final}</p>
                            <Button className="h-9 w-full mt-3 bg-green-500 hover:bg-green-600 text-[10px] font-black uppercase rounded-lg shadow-sm" onClick={() => { navigator.clipboard.writeText(final); toast.success(\"Promo copied! 🚀\"); }}>Copy Text</Button>
                          </div>
                        );
                      })()}
                      <div className="grid grid-cols-2 gap-2">
                         {selectedProperty.videosLink ? (
                           <a href={selectedProperty.videosLink} target="_blank" rel=\"noopener noreferrer\" className=\"flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 h-14 hover:bg-white transition-all\">
                              <div className=\"w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center\"><Film size={16} fill=\"currentColor\" /></div>
                              <span className=\"text-[10px] font-black text-slate-900 uppercase\">YouTube</span>
                           </a>
                         ) : <Button variant=\"ghost\" className=\"h-14 border border-dashed border-slate-200 text-[10px] uppercase font-black text-slate-400\" onClick={() => { const u = prompt(\"YT Link:\"); if (u) updateField('videosLink', u); }}>+ Video</Button>}
                         
                         {selectedProperty.googleMapsLink ? (
                           <a href={selectedProperty.googleMapsLink} target=\"_blank\" rel=\"noopener noreferrer\" className=\"flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 h-14 hover:bg-white transition-all\">
                              <div className=\"w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center\"><MapPin size={16} fill=\"currentColor\" /></div>
                              <span className=\"text-[10px] font-black text-slate-900 uppercase\">Map</span>
                           </a>
                         ) : <Button variant=\"ghost\" className=\"h-14 border border-dashed border-slate-200 text-[10px] uppercase font-black text-slate-400\" onClick={() => { const u = prompt(\"Map Link:\"); if (u) updateField('googleMapsLink', u); }}>+ Map Pin</Button>}
                      </div>
                  </div>
               </div>

               <div className=\"space-y-3\">
                  {hasPdf ? (
                    <div className=\"flex items-center gap-2\">
                      <Button className=\"flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg gap-2\" onClick={() => setShowPdfViewer(true)}><FileText size={16} /> View Brochure</Button>
                      <a href={\`https://wa.me/?text=\${encodeURIComponent(\`Hi! Here is the brochure: \${window.location.origin}/api/iq-properties/\${selectedProperty._id}/brochure\`)}\`} target=\"_blank\" rel=\"noopener noreferrer\" className=\"w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform\"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
                    </div>
                  ) : (
                      <div className="relative group/up">
                        <input type="file" accept=".pdf" className="hidden" id="brochure-up" onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])} />
                        <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-red-200 text-red-600 font-bold hover:bg-red-50" onClick={() => document.getElementById('brochure-up').click()}>Attach Brochure PDF</Button>
                      </div>
                  )}
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-slate-200" onClick={() => window.open(selectedProperty.photosLink, '_blank')}>View Property Photos</Button>
               </div>
            </div>
          </div>
        </div>
        <PiPViewer isOpen={showPdfViewer && hasPdf} onClose={() => setShowPdfViewer(false)} pdfUrl={brochureData} filename={\`\${selectedProperty.name} Brochure\`} />
      </DialogContent>
    </Dialog>
  );
}

function TierBadge({ tier, size = 'default' }) {
  const colors = { luxury: 'bg-amber-500 text-white', premium: 'bg-slate-900 text-white', mid: 'bg-slate-400 text-white', budget: 'bg-slate-200 text-slate-600' };
  return <Badge className={\`\${colors[tier] || colors.budget} border-none font-black uppercase \${size === 'tiny' ? 'text-[8px] px-1.5 py-0' : 'text-[10px] px-3 py-0.5'} rounded\`}>{tier}</Badge>;
}

function GeoIntelligencePanel({ p }) {
  const pLat = p.lat || (p.area ? AREA_COORDINATES[p.area]?.lat : null);
  const pLng = p.lng || (p.area ? AREA_COORDINATES[p.area]?.lng : null);
  if (!pLat || !pLng) return null;
  const nearestMetro = BANGALORE_GIS_DATA.filter(l => l.type === 'metro-station').map(s => ({ ...s, dist: haversine(pLat, pLng, s.lat, s.lng) })).sort((a,b) => a.dist-b.dist).slice(0, 2);
  const nearestTechPark = BANGALORE_GIS_DATA.filter(l => l.type === 'tech-park').map(tp => ({ ...tp, dist: haversine(pLat, pLng, tp.lat, tp.lng) })).sort((a,b) => a.dist-b.dist).slice(0, 2);
  return (
    <div className=\"bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 space-y-6\">
      <div className=\"flex items-center gap-2\"><MapIcon className=\"w-4 h-4 text-slate-900\" /><h4 className=\"text-xs font-black text-slate-900 uppercase tracking-widest\">Intelligence</h4></div>
      <div className=\"grid grid-cols-2 gap-6\">
        <div className=\"space-y-3\"><p className=\"text-[9px] font-bold text-slate-400 uppercase tracking-widest\">Metro</p>{nearestMetro.map(s => <div key={s.name} className=\"flex justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm\"><span className=\"text-[10px] font-bold text-slate-700\">{s.name}</span><span className=\"text-[10px] font-black text-slate-900\">{s.dist.toFixed(1)}km</span></div>)}</div>
        <div className=\"space-y-3\"><p className=\"text-[9px] font-bold text-slate-400 uppercase tracking-widest\">Tech Parks</p>{nearestTechPark.map(tp => <div key={tp.name} className=\"flex justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm\"><span className=\"text-[10px] font-bold text-slate-700\">{tp.name}</span><span className=\"text-[10px] font-black text-slate-900\">{tp.dist.toFixed(1)}km</span></div>)}</div>
      </div>
    </div>
  );
}

function PiPViewer({ isOpen, onClose, pdfUrl, filename }) {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className=\"fixed bottom-8 right-8 z-[9999] bg-slate-900 shadow-2xl border border-slate-700/50 flex flex-col rounded-2xl overflow-hidden w-[380px] h-[520px]\">
      <div className=\"flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-white/5\">
        <div className=\"flex items-center gap-2 min-w-0\"><div className=\"w-5 h-5 bg-red-500 rounded flex items-center justify-center\"><FileText size={12} className=\"text-white\" /></div><span className=\"text-[11px] font-black text-white truncate uppercase\">{filename}</span></div>
        <button onClick={onClose} className=\"w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors\"><X size={16} /></button>
      </div>
      <div className=\"flex-1 bg-slate-950\"><iframe src={pdfUrl} className=\"w-full h-full border-none\" title=\"PiP Viewer\" /></div>
    </motion.div>
  );
}
\`;

fs.writeFileSync(path, [...head, newBody].join('\\n'), 'utf8');
console.log('Final construction complete.');
