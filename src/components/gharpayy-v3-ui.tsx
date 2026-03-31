import React, { useEffect } from "react";

// ── DESIGN TOKENS ──────────────────────────────────────────────
export const T = {
  bg0: "#050507",
  bg1: "#0A0A0F",
  bg2: "#111118",
  bg3: "#18181F",
  bg4: "#1F1F28",
  line: "rgba(255,255,255,0.055)",
  lineH:"rgba(255,255,255,0.11)",
  lineA:"rgba(255,255,255,0.18)",
  // Text
  t0: "#F4F4F8",
  t1: "#AAAAB8",
  t2: "#5E5E72",
  t3: "#2E2E3A",
  // Brand
  gold:   "#F2A318",
  goldD:  "rgba(242,163,24,0.1)",
  goldB:  "rgba(242,163,24,0.25)",
  // Status colors
  green:  "#22C55E",
  greenD: "rgba(34,197,94,0.09)",
  greenB: "rgba(34,197,94,0.25)",
  amber:  "#F59E0B",
  amberD: "rgba(245,158,11,0.09)",
  amberB: "rgba(245,158,11,0.25)",
  red:    "#EF4444",
  redD:   "rgba(239,68,68,0.09)",
  redB:   "rgba(239,68,68,0.25)",
  blue:   "#3B82F6",
  blueD:  "rgba(59,130,246,0.09)",
  blueB:  "rgba(59,130,246,0.25)",
  violet: "#8B5CF6",
  violetD:"rgba(139,92,246,0.09)",
  violetB:"rgba(139,92,246,0.25)",
  cyan:   "#06B6D4",
  cyanD:  "rgba(6,182,212,0.09)",
  cyanB:  "rgba(6,182,212,0.25)",
  // Typography
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const ROOM_STATES = {
  LOCKED:      { label:"Locked",        color:"#5E5E72",       bg:"rgba(94,94,114,0.1)",  border:"rgba(94,94,114,0.3)",  desc:"No owner update" },
  AVAILABLE:   { label:"Available",     color:T.amber,         bg:T.amberD,               border:T.amberB,               desc:"Owner updated, awaiting retail" },
  APPROVED:    { label:"Approved",      color:T.green,         bg:T.greenD,               border:T.greenB,               desc:"Live – sellable" },
  SOFT_LOCKED: { label:"Visit Sched.",  color:T.blue,          bg:T.blueD,                border:T.blueB,                desc:"Visit scheduled – temp hold" },
  HARD_LOCKED: { label:"Pre-booked",    color:T.violet,        bg:T.violetD,              border:T.violetB,              desc:"Pre-booking in progress" },
  OCCUPIED:    { label:"Occupied",      color:T.red,           bg:T.redD,                 border:T.redB,                 desc:"Currently occupied" },
};

export function Tag({ state }: { state: string }) {
  const s = (ROOM_STATES as any)[state] || ROOM_STATES.LOCKED;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontFamily:T.mono, fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:4, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {s.label.toUpperCase()}
    </span>
  );
}

export function Chip({ label, color=T.t1, bg="transparent", border }: { label: string, color?: string, bg?: string, border?: string }) {
  return (
    <span style={{ fontFamily:T.mono, fontSize:10, fontWeight:600, color, background:bg, border:`1px solid ${border||color+"44"}`, padding:"2px 7px", borderRadius:3, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
      {label.toUpperCase()}
    </span>
  );
}

export function Btn({ children, onClick, variant="ghost", disabled, style:extStyle }: { children: React.ReactNode, onClick?: () => void, variant?: string, disabled?: boolean, style?: any }) {
  const variants: any = {
    ghost:   { bg:"transparent",  col:T.t1,    brd:T.line },
    primary: { bg:T.gold,          col:"#000",  brd:T.gold },
    green:   { bg:T.greenD,        col:T.green, brd:T.greenB },
    amber:   { bg:T.amberD,        col:T.amber, brd:T.amberB },
    blue:    { bg:T.blueD,         col:T.blue,  brd:T.blueB },
    violet:  { bg:T.violetD,       col:T.violet,brd:T.violetB },
    red:     { bg:T.redD,          col:T.red,   brd:T.redB },
    dark:    { bg:T.bg3,           col:T.t0,    brd:T.line },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button disabled={disabled} onClick={onClick} style={{ background:v.bg, color:v.col, border:`1px solid ${v.brd}`, borderRadius:7, padding:"7px 14px", fontSize:13, fontFamily:T.sans, fontWeight:500, transition:"all .14s", opacity:disabled?0.8:1, cursor:disabled?"not-allowed":"pointer", ...extStyle }}>
      {children}
    </button>
  );
}

export function Input({ value, onChange, placeholder, type="text", style:ext }: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background:T.bg3, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 13px", fontSize:13, color:T.t0, width:"100%", ...ext }}
      onFocus={(e: any) => e.target.style.borderColor = T.lineA}
      onBlur={(e: any) => e.target.style.borderColor = T.line} />
  );
}

export function Textarea({ value, onChange, placeholder, rows=3 }: any) {
  return (
    <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={{ background:T.bg3, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 13px", fontSize:13, color:T.t0, width:"100%", resize:"none", lineHeight:1.6 }}
      onFocus={(e: any) => e.target.style.borderColor = T.lineA}
      onBlur={(e: any) => e.target.style.borderColor = T.line} />
  );
}

export function Select({ value, onChange, children, style:ext }: any) {
  return (
    <select value={value} onChange={onChange} style={{ background:T.bg3, border:`1px solid ${T.line}`, borderRadius:7, padding:"9px 13px", fontSize:13, color:T.t0, width:"100%", ...ext }}
      onFocus={(e: any) => e.target.style.borderColor = T.lineA}
      onBlur={(e: any) => e.target.style.borderColor = T.line}>
      {children}
    </select>
  );
}

export function Label({ children }: any) {
  return <div style={{ fontFamily:T.mono, fontSize:10, fontWeight:600, color:T.t2, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:7 }}>{children}</div>;
}

export function Card({ children, style:ext, glow }: any) {
  return (
    <div style={{ background:T.bg2, border:`1px solid ${glow || T.line}`, borderRadius:10, padding:"16px 18px", ...ext }}>
      {children}
    </div>
  );
}

export function StatBox({ label, value, color=T.t0, sub, icon }: any) {
  return (
    <Card style={{ flex:1, minWidth:120 }}>
      <div style={{ fontSize:10, fontFamily:T.mono, color:T.t2, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:30, fontWeight:700, color, lineHeight:1, marginBottom:3 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.t2, fontFamily:T.mono }}>{sub}</div>}
    </Card>
  );
}

export function Avatar({ name, size=36 }: { name: string, size?: number }) {
  const colors = [T.gold, T.green, T.blue, T.violet, T.cyan, T.amber];
  const c = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:c+"1A", border:`1.5px solid ${c}50`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.mono, fontSize:size*0.32, fontWeight:600, color:c, flexShrink:0 }}>
      {initials}
    </div>
  );
}

export function GlobalStyles() {
  useEffect(() => {
    if (!document.getElementById("gp-global")) {
      const s = document.createElement("style");
      s.id = "gp-global";
      s.textContent = `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:${T.bg1}}
        ::-webkit-scrollbar-thumb{background:${T.bg4};border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideRight{from{transform:translateX(-6px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toast-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        .gp-fade{animation:fadeUp .2s ease}
        .gp-slide{animation:slideRight .15s ease}
        .gp-pulse{animation:pulse 2.2s infinite}
        input:focus,textarea:focus,select:focus{outline:none}
      `;
      document.head.appendChild(s);
    }
  }, []);
  return null;
}

export function TopBar({ role, userName, onLogout, onSwitch }: any) {
  const roleMap: any = { OWNER:["LISTING PARTNER", T.gold], SALES:["SALES TEAM", T.green], ADMIN:["ADMIN", T.blue] };
  const [rLabel, rColor] = roleMap[role.toUpperCase()] || ["", T.t1];
  return (
    <div style={{ background:T.bg1, borderBottom:`1px solid ${T.line}`, height:54, display:"flex", alignItems:"center", padding:"0 20px", justifyContent:"space-between", position:"sticky", top:0, zIndex:200 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:26, height:26, background:T.gold, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:9, height:9, background:T.bg0, borderRadius:1, transform:"rotate(45deg)" }} />
          </div>
          <span style={{ fontFamily:T.sans, fontWeight:700, fontSize:16, color:T.t0, letterSpacing:"-0.02em" }}>
            Gharpayy<span style={{ color:T.gold }}>OS</span>
          </span>
        </div>
        <div style={{ width:1, height:20, background:T.line }} />
        <div style={{ fontFamily:T.mono, fontSize:11, color:rColor, background:rColor+"18", border:`1px solid ${rColor}35`, borderRadius:4, padding:"3px 9px", letterSpacing:"0.06em" }}>{rLabel}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:15 }}>
        {userName && <span style={{ fontSize:13, color:T.t1 }}>{userName}</span>}
        <Btn onClick={onLogout} style={{ fontSize:12, padding:"5px 12px" }}>Logout</Btn>
      </div>
    </div>
  );
}

export function TabBar({ tabs, active, onChange }: { tabs: any[], active: string, onChange: (id: string) => void }) {
  return (
    <div style={{ display:"flex", gap:2, background:T.bg1, borderRadius:9, padding:4, width:"fit-content" }}>
      {tabs.map(([id, label, count]) => (
        <button key={id} onClick={() => onChange(id)} style={{ background:active===id ? T.bg3 : "transparent", border:active===id ? `1px solid ${T.line}` : "1px solid transparent", color:active===id ? T.t0 : T.t2, borderRadius:6, padding:"6px 14px", fontSize:12, fontFamily:T.sans, fontWeight:500, cursor:"pointer", transition:"all .13s", display:"flex", alignItems:"center", gap:6 }}>
          {label}
          {count !== undefined && count > 0 && <span style={{ background:T.gold+"22", color:T.gold, borderRadius:3, fontSize:10, fontFamily:T.mono, padding:"0 5px", lineHeight:"16px" }}>{count}</span>}
        </button>
      ))}
    </div>
  );
}
