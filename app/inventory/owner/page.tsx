'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { 
  Building2, Bed, MessageCircle, Map as MapIcon, 
  ExternalLink, Sparkles, Filter, Video, CheckCircle2, Clock, 
  Lock, TrendingUp, Zap, Users, Info, Plus, ArrowRight, Share2,
  Calendar, CreditCard, ChevronRight, Activity, Bell, MapPin, ChevronDown
} from 'lucide-react';
import { 
  T, ROOM_STATES, Card, Btn, Tag, Chip, StatBox, TabBar, 
  Label, Input, Select, Textarea, EmptyState 
} from '@/components/Gharpayy3X';
import { toast } from 'sonner';

export default function OwnerDashboard3X() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [effortData, setEffortData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [selectedPropId, setSelectedPropId] = useState<number | null>(null);
  
  const [updateModal, setUpdateModal] = useState<any>(null);
  const [form, setForm] = useState({ type: "available_now", availFrom: "", price: "", remarks: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchApi = useCallback(async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
    });
    return res.json();
  }, []);

  useEffect(() => {
    // BYPASS LOGIN: Return first available Admin
    setUser({ id: 1, name: 'Gharpayy Admin', role: 'ADMIN' });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchApi('/api/inventory/owner');
      if (Array.isArray(data) && data.length > 0) {
        setProperties(data);
        if (!selectedPropId) setSelectedPropId(data[0].propertyId);
      }
    } catch (e) {
      console.error('Owner data failure', e);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, selectedPropId]);

  useEffect(() => { loadData(); }, [loadData]);

  const fetchEffort = useCallback(async (id: number) => {
    const res = await fetchApi(`/api/inventory/effort?propertyId=${id}`);
    if (res) setEffortData(res);
  }, [fetchApi]);

  useEffect(() => { 
    if (selectedPropId) fetchEffort(selectedPropId); 
  }, [selectedPropId, fetchEffort]);

  const activeProp = useMemo(() => 
    properties.find(p => p.propertyId === selectedPropId), 
  [properties, selectedPropId]);

  const handleUpdate = async () => {
    if (!updateModal) return;
    setSubmitting(true);
    await fetchApi('/api/inventory/owner', {
      method: 'POST',
      body: JSON.stringify({
        roomId: updateModal.id,
        availabilityType: form.type,
        availableFrom: form.availFrom,
        expectedPrice: form.price,
        remarks: form.remarks
      })
    });
    setSubmitting(false);
    setUpdateModal(null);
    loadData();
    if (selectedPropId) fetchEffort(selectedPropId);
    toast.success('Room status updated successfully');
  };

  if (loading) return (
    <AppLayout title="Owner Portal">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400 }}>
        <div style={{ width:30, height:30, border:"2px solid rgba(255,255,255,0.1)", borderTopColor:T.gold, borderRadius:100, animation:"gp-spin 0.8s linear infinite" }} />
      </div>
    </AppLayout>
  );

  const stats = [
    { label: "Active Units", value: activeProp?.rooms.filter((r:any)=>r.state !== 'LOCKED').length || 0, color: T.green, sub: "Live in Gharpayy OS" },
    { label: "Pending Issues", value: activeProp?.rooms.filter((r:any)=>r.state === 'LOCKED').length || 0, color: T.amber, sub: "Require update" },
    { label: "Active Efforts", value: effortData?.effort?.pitchCount || 0, color: T.violet, sub: "Sales team efforts" },
  ];

  return (
    <AppLayout title="Owner Portal" subtitle="3X Build · Transparency First Inventory Control">
      <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "10px 4px" }}>
        
        {/* Dropdown Property Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
           <Label style={{ fontSize: 9 }}>PROPERTY SELECTION ({properties.length})</Label>
           <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: 14, color: T.gold, pointerEvents: "none" }}>
                 <Building2 size={18} />
              </div>
              <Select 
                value={selectedPropId || ""} 
                onChange={(e:any)=>setSelectedPropId(Number(e.target.value))} 
                style={{ paddingLeft: 42, fontSize: 16, fontWeight: 700, background: T.bg2, height: 48, borderColor: T.line }}
              >
                 {properties.map(p => <option key={p.propertyId} value={p.propertyId}>{p.location.toUpperCase()} ({p.area})</option>)}
              </Select>
           </div>
        </div>

        {/* Hero Section */}
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
           {stats.map(s => <StatBox key={s.label} {...s} />)}
           <div style={{ background: T.goldD, border: `1px solid ${T.goldB}`, borderRadius: 12, padding: "16px 20px", flexShrink: 0, minWidth: 200, display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer" }}
             onClick={async () => {
               if (!activeProp) return;
               setSubmitting(true);
               await fetchApi('/api/inventory/owner/confirm-all', { method: 'POST', body: JSON.stringify({ propertyId: activeProp.propertyId }) });
               setSubmitting(false);
               loadData();
               toast.success('All vacant units confirmed!');
             }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>Daily Confirmation</div>
              <div style={{ fontSize: 10, color: T.t2, marginBottom: 8 }}>Click to confirm all vacant units</div>
              <Btn variant="gold" size="sm" style={{ height: 28, fontSize: 10 }}>Confirm All Truth</Btn>
           </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <TabBar tabs={[["overview", "Inventory Control", 0], ["effort", "Action Ledger", effortData?.recentActions?.length || 0]]} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content Area */}
        {activeTab === "overview" && activeProp && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
             {activeProp.rooms.map((room: any) => {
               const st = ROOM_STATES[room.state] || { label: room.state, color: T.t2 };
               const needsUpdate = room.state === 'LOCKED';
               return (
                 <div key={room.id} style={{ background: T.bg2, border: `1px solid ${needsUpdate ? T.amberB : T.line}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", transition: "all .15s" }}>
                    <div style={{ width: 44, height: 44, background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                       <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 15 }}>{room.roomNumber}</span>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 160 }}>
                       <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{room.beds} Bed Unit</span>
                          <Tag state={room.state} />
                          {room.updatedAt && <span style={{ fontSize: 9, color: T.t3, marginLeft: 4 }}>Updated {room.updatedAt}</span>}
                       </div>
                       <div style={{ fontFamily: T.mono, fontSize: 11, color: T.t2 }}>Expecting: <span style={{ color: T.t1 }}>₹{room.expectedRent?.toLocaleString() || '—'}</span></div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                          <Btn variant={needsUpdate ? "amber" : "ghost"} style={{ fontSize: 12, height: 34, padding: "0 20px" }} onClick={() => { setForm({ type: room.availabilityType || "available_now", availFrom: room.availableFrom || "", price: String(room.expectedRent || ""), remarks: room.remarks || "" }); setUpdateModal(room); }}>
                             {needsUpdate ? "Confirm Status" : "Update"}
                          </Btn>
                    </div>
                 </div>
               );
             })}
          </div>
        )}

        {activeTab === "effort" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
             {effortData?.recentActions?.length ? effortData.recentActions.map((a: any) => (
                <div key={a.id} style={{ background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 10, padding: "14px 18px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                   <div style={{ width: 2, height: 40, background: T.gold, borderRadius: 2, flexShrink: 0 }} />
                   <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                         <Chip label={a.actionType} color={T.gold} />
                         <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t2 }}>Unit {a.room?.room_number}</span>
                      </div>
                      <div style={{ fontSize: 13, color: T.t0, lineHeight: 1.6 }}>{a.notes}</div>
                   </div>
                   <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, textAlign: "right" }}>
                      <div>{new Date(a.timestamp).toLocaleDateString()}</div>
                      <div>{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                   </div>
                </div>
             )) : <EmptyState msg="Sales activity will update live here." />}
          </div>
        )}

        {/* Update Availability Modal */}
        {updateModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, backdropFilter: "blur(4px)" }} onClick={e=>e.target===e.currentTarget&&setUpdateModal(null)}>
             <Card className="gp-fade" style={{ maxWidth: 420, width: "100%", boxShadow: `0 0 40px rgba(0,0,0,0.5)`, border: `1px solid ${T.lineH}` }}>
                <Label style={{ color: T.gold }}>INVENTORY UPDATE · ROOM {updateModal.roomNumber}</Label>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                   <h3 style={{ fontSize: 20, fontWeight: 700 }}>{activeProp?.location}</h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                   <div>
                      <Label>AVAILABILITY STATUS</Label>
                      <div style={{ display: "flex", gap: 8 }}>
                         {[["available_now", "NOW"], ["available_on_date", "SOON"], ["occupied", "OCCUPIED"]].map(([st, label]) => (
                           <button key={st} onClick={()=>setForm({...form, type: st})} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${form.type === st ? T.gold : T.line}`, background: form.type === st ? T.goldD : T.bg3, color: form.type === st ? T.gold : T.t2, fontSize: 11, fontWeight: 700, transition: "all .15s" }}>{label}</button>
                         ))}
                      </div>
                   </div>
                   
                   {form.type === "available_on_date" && (
                        <Input type="text" label="VACATING DATE" value={form.availFrom} onChange={(e:any)=>setForm({...form, availFrom: e.target.value})} placeholder="e.g. May 1st" />
                   )}
                   <Input type="number" label="EXPECTED RENT (₹/UNIT/MO)" value={form.price} onChange={(e:any)=>setForm({...form, price: e.target.value})} placeholder="Rent" />
                   <Textarea label="REMARKS" value={form.remarks} onChange={(e:any)=>setForm({...form, remarks: e.target.value})} placeholder="Highlights" rows={3} />

                   <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <Btn style={{ flex: 1 }} onClick={()=>setUpdateModal(null)}>Cancel</Btn>
                      <Btn variant="primary" style={{ flex: 2, fontWeight: 700 }} onClick={handleUpdate} disabled={submitting}>Confirm Truth</Btn>
                    </div>
                </div>
             </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
