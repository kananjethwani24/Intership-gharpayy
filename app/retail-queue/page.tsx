'use client';

/**
 * GHARPAYY RETAIL QUEUE
 * ──────────────────────
 * Sales team view. They see all owner-updated rooms waiting for retail approval.
 * Two-state model: Wholesale Truth → Retail Approval.
 * A room MUST pass both to be sellable to customers.
 *
 * Actions available per room:
 * - Approve → sets retail price + tier + brand notes → room becomes LIVE
 * - Schedule Visit → soft-lock for customer
 * - Log Effort → pitch / virtual tour / visit done
 */

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { CheckCircle2, Clock, Lock, Eye, Phone, MapPin, Zap, MessageSquare, Calendar } from 'lucide-react';
import { PG_DATA, type PGEntry } from '@/data/pgMasterData';

// ─── TOKENS ──────────────────────────────────────────
const T = {
  bg0: '#000', bg1: '#090909', bg2: '#111', bg3: '#1A1A1A', bg4: '#222',
  line: 'rgba(255,255,255,0.07)', lineH: 'rgba(255,255,255,0.14)', lineA: 'rgba(255,255,255,0.24)',
  t0: '#F0F0F0', t1: '#999', t2: '#555', t3: '#282828',
  green: '#22C55E', greenD: 'rgba(34,197,94,0.09)', greenB: 'rgba(34,197,94,0.28)',
  amber: '#F59E0B', amberD: 'rgba(245,158,11,0.09)', amberB: 'rgba(245,158,11,0.28)',
  red:   '#EF4444', redD:   'rgba(239,68,68,0.09)',  redB:   'rgba(239,68,68,0.28)',
  sans: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── TYPES ───────────────────────────────────────────
type RetailStatus = 'pending' | 'approved' | 'locked' | 'rejected';
type ActionType = 'pitch' | 'virtual_tour' | 'visit_scheduled' | 'visit_done' | 'pre_booking';

interface WholesaleItem {
  pg: PGEntry;
  roomType: 'triple' | 'double' | 'single';
  roomNum: string;
  ownerPrice: number;
  availType: 'available_now' | 'available_on_date';
  availDate?: string;
  remarks?: string;
  submittedAt: string;
  retailStatus: RetailStatus;
  retailPrice?: number;
  tier?: 'Budget' | 'Mid' | 'Premium';
  brandNotes?: string;
  actions: { type: ActionType; note: string; at: string }[];
  pitchCount: number;
  visitsScheduled: number;
}

// ─── MOCK WHOLESALE FEED (in prod → from API) ─────────
// Derived from PG_DATA — simulates owner updates that came into the queue
const buildMockQueue = (): WholesaleItem[] => {
  const items: WholesaleItem[] = [];
  const urgentPGs = PG_DATA.filter(p => (p.priority === 'super urgent' || p.priority === 'PUSH') && p.minPrice && p.minPrice > 0).slice(0, 12);
  const roomTypes: ('triple' | 'double' | 'single')[] = ['double', 'single', 'triple', 'double', 'single', 'double', 'single', 'triple', 'double', 'single', 'double', 'triple'];
  const statuses: RetailStatus[] = ['pending', 'pending', 'approved', 'pending', 'locked', 'pending', 'approved', 'pending', 'locked', 'pending', 'approved', 'pending'];

  urgentPGs.forEach((pg, i) => {
    const rt = roomTypes[i % roomTypes.length];
    const basePrice = rt === 'triple' ? pg.triplePrice : rt === 'double' ? pg.doublePrice : pg.singlePrice;
    if (!basePrice) return;
    items.push({
      pg,
      roomType: rt,
      roomNum: `${100 + Math.floor(i / 3) * 100 + (i % 3) + 1}`,
      ownerPrice: basePrice,
      availType: i % 3 === 0 ? 'available_on_date' : 'available_now',
      availDate: i % 3 === 0 ? `2026-0${4 + (i % 3)}-${10 + i}` : undefined,
      remarks: i % 2 === 0 ? 'Good ventilation, quiet floor, near elevator' : undefined,
      submittedAt: `${i}h ago`,
      retailStatus: statuses[i % statuses.length],
      retailPrice: statuses[i % statuses.length] === 'approved' ? Math.round(basePrice * 1.12) : undefined,
      tier: statuses[i % statuses.length] === 'approved' ? 'Mid' : undefined,
      brandNotes: statuses[i % statuses.length] === 'approved' ? 'Premium location, near ' + pg.area : undefined,
      actions: i % 3 === 0 ? [{ type: 'pitch', note: 'Pitched to lead Rahul', at: `${i + 1}h ago` }] : [],
      pitchCount: i % 5,
      visitsScheduled: i % 3 === 2 ? 1 : 0,
    });
  });
  return items;
};

const MOCK_QUEUE = buildMockQueue();

// ─── HELPERS ─────────────────────────────────────────
const STATUS_META = {
  pending:  { label: 'Needs Review',   color: T.amber, bg: T.amberD, border: T.amberB },
  approved: { label: 'Live',           color: T.green, bg: T.greenD, border: T.greenB },
  locked:   { label: 'Visit Hold',     color: '#60A5FA', bg: 'rgba(96,165,250,0.09)', border: 'rgba(96,165,250,0.28)' },
  rejected: { label: 'Held',           color: T.t2,   bg: T.bg3,    border: T.line },
};

const ACTION_META = {
  pitch:            { label: 'Pitched',         color: '#A78BFA' },
  virtual_tour:     { label: 'Virtual Tour',    color: '#22D3EE' },
  visit_scheduled:  { label: 'Visit Scheduled', color: '#60A5FA' },
  visit_done:       { label: 'Visit Done',      color: T.green },
  pre_booking:      { label: 'Pre-Booking',     color: T.amber },
};

// ─── APPROVE MODAL ────────────────────────────────────
const ApproveModal = ({ item, onClose, onApprove }: {
  item: WholesaleItem;
  onClose: () => void;
  onApprove: (retailPrice: number, tier: string, notes: string) => void;
}) => {
  const suggested = Math.round(item.ownerPrice * 1.12);
  const [rPrice, setRPrice] = useState(String(suggested));
  const [tier, setTier] = useState('Mid');
  const [notes, setNotes] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.bg2, border: `1px solid ${T.lineH}`, borderRadius: 14, padding: '22px 20px', width: '100%', maxWidth: 400 }}>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.green, letterSpacing: '0.1em', marginBottom: 4 }}>RETAIL APPROVAL</div>
        <div style={{ fontWeight: 700, fontSize: 17, color: T.t0, marginBottom: 14 }}>
          {item.pg.name} · Room {item.roomNum}
        </div>

        {/* Owner truth */}
        <div style={{ background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 8, color: T.t2, letterSpacing: '0.06em', marginBottom: 4 }}>WHOLESALE TRUTH</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2 }}>OWNER PRICE</div>
              <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 14, color: T.t0 }}>₹{item.ownerPrice.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2 }}>AVAILABILITY</div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: item.availType === 'available_now' ? T.green : T.amber }}>
                {item.availType === 'available_now' ? 'Now' : item.availDate}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2 }}>ROOM</div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.t0 }}>{item.roomNum} {item.roomType}</div>
            </div>
          </div>
          {item.remarks && <div style={{ fontFamily: T.sans, fontSize: 11, color: T.t1, marginTop: 6, fontStyle: 'italic' }}>"{item.remarks}"</div>}
        </div>

        {/* Retail price */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2, letterSpacing: '0.06em', marginBottom: 6 }}>
            RETAIL PRICE · <span style={{ color: T.t3 }}>Suggested ₹{suggested.toLocaleString()}</span>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.t2, fontFamily: T.mono }}>₹</span>
            <input type="number" value={rPrice} onChange={e => setRPrice(e.target.value)}
              style={{ width: '100%', background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: '10px 12px 10px 26px', fontSize: 15, color: T.t0, fontFamily: T.mono, fontWeight: 700 }}
              onFocus={e => (e.target.style.borderColor = T.lineA)} onBlur={e => (e.target.style.borderColor = T.line)} />
          </div>
        </div>

        {/* Tier */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2, letterSpacing: '0.06em', marginBottom: 6 }}>PRICING TIER</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['Budget', 'Mid', 'Premium'] as const).map(t => (
              <button key={t} onClick={() => setTier(t)}
                style={{ flex: 1, background: tier === t ? T.amberD : T.bg3, border: `1px solid ${tier === t ? T.amberB : T.line}`, borderRadius: 6, padding: '8px 0', fontSize: 12, color: tier === t ? T.amber : T.t1, cursor: 'pointer', fontFamily: T.sans, fontWeight: tier === t ? 700 : 400 }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Brand notes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2, letterSpacing: '0.06em', marginBottom: 6 }}>BRAND NOTES <span style={{ color: T.t3 }}>— pitch talking points for sales team</span></div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Prime location, 5 min from Nexus Mall..."
            style={{ width: '100%', background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: T.t0, fontFamily: T.sans, resize: 'none' }}
            onFocus={e => (e.target.style.borderColor = T.lineA)} onBlur={e => (e.target.style.borderColor = T.line)} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: '11px', color: T.t1, cursor: 'pointer', fontFamily: T.sans }}>Cancel</button>
          <button onClick={() => rPrice && onApprove(parseInt(rPrice), tier, notes)} disabled={!rPrice}
            style={{ flex: 2, background: rPrice ? T.green : T.bg3, color: rPrice ? '#000' : T.t2, border: 'none', borderRadius: 8, padding: '11px', fontWeight: 700, fontSize: 14, cursor: rPrice ? 'pointer' : 'not-allowed', fontFamily: T.sans, transition: 'all .15s' }}>
            Approve Room →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── EFFORT LOG MODAL ─────────────────────────────────
const EffortModal = ({ item, onClose, onLog }: { item: WholesaleItem; onClose: () => void; onLog: (type: ActionType, note: string) => void }) => {
  const [note, setNote] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 999 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.bg2, border: `1px solid ${T.lineH}`, borderRadius: '14px 14px 0 0', padding: '20px 20px 32px', width: '100%', maxWidth: 460 }}>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, letterSpacing: '0.1em', marginBottom: 4 }}>LOG EFFORT</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: T.t0, marginBottom: 12 }}>{item.pg.name} · Room {item.roomNum}</div>

        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What did you do? (optional context)" rows={2}
          style={{ width: '100%', background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: T.t0, fontFamily: T.sans, resize: 'none', marginBottom: 12 }}
          onFocus={e => (e.target.style.borderColor = T.lineA)} onBlur={e => (e.target.style.borderColor = T.line)} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {([
            ['pitch',           'Pitch to Lead',      'Logged a new lead contact'],
            ['virtual_tour',    'Virtual Tour Sent',   'Sent room video / walkthrough'],
            ['visit_scheduled', 'Visit Scheduled',     'Physical/virtual visit booked'],
            ['visit_done',      'Visit Completed',     'Mark the visit as done'],
            ['pre_booking',     'Pre-Booking',         'Customer paid token amount'],
          ] as [ActionType, string, string][]).map(([type, label, sub]) => {
            const meta = ACTION_META[type];
            return (
              <button key={type} onClick={() => onLog(type, note || sub)}
                style={{ background: meta.color + '10', border: `1px solid ${meta.color}30`, borderRadius: 8, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 13, color: meta.color }}>{label}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t2, marginTop: 2 }}>{sub}</div>
                </div>
                <span style={{ color: T.t2 }}>→</span>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 8, padding: '11px', color: T.t1, cursor: 'pointer', fontFamily: T.sans }}>Cancel</button>
      </div>
    </div>
  );
};

// ─── QUEUE CARD ───────────────────────────────────────
const QueueCard = ({ item, onApprove, onLogEffort }: {
  item: WholesaleItem;
  onApprove: (item: WholesaleItem) => void;
  onLogEffort: (item: WholesaleItem) => void;
}) => {
  const st = STATUS_META[item.retailStatus];

  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color .15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.lineA}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.line}>

      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.t0, marginBottom: 2 }}>{item.pg.name}</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t2 }}>
              {item.pg.area} · Room {item.roomNum} · {item.roomType}
            </div>
          </div>
          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 5, fontFamily: T.mono, fontSize: 9, fontWeight: 700, padding: '3px 8px', whiteSpace: 'nowrap' }}>
            {st.label}
          </span>
        </div>

        {/* Availability + price */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: item.availType === 'available_now' ? T.greenD : T.amberD, color: item.availType === 'available_now' ? T.green : T.amber, border: `1px solid ${item.availType === 'available_now' ? T.greenB : T.amberB}`, borderRadius: 4, fontFamily: T.mono, fontSize: 9, padding: '2px 7px' }}>
            {item.availType === 'available_now' ? '⬤ Available Now' : `⬤ From ${item.availDate}`}
          </span>
          <span style={{ background: T.bg3, color: T.t1, border: `1px solid ${T.line}`, borderRadius: 4, fontFamily: T.mono, fontSize: 9, padding: '2px 7px' }}>
            W: ₹{item.ownerPrice.toLocaleString()}
          </span>
          {item.retailPrice && (
            <span style={{ background: T.bg3, color: T.t0, border: `1px solid ${T.line}`, borderRadius: 4, fontFamily: T.mono, fontSize: 9, fontWeight: 700, padding: '2px 7px' }}>
              R: ₹{item.retailPrice.toLocaleString()}
            </span>
          )}
          <span style={{ background: T.bg3, color: T.t2, border: `1px solid ${T.line}`, borderRadius: 4, fontFamily: T.mono, fontSize: 9, padding: '2px 7px' }}>
            {item.submittedAt}
          </span>
        </div>

        {item.remarks && (
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.t2, marginTop: 6, fontStyle: 'italic', borderLeft: `2px solid ${T.line}`, paddingLeft: 8 }}>
            "{item.remarks}"
          </div>
        )}
      </div>

      {/* Effort log */}
      {item.actions.length > 0 && (
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.line}` }}>
          {item.actions.map((a, i) => {
            const am = ACTION_META[a.type];
            return (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: am.color, flexShrink: 0 }} />
                <span style={{ fontFamily: T.mono, fontSize: 10, color: am.color }}>{am.label}</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t2 }}>—</span>
                <span style={{ fontFamily: T.sans, fontSize: 11, color: T.t1, flex: 1 }}>{a.note}</span>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.t2 }}>{a.at}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats + actions */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          {item.pitchCount > 0 && (
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t2 }}>
              {item.pitchCount} pitch{item.pitchCount > 1 ? 'es' : ''}
            </span>
          )}
          {item.visitsScheduled > 0 && (
            <span style={{ fontFamily: T.mono, fontSize: 10, color: '#60A5FA' }}>
              {item.visitsScheduled} visit
            </span>
          )}
        </div>

        <button onClick={() => onLogEffort(item)}
          style={{ background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 12px', fontSize: 11, color: T.t1, cursor: 'pointer', fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={11} /> Log
        </button>
        {item.retailStatus === 'pending' && (
          <button onClick={() => onApprove(item)}
            style={{ background: T.greenD, border: `1px solid ${T.greenB}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, color: T.green, cursor: 'pointer', fontFamily: T.sans, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={11} /> Approve
          </button>
        )}
        {item.retailStatus === 'approved' && (
          <button style={{ background: T.bg3, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 12px', fontSize: 11, color: T.t2, cursor: 'pointer', fontFamily: T.sans, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={11} /> Visit
          </button>
        )}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────
export default function RetailQueuePage() {
  const [queue, setQueue] = useState<WholesaleItem[]>(MOCK_QUEUE);
  const [filter, setFilter] = useState<'all' | RetailStatus>('all');
  const [approveItem, setApproveItem] = useState<WholesaleItem | null>(null);
  const [effortItem, setEffortItem] = useState<WholesaleItem | null>(null);

  const filtered = useMemo(() => (
    filter === 'all' ? queue : queue.filter(i => i.retailStatus === filter)
  ), [queue, filter]);

  const stats = {
    pending:  queue.filter(i => i.retailStatus === 'pending').length,
    approved: queue.filter(i => i.retailStatus === 'approved').length,
    locked:   queue.filter(i => i.retailStatus === 'locked').length,
    total: queue.length,
  };

  const handleApprove = (item: WholesaleItem, retailPrice: number, tier: string, notes: string) => {
    setQueue(prev => prev.map(i => i === item
      ? { ...i, retailStatus: 'approved', retailPrice, tier: tier as any, brandNotes: notes, actions: [...i.actions, { type: 'pitch', note: `Retail approved at ₹${retailPrice.toLocaleString()} (${tier})`, at: 'just now' }] }
      : i));
    setApproveItem(null);
  };

  const handleLog = (item: WholesaleItem, type: ActionType, note: string) => {
    setQueue(prev => prev.map(i => i === item
      ? { ...i, pitchCount: type === 'pitch' ? i.pitchCount + 1 : i.pitchCount, visitsScheduled: type === 'visit_scheduled' ? i.visitsScheduled + 1 : i.visitsScheduled, retailStatus: type === 'visit_scheduled' ? 'locked' : i.retailStatus, actions: [{ type, note, at: 'just now' }, ...i.actions].slice(0, 5) }
      : i));
    setEffortItem(null);
  };

  return (
    <AppLayout title="Retail Queue" subtitle="Wholesale → Retail Approval Pipeline">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        body{background:#000 !important}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
        input:focus,textarea:focus{outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .gp-fade{animation:fadeUp .2s ease both}
      `}</style>

      <div style={{ minHeight: '100vh', background: T.bg0, fontFamily: T.sans, color: T.t0 }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'In Queue', value: stats.total,    color: T.t0 },
            { label: 'Needs Review', value: stats.pending,  color: T.amber },
            { label: 'Live / Sellable', value: stats.approved, color: T.green },
            { label: 'Visit Hold', value: stats.locked,   color: '#60A5FA' },
          ].map(s => (
            <div key={s.label} style={{ background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 100 }}>
              <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 24, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.t2, marginTop: 4, letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
          {(['all', 'pending', 'approved', 'locked'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', fontSize: 11, fontFamily: T.mono, background: filter === f ? T.bg4 : 'transparent', color: filter === f ? T.t0 : T.t2, border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'all .12s', textTransform: 'capitalize' }}>
              {f} {f === 'pending' ? `(${stats.pending})` : f === 'approved' ? `(${stats.approved})` : ''}
            </button>
          ))}
        </div>

        {/* SLA notice */}
        <div style={{ background: T.amberD, border: `1px solid ${T.amberB}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.amber, lineHeight: 1.7 }}>
            <strong>Platform Rule:</strong> No owner confirmation = room stays LOCKED. No retail approval = room hidden from sales. Every action is logged and visible to owners.
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
          {filtered.map((item, idx) => (
            <div key={idx} className="gp-fade" style={{ animationDelay: `${idx * 0.03}s` }}>
              <QueueCard item={item} onApprove={setApproveItem} onLogEffort={setEffortItem} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.t2, fontFamily: T.mono, fontSize: 13 }}>
            No items in this view
          </div>
        )}
      </div>

      {/* Modals */}
      {approveItem && (
        <ApproveModal item={approveItem} onClose={() => setApproveItem(null)}
          onApprove={(rPrice, tier, notes) => handleApprove(approveItem, rPrice, tier, notes)} />
      )}
      {effortItem && (
        <EffortModal item={effortItem} onClose={() => setEffortItem(null)}
          onLog={(type, note) => handleLog(effortItem, type, note)} />
      )}
    </AppLayout>
  );
}
