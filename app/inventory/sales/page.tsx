'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface RoomInfo {
  id: number;
  roomNumber: string;
  beds: number;
  expectedRent: number | null;
  retailPrice?: number | null;
  hasPendingVisit?: boolean;
  actionCount?: number;
  vacantDate?: string;
  status?: string;
  reason?: string;
}

interface PropertyView {
  propertyId: number;
  location: string;
  owner: { id: number; name: string; phone: string };
  summary: {
    total: number;
    available: number;
    approved: number;
    upcoming: number;
    locked: number;
    occupied: number;
    blocked: number;
  };
  availableRooms: RoomInfo[];
  upcomingRooms: RoomInfo[];
  lockedRooms: RoomInfo[];
}

export default function SalesViewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<PropertyView[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState<{ roomId: number; roomNumber: string } | null>(null);
  const [visitForm, setVisitForm] = useState({ customerName: '', visitType: 'PHYSICAL', scheduledTime: '' });
  const [actionModal, setActionModal] = useState<{ roomId: number; roomNumber: string } | null>(null);
  const [actionForm, setActionForm] = useState({ actionType: 'PITCH', notes: '' });
  const [approveModal, setApproveModal] = useState<{ roomId: number; roomNumber: string; basePrice: number } | null>(null);
  const [approveForm, setApproveForm] = useState({ retailPrice: '', tier: 'standard', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const getToken = useCallback(() => localStorage.getItem('inv_token'), []);

  const fetchApi = useCallback(async (url: string, opts?: RequestInit) => {
    const token = getToken();
    if (!token) { router.push('/inventory/login'); return null; }
    const res = await fetch(url, {
      ...opts,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts?.headers },
    });
    if (res.status === 401) { router.push('/inventory/login'); return null; }
    return res.json();
  }, [getToken, router]);

  useEffect(() => {
    const stored = localStorage.getItem('inv_user');
    if (!stored) { router.push('/inventory/login'); return; }
    const u = JSON.parse(stored);
    if (!['SALES', 'ADMIN'].includes(u.role)) { router.push('/inventory/login'); return; }
    setUser(u);
  }, [router]);

  const loadData = useCallback(async () => {
    const data = await fetchApi('/api/inventory/sales-view');
    if (data) setProperties(data);
    setLoading(false);
  }, [fetchApi]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleScheduleVisit = async () => {
    if (!scheduleModal || !visitForm.customerName || !visitForm.scheduledTime) return;
    setSubmitting(true);
    await fetchApi('/api/inventory/visits', {
      method: 'POST',
      body: JSON.stringify({ roomId: scheduleModal.roomId, ...visitForm }),
    });
    setScheduleModal(null);
    setVisitForm({ customerName: '', visitType: 'PHYSICAL', scheduledTime: '' });
    setSubmitting(false);
    loadData();
  };

  const handleLogAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    await fetchApi('/api/inventory/actions', {
      method: 'POST',
      body: JSON.stringify({ roomId: actionModal.roomId, ...actionForm }),
    });
    setActionModal(null);
    setActionForm({ actionType: 'PITCH', notes: '' });
    setSubmitting(false);
    loadData();
  };

  const handleApprove = async () => {
    if (!approveModal || !approveForm.retailPrice) return;
    setSubmitting(true);
    await fetchApi('/api/inventory/retail', {
      method: 'POST',
      body: JSON.stringify({ roomId: approveModal.roomId, retailPrice: approveForm.retailPrice, pricingTier: approveForm.tier, brandNotes: approveForm.notes }),
    });
    setApproveModal(null);
    setApproveForm({ retailPrice: '', tier: 'standard', notes: '' });
    setSubmitting(false);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('inv_token');
    localStorage.removeItem('inv_user');
    router.push('/inventory/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalAvailable = properties.reduce((sum, p) => sum + p.summary.available, 0);
  const totalUpcoming = properties.reduce((sum, p) => sum + p.summary.upcoming, 0);
  const totalLocked = properties.reduce((sum, p) => sum + p.summary.locked, 0);
  const totalApproved = properties.reduce((sum, p) => sum + (p.summary.approved || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0d1b2a 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
            }}>
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Sales Command Center</h1>
              <p className="text-slate-400 text-xs">{user?.name} • Live Inventory View</p>
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(100,116,139,0.3)' }}>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Sellable (Approved)', value: totalApproved, icon: '🚀', color: '#10b981' },
            { label: 'Upcoming Vacant', value: totalUpcoming, icon: '🟡', color: '#f59e0b' },
            { label: 'Wait Retail Review', value: totalAvailable, icon: '⚖️', color: '#6366f1' },
            { label: 'Owner Not Confirmed', value: totalLocked, icon: '🔒', color: '#ef4444' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-5 transition-all duration-200 hover:scale-105" style={{
              background: `${stat.color}08`,
              border: `1px solid ${stat.color}25`,
            }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Properties */}
        {properties.map(prop => (
          <div key={prop.propertyId} className="mb-8 rounded-2xl overflow-hidden" style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(16, 185, 129, 0.12)',
          }}>
            {/* Property Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{
              background: 'rgba(16, 185, 129, 0.06)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.12)',
            }}>
              <div>
                <h2 className="text-white font-semibold text-lg">📍 {prop.location}</h2>
                <p className="text-slate-400 text-sm">Owner: {prop.owner.name} • 📞 {prop.owner.phone}</p>
              </div>
              <div className="flex gap-3 text-center">
                <div className="px-3">
                  <div className="text-lg font-bold text-emerald-400">{prop.summary.approved || 0}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Sellable</div>
                </div>
                <div className="px-3">
                  <div className="text-lg font-bold text-amber-400">{prop.summary.upcoming}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Upcoming</div>
                </div>
                <div className="px-3">
                  <div className="text-lg font-bold text-indigo-400">{prop.summary.available}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Needs Review</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Ready to Sell */}
              {prop.availableRooms.filter(r => r.retailPrice).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-emerald-400 font-medium text-sm uppercase tracking-wider mb-3">🟢 Approved & Ready to Sell</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {prop.availableRooms.filter(r => r.retailPrice).map(room => (
                      <div key={room.id} className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]" style={{
                        background: 'rgba(34, 197, 94, 0.06)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                      }}>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-white font-semibold">Room {room.roomNumber}</span>
                           {room.hasPendingVisit && <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Visit Pending</span>}
                        </div>
                        <div className="text-sm text-slate-400 mb-3">
                           🛏 {room.beds} beds • ₹{room.retailPrice}/mo
                           {room.actionCount ? ` • ${room.actionCount} actions` : ''}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setScheduleModal({ roomId: room.id, roomNumber: room.roomNumber })}
                             className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>📅 Visit</button>
                          <button onClick={() => setActionModal({ roomId: room.id, roomNumber: room.roomNumber })}
                             className="py-2 px-3 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>⚡ Log</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked/Action Required */}
              {(prop.lockedRooms.length > 0 || prop.availableRooms.filter(r => !r.retailPrice).length > 0) && (
                <div>
                   <h3 className="text-red-400 font-medium text-sm uppercase tracking-wider mb-3">🔒 Inventory Control / Locked</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {/* Waiting for Retail Approval */}
                     {prop.availableRooms.filter(r => !r.retailPrice).map(room => (
                        <div key={room.id} className="rounded-xl p-4" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                           <div className="flex justify-between mb-1"><span className="text-white font-semibold">Room {room.roomNumber}</span><span className="text-[9px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">Wait Review</span></div>
                           <div className="text-xs text-indigo-300 mb-3">Confirmed by owner, needs retail price</div>
                           <button onClick={() => { setApproveModal({ roomId: room.id, roomNumber: room.roomNumber, basePrice: room.expectedRent || 0 }); setApproveForm({ ...approveForm, retailPrice: String((room.expectedRent || 0) + 1000) }); }}
                              className="w-full py-2 rounded-lg text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>🚀 Approve for Sale</button>
                        </div>
                     ))}
                     {/* Locked by Owner */}
                     {prop.lockedRooms.map(room => (
                        <div key={room.id} className="rounded-xl p-4 opacity-70" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                           <span className="text-white font-semibold">Room {room.roomNumber}</span>
                           <div className="text-[10px] text-red-400 mt-1 uppercase font-bold">⚠️ Owner truth missing</div>
                        </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Schedule Visit Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setScheduleModal(null)}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-4">📅 Schedule Visit — Room {scheduleModal.roomNumber}</h3>
            <div className="space-y-4">
              <input type="text" value={visitForm.customerName} onChange={e => setVisitForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)' }} placeholder="Customer name" />
              <select value={visitForm.visitType} onChange={e => setVisitForm(f => ({ ...f, visitType: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <option value="PHYSICAL">Physical Visit</option><option value="VIRTUAL">Virtual Tour</option>
              </select>
              <input type="datetime-local" value={visitForm.scheduledTime} onChange={e => setVisitForm(f => ({ ...f, scheduledTime: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)' }} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setScheduleModal(null)} className="flex-1 py-3 text-slate-400" style={{ border: '1px solid rgba(100,116,139,0.3)' }}>Cancel</button>
                <button onClick={handleScheduleVisit} disabled={submitting} className="flex-1 py-3 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>{submitting ? 'Scheduling...' : 'Confirm Visit'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setActionModal(null)}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.3)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-4">⚡ Log Action — Room {actionModal.roomNumber}</h3>
            <div className="space-y-4">
              <select value={actionForm.actionType} onChange={e => setActionForm(f => ({ ...f, actionType: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <option value="PITCH">🎯 Pitch</option><option value="VIRTUAL_TOUR">📱 Virtual Tour</option><option value="VISIT_DONE">✅ Visit Completed</option>
              </select>
              <textarea value={actionForm.notes} onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none h-24 resize-none" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)' }} placeholder="Feedback notes..." />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setActionModal(null)} className="flex-1 py-3 text-slate-400" style={{ border: '1px solid rgba(100,116,139,0.3)' }}>Cancel</button>
                <button onClick={handleLogAction} disabled={submitting} className="flex-1 py-3 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>{submitting ? 'Logging...' : 'Log Effort'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setApproveModal(null)}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.3)' }} onClick={e => e.stopPropagation()}>
             <h3 className="text-white font-semibold text-lg mb-4">🚀 Retail Approval — Room {approveModal.roomNumber}</h3>
             <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 uppercase font-bold">Retail Rent</label>
                  <input type="number" value={approveForm.retailPrice} onChange={e => setApproveForm({...approveForm, retailPrice: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)' }} placeholder="Final price" />
                </div>
                <div>
                   <label className="text-xs text-slate-400 block mb-1 uppercase font-bold">Brand Highlights</label>
                   <textarea value={approveForm.notes} onChange={e => setApproveForm({...approveForm, notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none h-20 resize-none" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.2)' }} placeholder="Why is this a Gharpayy special?" />
                </div>
                <div className="flex gap-3 pt-2">
                   <button onClick={() => setApproveModal(null)} className="flex-1 py-3 text-slate-400" style={{ border: '1px solid rgba(100,116,139,0.3)' }}>Cancel</button>
                   <button onClick={handleApprove} disabled={submitting} className="flex-1 py-3 text-white font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>{submitting ? 'Approving...' : 'Go Live'}</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
