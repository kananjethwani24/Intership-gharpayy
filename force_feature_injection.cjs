const fs = require('fs');
const path = 'app/inventory/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// The new PropertyDialog with Auto-Marketing Hub + Sharing
const newDialog = `
// Re-integrated and cleaned up Dialog
function PropertyDialog({ selectedProperty, onClose }: { selectedProperty: any, onClose: () => void }) {
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = require('@tanstack/react-query').useQueryClient();

  if (!selectedProperty) return null;

  const roomEntries = parseRoomEntries(selectedProperty.price, selectedProperty.lows, selectedProperty.priceMin, selectedProperty.priceMax);
  const brochureData = selectedProperty.brochurePdf || "";
  const hasPdf = brochureData.length > 50;

  const uploadPdf = async (file) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch('/api/iq-properties/upload-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedProperty._id, pdfBase64: reader.result }),
      });
      if (res.ok) {
        require('sonner').toast.success('Brochure attached');
        queryClient.invalidateQueries({ queryKey: ['iq-properties'] });
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const updateField = (f, v) => {
    fetch('/api/iq-properties/update-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedProperty._id, field: f, value: v }),
    }).then(() => queryClient.invalidateQueries({ queryKey: ['iq-properties'] }));
  };

  return (
    <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-[2rem] gap-0">
        <DialogTitle className="sr-only">Property Details</DialogTitle>
        <div className="bg-white overflow-hidden flex flex-col">
          {/* Header section */}
          <div className="bg-slate-900 px-8 py-10 relative">
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                   <Badge className="bg-white/10 text-white border-white/20 px-3 hover:bg-white/20 transition-colors uppercase tracking-widest text-[10px]">
                     {selectedProperty.zone || getZoneByArea(selectedProperty.area).zone}
                   </Badge>
                </div>
                <h2 className="text-3xl font-display font-black text-white leading-tight">{selectedProperty.name}</h2>
                <p className="text-slate-400 flex items-center gap-2 text-sm">
                  <MapPin size={14} /> {selectedProperty.area}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Primary Details (8 Cols) */}
            <div className="md:col-span-8 space-y-10">
              
              {/* Room Pricing Grid */}
              <section className="space-y-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Bed size={14} className="text-slate-900" /> Availability & Pricing
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {roomEntries.map((entry, idx) => (
                      <div key={idx} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{entry.label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-slate-900">₹{entry.price.toLocaleString()}</span>
                        </div>
                      </div>
                   ))}
                 </div>
              </section>

              {/* Geo Intelligence */}
              <GeoIntelligencePanel p={selectedProperty} />
            </div>

            {/* Sticky/Side Info (4 Cols) */}
            <div className="md:col-span-4 space-y-8">
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth & Marketing</p>
                  <div className="space-y-4">
                      {/* Auto-Generating Promo Message From Excel Data */}
                      {(() => {
                        const propName = selectedProperty.name || 'Gharpayy Property';
                        const rows = roomEntries.map(e => \`\${e.label} - *now only \${Math.round(e.price/1000)}k!*\`).join('\\n');
                        const promoTemplate = \`⚡️ Welcome to Gharpayy \${propName}! ❤️\\n\\n\${rows}\\n\\n💥 Lock in your spot NOW! 🔥\`;
                        const finalPromo = selectedProperty.whatsappPromo || promoTemplate;
                        return (
                          <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 shadow-sm">
                            <p className=\"text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-2\"><Zap size={10} fill=\"currentColor\" /> Marketing Promo</p>
                            <p className=\"text-[11px] font-bold text-slate-700 leading-relaxed bg-white/60 p-3 rounded-xl border border-white line-clamp-6 select-all whitespace-pre-line\">{finalPromo}</p>
                            <Button className=\"h-9 w-full mt-2 bg-green-500 hover:bg-green-600 text-[10px] font-black uppercase rounded-lg shadow-sm\" onClick={() => { navigator.clipboard.writeText(finalPromo); require('sonner').toast.success(\"Promo copied! 🚀\"); }}>Copy Text</Button>
                          </div>
                        );
                      })()}

                      {/* Video & Maps Icons */}
                      <div className=\"grid grid-cols-2 gap-2\">
                         {selectedProperty.videosLink ? (
                           <a href={selectedProperty.videosLink} target=\"_blank\" rel=\"noopener noreferrer\" className=\"flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 h-14 hover:bg-white\">
                              <div className=\"w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center\"><Film size={16} fill=\"currentColor\" /></div>
                              <span className=\"text-[10px] font-black text-slate-900 uppercase\">YouTube</span>
                           </a>
                         ) : <Button variant=\"ghost\" className=\"h-14 border border-dashed border-slate-200 text-[10px] uppercase font-black text-slate-400\" onClick={() => { const u = prompt(\"YT Link:\"); if (u) updateField('videosLink', u); }}>+ Video</Button>}
                         
                         {selectedProperty.googleMapsLink ? (
                           <a href={selectedProperty.googleMapsLink} target=\"_blank\" rel=\"noopener noreferrer\" className=\"flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 h-14 hover:bg-white\">
                              <div className=\"w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center\"><MapPin size={16} fill=\"currentColor\" /></div>
                              <span className=\"text-[10px] font-black text-slate-900 uppercase\">Map Pin</span>
                           </a>
                         ) : <Button variant=\"ghost\" className=\"h-14 border border-dashed border-slate-200 text-[10px] uppercase font-black text-slate-400\" onClick={() => { const u = prompt(\"Map Link:\"); if (u) updateField('googleMapsLink', u); }}>+ Map</Button>}
                      </div>
                  </div>
               </div>

               <div className=\"space-y-3\">
                  {hasPdf ? (
                    <div className=\"flex items-center gap-2\">
                      <Button className=\"flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg gap-2\" onClick={() => setShowPdfViewer(true)}><FileText size={16} /> View Brochure</Button>
                      <a href={\`https://wa.me/?text=\${encodeURIComponent(\`Hi! Here is the brochure: \${window.location.origin}/api/iq-properties/\${selectedProperty._id}/brochure\`)}\`} target=\"_blank\" rel=\"noopener noreferrer\" className=\"w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-xl\"><X className=\"w-5 h-5 text-white\" \/></a>
                    </div>
                  ) : <Button variant=\"outline\" className=\"w-full h-12 rounded-xl border-slate-200\" onClick={() => uploadPdf()}>Attach Brochure PDF</Button>}
                  <Button variant=\"outline\" className=\"w-full h-12 rounded-xl border-slate-200\" onClick={() => window.open(selectedProperty.photosLink, '_blank')}>View Property Photos</Button>
               </div>
            </div>
          </div>
        </div>
        <PiPViewer isOpen={showPdfViewer && hasPdf} onClose={() => setShowPdfViewer(false)} pdfUrl={brochureData} filename={\`\${selectedProperty.name} Brochure\`} />
      </DialogContent>
    </Dialog>
  );
}`;

c = c.replace(/function PropertyDialog\(\{ selectedProperty, onClose \}: \{ selectedProperty: any, onClose: \(\) => void \}\) \{[\s\S]*?\}\n\}/, newDialog);
fs.writeFileSync(path, c, 'utf8');
console.log('Dialog logic upgraded.');
