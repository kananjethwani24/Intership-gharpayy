const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\kanan\\Desktop\\GharPayy Internship\\Gharpayy_Dashboard_Copy\\app\\inventory\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

const newContent = `                       {/* Auto-Generating Promo Message From Excel Data */}
                       {(() => {
                         const propName = selectedProperty.name || 'Gharpayy Property';
                         const gender = (selectedProperty.gender || 'Universal').toUpperCase();
                         const rows = roomEntries.map(e => {
                           const wasPrice = Math.round((e.price + 2000) / 1000);
                           const nowPrice = Math.round(e.price / 1000);
                           const label = e.label.charAt(0).toUpperCase() + e.label.slice(1).toLowerCase();
                           return \`\${label} - ~Was \${wasPrice}k~, *now only \${nowPrice}k!*\`;
                         }).join('\\n');
                         const promoTemplate = \`⚡️ Welcome to Gharpayy \${propName} - \${gender}! ❤️\\n\\n\${rows}\\n\\n💥 Lock in your spot NOW and save 2000+ RS/month! 🔥\`;
                         const finalPromo = selectedProperty.whatsappPromo || promoTemplate;

                         return (
                           <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 shadow-sm">
                             <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={10} fill="currentColor" /> Marketing Promo
                             </p>
                             <p className="text-[11px] font-bold text-slate-700 leading-relaxed bg-white/60 p-3 rounded-xl border border-white line-clamp-6 select-all whitespace-pre-line">
                               {finalPromo}
                             </p>
                             <div className="flex items-center gap-2 mt-3">
                                <Button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(finalPromo);
                                    toast.success("Promo copied! 🚀");
                                  }}
                                  className="h-9 flex-1 bg-green-500 hover:bg-green-600 text-[10px] font-black uppercase rounded-lg shadow-sm"
                                >
                                  Copy Text
                                </Button>
                                <Button 
                                  onClick={() => {
                                    const custom = prompt("Edit message:", finalPromo);
                                    if (custom) updateField('whatsappPromo', custom);
                                  }}
                                  variant="outline"
                                  className="h-9 px-3 rounded-lg border-green-200 text-green-600 hover:bg-green-50"
                                >
                                  Edit
                                </Button>
                             </div>
                           </div>
                         );
                       })()}

                       {/* Video & Maps Display - Auto from Spreadsheet */}
                       <div className="grid grid-cols-2 gap-2">
                          {selectedProperty.videosLink ? (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 h-14">
                               <a href={selectedProperty.videosLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 hover:bg-white p-1 rounded-lg transition-colors group">
                                  <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                     <Film size={16} fill="currentColor" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-900 uppercase">YouTube</span>
                               </a>
                               <button onClick={() => updateField('videosLink', '')} className="text-slate-300 hover:text-red-500 p-1"><X size={14} /></button>
                            </div>
                          ) : (
                             <Button variant="ghost" className="h-14 border border-dashed border-slate-200 text-[10px] uppercase font-black text-slate-400" onClick={() => { const url = prompt("YT Link:"); if (url) updateField('videosLink', url); }}>
                                + Video
                             </Button>
                          )}

                          {selectedProperty.googleMapsLink ? (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 h-14">
                               <a href={selectedProperty.googleMapsLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 hover:bg-white p-1 rounded-lg transition-colors group">
                                  <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                     <MapPin size={16} fill="currentColor" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-900 uppercase">Map Pin</span>
                               </a>
                               <button onClick={() => updateField('googleMapsLink', '')} className="text-slate-300 hover:text-red-500 p-1"><X size={14} /></button>
                            </div>
                          ) : (
                             <Button variant="ghost" className="h-14 border border-dashed border-slate-200 text-[10px] uppercase font-black text-slate-400" onClick={() => { const url = prompt("Map Link:"); if (url) updateField('googleMapsLink', url); }}>
                                + Map
                             </Button>
                          )}
                       </div>`;

// Line numbers are 1-based, array is 0-based.
// Replace lines 1238 to 1348
lines.splice(1237, 1348 - 1238 + 1, newContent);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Update complete.');
