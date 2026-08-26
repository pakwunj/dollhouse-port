/* =========================================================================
   KWUN'S DOLLHOUSE — interactive portfolio
   Pakwun Jindarat (Kwun) · Cinema & Digital Media Management

   HOW TO SWAP IN YOUR OWN ARTWORK
   -------------------------------
   Every clickable object sits inside a <Hotspot> or <EmojiTile>, each with a
   comment above it naming exactly what to replace. Positions are written as
   Tailwind arbitrary-value classes (e.g. "top-[52%] left-[42%] w-[22%]") on a
   `relative aspect-[16/10]` container, so a PNG cut-out lands in the same
   spot on every screen size. The emoji inside each <EmojiTile> is a
   placeholder — swap it for your own transparent PNG cut-out, e.g.:

       <EmojiTile emoji="📖" />              becomes
       <img src="/assets/notebook.png" alt="" className="w-full h-auto" />

   NOTE ON ANIMATION: built with CSS transitions + keyframes (no Framer
   Motion dependency). Every animated value is a transform/opacity, so
   dropping in <motion.div> later is a 1:1 swap.
   ========================================================================= */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Mail, Instagram, MessageCircle, ChevronLeft, ChevronRight,
  Shuffle, ExternalLink, Copy, Check, Sparkles,
} from "lucide-react";
import TRACKS from "./playlist-tracks.json";

/* ============================== DESIGN TOKENS ============================ */
const T = {
  cream: "#FDF7EE",
  paper: "#FFFCF6",
  blush: "#F0CFC8",
  rose: "#E09A93",
  sage: "#B9CEB0",
  moss: "#7E9A78",
  sky: "#AEC9DD",
  butter: "#F4DEA3",
  wood: "#CE9E72",
  woodDark: "#A97B54",
  cocoa: "#6E4E39",
  ink: "#4A3627",
  vinyl: "#2B2A33",
};

const serif = { fontFamily: "'Fraunces', Georgia, serif" };
const sans = { fontFamily: "'Nunito', ui-sans-serif, system-ui, sans-serif" };
const label = {
  ...sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

function GlobalStyle() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Nunito:wght@400;600;700;800&display=swap');

.dh-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.dh-scroll::-webkit-scrollbar-thumb { background: ${T.blush}; border-radius: 99px; }
.dh-scroll::-webkit-scrollbar-track { background: transparent; }

@keyframes dh-spin { to { transform: rotate(360deg); } }
@keyframes dh-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes dh-sway { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
@keyframes dh-pop { from { opacity: 0; transform: scale(0.94) translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes dh-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dh-highlight { 0%,100% { box-shadow: inset 0 0 0 0 rgba(224,154,147,0); } 50% { box-shadow: inset 0 0 0 5px rgba(224,154,147,.85); } }

.dh-float { animation: dh-float 4.5s ease-in-out infinite; }
.dh-sway { animation: dh-sway 5s ease-in-out infinite; transform-origin: bottom center; }
.dh-pop { animation: dh-pop .32s cubic-bezier(.2,.9,.3,1.2) both; }
.dh-fade { animation: dh-fade .5s ease both; }
.dh-vinyl-spin { animation: dh-spin 0.7s linear; }
.dh-highlight { animation: dh-highlight 1.4s ease-in-out 2; }

button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: 3px solid ${T.rose}; outline-offset: 3px; border-radius: 6px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
    `}</style>
  );
}

/* ============================ SHARED PRIMITIVES ========================== */

/** A clickable object. `className` carries Tailwind position (top-[%] left-[%] w-[%]). */
function Hotspot({ className = "", label: name, onClick, children, float }) {
  return (
    <button
      onClick={onClick}
      aria-label={name}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group ${float ? "dh-float" : ""} ${className}`}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      <span className="block transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
        {children}
      </span>
      {/* hover tag */}
      <span
        className="pointer-events-none absolute left-1/2 -bottom-7 whitespace-nowrap opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-8"
        style={{
          transform: "translateX(-50%)",
          ...label,
          fontSize: 9.5,
          color: T.paper,
          background: T.cocoa,
          padding: "4px 9px",
          borderRadius: 99,
          boxShadow: "0 3px 0 rgba(110,78,57,.25)",
        }}
      >
        {name}
      </span>
    </button>
  );
}

/** A pastel emoji "sticker" standing in for a hand-drawn cut-out. */
function EmojiTile({ emoji, bg = T.cream, small }) {
  const size = small ? 40 : 58;
  return (
    <span
      role="img"
      aria-hidden="true"
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        fontSize: small ? 19 : 27,
        background: bg,
        border: `2.5px solid ${T.cocoa}`,
        boxShadow: `0 4px 0 rgba(110,78,57,.18)`,
      }}
    >
      {emoji}
    </span>
  );
}

function Modal({ open, onClose, children, maxWidth = 860, tone = T.paper }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 dh-fade"
      style={{ background: "rgba(74,54,39,0.5)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
    >
      <div
        className="dh-pop relative w-full flex flex-col overflow-hidden"
        style={{
          maxWidth,
          maxHeight: "88vh",
          background: tone,
          borderRadius: 26,
          border: `3px solid ${T.cocoa}`,
          boxShadow: "0 18px 0 rgba(110,78,57,.22)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex items-center justify-center transition-transform hover:rotate-90"
          style={{
            width: 36, height: 36, borderRadius: 99,
            background: T.blush, border: `2px solid ${T.cocoa}`, color: T.ink, cursor: "pointer",
          }}
        >
          <X size={17} strokeWidth={2.6} />
        </button>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ eyebrow, title, sub, bg = T.blush }) {
  return (
    <div className="px-5 py-4 sm:px-8 sm:py-5" style={{ background: bg, borderBottom: `3px solid ${T.cocoa}` }}>
      <div style={{ ...label, color: T.cocoa, opacity: 0.75 }}>{eyebrow}</div>
      <h2 className="mt-1" style={{ ...serif, fontSize: "clamp(20px,4vw,30px)", fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>
        {title}
      </h2>
      {sub && <p className="mt-1" style={{ ...sans, fontSize: 13.5, color: T.cocoa }}>{sub}</p>}
    </div>
  );
}

function Button({ onClick, children, tone = T.butter, wide, as = "button", href, compact }) {
  const style = {
    ...sans, fontWeight: 800, color: T.ink, background: tone,
    border: `${compact ? 2 : 2.5}px solid ${T.cocoa}`, borderRadius: 99,
    fontSize: compact ? 11.5 : 13.5, padding: compact ? "6px 12px" : "10px 18px",
    boxShadow: `0 ${compact ? 3 : 4}px 0 ${T.cocoa}`, cursor: "pointer", display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: compact ? 5 : 8, width: wide ? "100%" : undefined,
    textDecoration: "none",
  };
  const cls = "transition-all duration-150 hover:translate-y-0.5 active:translate-y-1";
  if (as === "a")
    return <a href={href} target="_blank" rel="noreferrer" className={cls} style={style}>{children}</a>;
  return <button onClick={onClick} className={cls} style={style}>{children}</button>;
}

/** A small speech-bubble / trinket popover, anchored inside a `relative` room. */
function Popover({ open, onClose, anchorClassName, width = 200, children }) {
  if (!open) return null;
  return (
    <div className={`absolute z-30 ${anchorClassName}`} style={{ width }} onClick={(e) => e.stopPropagation()}>
      <div
        className="dh-pop relative"
        style={{
          background: T.cream, border: `2.5px solid ${T.cocoa}`, borderRadius: 16,
          padding: "12px 14px", boxShadow: "0 7px 0 rgba(110,78,57,.18)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-2.5 -right-2.5 flex items-center justify-center"
          style={{ width: 22, height: 22, borderRadius: 99, background: T.blush, border: `2px solid ${T.cocoa}`, color: T.ink, cursor: "pointer" }}
        >
          <X size={10} strokeWidth={3} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* =========================================================================
   AMBIENT FURNITURE (non-interactive background dressing)
   Hand-drawn placeholder SVGs. Swap for your own illustrations the same way
   as the interactive pieces — these just don't need a <Hotspot> wrapper.
   ========================================================================= */
const S = { stroke: T.cocoa, strokeWidth: 3.2, strokeLinejoin: "round", strokeLinecap: "round" };

function DeskArt() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-auto">
      <rect x="4" y="18" width="232" height="16" rx="7" fill={T.wood} {...S} />
      <rect x="18" y="34" width="70" height="88" rx="7" fill={T.woodDark} {...S} />
      <rect x="152" y="34" width="70" height="88" rx="7" fill={T.woodDark} {...S} />
      {[52, 76, 100].map((y) => <rect key={y} x="26" y={y} width="54" height="16" rx="5" fill={T.cream} {...S} />)}
      {[52, 76, 100].map((y) => <rect key={"b" + y} x="160" y={y} width="54" height="16" rx="5" fill={T.cream} {...S} />)}
    </svg>
  );
}

function ChairArt() {
  return (
    <svg viewBox="0 0 90 130" className="w-full h-auto">
      <rect x="16" y="6" width="58" height="60" rx="14" fill={T.sage} {...S} />
      <rect x="8" y="62" width="74" height="18" rx="8" fill={T.moss} {...S} />
      <path d="M18 80v42M72 80v42" fill="none" {...S} />
    </svg>
  );
}

function ShelfArt() {
  return (
    <svg viewBox="0 0 160 70" className="w-full h-auto">
      <rect x="4" y="46" width="152" height="12" rx="5" fill={T.wood} {...S} />
      {[
        [18, T.rose], [30, T.butter], [42, T.sage], [54, T.sky], [66, T.blush],
      ].map(([x, c], i) => (
        <rect key={i} x={x} y={46 - (i % 2 ? 32 : 38)} width="11" height={i % 2 ? 32 : 38} rx="3" fill={c} {...S} />
      ))}
      <ellipse cx="122" cy="34" rx="20" ry="14" fill={T.sage} {...S} />
      <path d="M122 34c8-10 18-12 18-12" fill="none" {...S} />
    </svg>
  );
}

function LampArt() {
  return (
    <svg viewBox="0 0 70 96" className="w-full h-auto">
      <path d="M14 34h42l-8-24H22z" fill={T.butter} {...S} />
      <path d="M35 34v46" fill="none" {...S} />
      <ellipse cx="35" cy="84" rx="20" ry="8" fill={T.wood} {...S} />
    </svg>
  );
}

function SofaArt() {
  return (
    <svg viewBox="0 0 260 130" className="w-full h-auto">
      <rect x="8" y="30" width="244" height="60" rx="20" fill={T.blush} {...S} />
      <rect x="24" y="54" width="212" height="46" rx="16" fill={T.rose} {...S} />
      <rect x="4" y="48" width="34" height="54" rx="14" fill={T.blush} {...S} />
      <rect x="222" y="48" width="34" height="54" rx="14" fill={T.blush} {...S} />
      <path d="M40 102v18M220 102v18" fill="none" {...S} />
      <rect x="70" y="40" width="42" height="34" rx="10" fill={T.butter} {...S} transform="rotate(-8 91 57)" />
    </svg>
  );
}

function TableArt() {
  return (
    <svg viewBox="0 0 170 80" className="w-full h-auto">
      <rect x="6" y="10" width="158" height="14" rx="7" fill={T.wood} {...S} />
      <path d="M28 24v46M142 24v46M28 60h114" fill="none" {...S} />
    </svg>
  );
}

function CounterArt() {
  return (
    <svg viewBox="0 0 220 100" className="w-full h-auto">
      <rect x="4" y="16" width="212" height="14" rx="6" fill={T.paper} {...S} />
      <rect x="14" y="30" width="192" height="62" rx="8" fill={T.butter} {...S} />
      <path d="M110 30v62" fill="none" {...S} />
      <circle cx="72" cy="52" r="4" fill={T.cocoa} />
      <circle cx="148" cy="52" r="4" fill={T.cocoa} />
    </svg>
  );
}

function KettleArt() {
  return (
    <svg viewBox="0 0 70 60" className="w-full h-auto">
      <path d="M12 24h40a6 6 0 016 6v18a8 8 0 01-8 8H14a8 8 0 01-8-8V30a6 6 0 016-6z" fill={T.rose} {...S} />
      <path d="M22 24c0-8 6-12 13-12s13 4 13 12" fill="none" {...S} />
      <path d="M58 32c8 2 8 14 0 16" fill="none" {...S} />
    </svg>
  );
}

function PotPlantArt({ c = T.sage }) {
  return (
    <svg viewBox="0 0 80 100" className="w-full h-auto">
      <g className="dh-sway">
        <path d="M40 56V22M40 36c-12-2-16-14-16-14s12-4 16 14zM40 42c12-4 16-16 16-16s-12-4-16 16z" fill={c} {...S} />
      </g>
      <path d="M22 58h36l-5 34a7 7 0 01-7 6H34a7 7 0 01-7-6z" fill={T.blush} {...S} />
    </svg>
  );
}

/** The visitor — swap for your own Sylvanian-style doll cut-out PNG. */
function KwunFigure() {
  return (
    <svg viewBox="0 0 150 200" className="w-full h-auto" style={{ filter: "drop-shadow(0 8px 0 rgba(110,78,57,.16))" }}>
      <ellipse cx="75" cy="190" rx="52" ry="9" fill="rgba(110,78,57,.18)" stroke="none" />
      <path d="M40 190c0-38 14-62 35-62s35 24 35 62z" fill={T.rose} {...S} />
      <path d="M42 150c-14 6-20 22-20 34M108 150c14 6 20 22 20 34" fill="none" {...S} />
      <circle cx="75" cy="96" r="34" fill={T.paper} {...S} />
      <path d="M41 92c0-24 15-38 34-38s34 14 34 38c-8-10-20-14-34-14s-26 4-34 14z" fill={T.cocoa} {...S} />
      <circle cx="63" cy="100" r="3.6" fill={T.ink} stroke="none" />
      <circle cx="87" cy="100" r="3.6" fill={T.ink} stroke="none" />
      <path d="M69 110c4 4 8 4 12 0" fill="none" stroke={T.ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="108" r="5" fill={T.blush} stroke="none" opacity=".85" />
      <circle cx="95" cy="108" r="5" fill={T.blush} stroke="none" opacity=".85" />
    </svg>
  );
}

/* =========================================================================
   PERSISTENT HEADER
   ========================================================================= */
const ZONES = [
  { id: "study", label: "Study" },
  { id: "living", label: "Living Room" },
  { id: "kitchen", label: "Kitchen" },
];

function SiteHeader({ onJump, onOpenMail }) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3"
      style={{ background: "rgba(253,247,238,0.9)", backdropFilter: "blur(10px)", borderBottom: `2px solid ${T.cocoa}` }}
    >
      <div style={{ ...serif, fontWeight: 700, fontSize: "clamp(13px,2.4vw,16px)", color: T.ink, letterSpacing: "0.01em" }}>
        PAKWUN J. <span style={{ color: T.rose }}>(KWUN)</span>
      </div>
      <nav className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden sm:flex items-center gap-1.5">
          {ZONES.map((z) => (
            <button
              key={z.id}
              onClick={() => onJump(z.id)}
              className="transition-transform hover:-translate-y-0.5"
              style={{ ...label, fontSize: 10, color: T.cocoa, background: "transparent", border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 99 }}
            >
              {z.label}
            </button>
          ))}
        </div>
        {/* Aesthetic mailbox / contact icon — always visible */}
        <button
          onClick={onOpenMail}
          aria-label="Contact me"
          className="flex items-center justify-center transition-transform hover:-translate-y-0.5"
          style={{ width: 34, height: 34, borderRadius: 99, background: T.rose, border: `2px solid ${T.cocoa}`, color: T.paper, cursor: "pointer" }}
        >
          <Mail size={15} strokeWidth={2.6} />
        </button>
      </nav>
    </header>
  );
}

/* =========================================================================
   SCENE 1 — EXTERIOR LANDING
   A wall of tiny arched, balconied windows — you kneel in front of it and
   peek in, echoing a real dollhouse cabinet. Reference: a visitor kneeling
   on a carpet in front of a lit window-grid facade; a grand arched-window
   building elevation for the balcony/cornice detailing.
   ========================================================================= */

/** One arched, balconied window in the facade. `tint` hints at the zone behind it. */
function FacadeWindow({ x, y, w, h, tint }) {
  const r = w / 2;
  const straight = h - r;
  return (
    <g>
      <path d={`M${x} ${y + h} v${-straight} a${r} ${r} 0 01 ${w} 0 v${straight} z`} fill={tint.wall} {...S} />
      {/* a small glow/prop peeking through the glass — swap for a tiny scene thumbnail later */}
      <circle cx={x + w / 2} cy={y + h * 0.42} r={w * 0.16} fill={tint.glow} {...S} strokeWidth="2" />
      <path d={`M${x + w / 2} ${y + r}v${straight}`} stroke={T.cocoa} strokeWidth="2" />
      {/* balcony rail */}
      <path d={`M${x - 6} ${y + h}h${w + 12}`} stroke={T.wood} strokeWidth="7" strokeLinecap="round" />
      <rect x={x - 4} y={y + h + 3} width={w + 8} height={12} rx={5} fill={T.sage} {...S} strokeWidth="2" />
      {[0.22, 0.5, 0.78].map((f) => (
        <circle key={f} cx={x + w * f} cy={y + h + 9} r="3.2" fill={T.paper} stroke={T.cocoa} strokeWidth="1.6" />
      ))}
    </g>
  );
}

const FACADE_TINTS = [
  { wall: "#F6EEDF", glow: T.butter }, // study, warm
  { wall: T.blush, glow: T.rose },     // living room, blush
  { wall: "#E3EEF3", glow: T.sky },    // kitchen, cool
];

/** The whole building elevation — a 3×3 grid of the windows above. */
function DollhouseFacade() {
  const cols = [58, 198, 338];
  const rows = [34, 128, 222];
  const winW = 84, winH = 72;
  return (
    <svg viewBox="0 0 480 320" className="w-full h-auto" style={{ filter: "drop-shadow(0 14px 0 rgba(110,78,57,.16))" }}>
      {/* dark cornice cap */}
      <rect x="10" y="0" width="460" height="16" rx="4" fill={T.cocoa} />
      <rect x="16" y="12" width="448" height="296" rx="6" fill={T.paper} {...S} />
      {rows.map((y) => cols.map((x, ci) => <FacadeWindow key={`${x}-${y}`} x={x} y={y} w={winW} h={winH} tint={FACADE_TINTS[ci]} />))}
    </svg>
  );
}

function Exterior({ onEnter, zooming }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #EFE7EF 0%, #EFE7EF 58%, #D9A9A6 58%, #C98F8E 100%)",
        transform: zooming ? "scale(4.2)" : "scale(1)",
        transformOrigin: "58% 44%",
        opacity: zooming ? 0 : 1,
        transition: "transform 1.5s cubic-bezier(.6,0,.35,1), opacity 1.5s ease-in 0.35s",
      }}
    >
      {/* a hint of the room the visitor is kneeling in — a framed picture on the wallpaper */}
      <div className="absolute top-[10%] left-[6%] w-[9%]">
        <svg viewBox="0 0 60 74" className="w-full h-auto">
          <rect x="4" y="4" width="52" height="66" rx="4" fill={T.paper} {...S} />
          <circle cx="30" cy="30" r="12" fill={T.blush} {...S} />
        </svg>
      </div>

      {/* ===== THE DOLLHOUSE FACADE — a wall of tiny arched, balconied windows ===== */}
      {/* Replace with: <img src="/assets/house-exterior.png" alt="" className="w-full" /> */}
      <button
        onClick={onEnter}
        className="absolute top-[42%] left-[58%] w-[52%] -translate-x-1/2 -translate-y-1/2 group"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        aria-label="Enter Dollhouse"
      >
        <span className="block transition-transform duration-500 group-hover:scale-105">
          <DollhouseFacade />
        </span>
      </button>

      {/* ===== KWUN, KNEELING, LOOKING IN ===== */}
      {/* Replace with: <img src="/assets/kwun-cutout.png" alt="" className="w-full" /> */}
      <div className="absolute bottom-[3%] left-[9%] w-[19%]">
        <KwunFigure />
      </div>

      {/* ===== CALL TO ACTION ===== */}
      <div className="absolute w-full text-center px-4 bottom-[6%]">
        <button
          onClick={onEnter}
          className="transition-all duration-200 hover:translate-y-1 dh-float"
          style={{
            ...serif, fontSize: "clamp(15px,2.4vw,22px)", fontWeight: 600, color: T.ink,
            background: T.butter, border: `3px solid ${T.cocoa}`, borderRadius: 99,
            padding: "12px 26px", boxShadow: `0 6px 0 ${T.cocoa}`, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 10,
          }}
        >
          <Sparkles size={18} strokeWidth={2.4} />
          Enter Dollhouse
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   SCENE 2 — THE CUTAWAY INTERIOR (3 zones)
   ========================================================================= */
function Room({ className = "", wall, floor, name, highlighted, children }) {
  return (
    <div
      className={`relative overflow-hidden ${highlighted ? "dh-highlight" : ""} ${className}`}
      style={{ background: wall, borderRight: `2px solid ${T.cocoa}`, borderBottom: `2px solid ${T.cocoa}` }}
    >
      <div className="absolute bottom-0 left-0 w-full h-[16%]" style={{ background: floor, borderTop: `3px solid ${T.cocoa}` }} />
      <div className="absolute top-2 left-2.5" style={{ ...label, fontSize: 9, color: T.cocoa, opacity: 0.55 }}>{name}</div>
      {children}
    </div>
  );
}

/* --- Zone 1: Study desk (strategy & marketing portfolio) --- */
const JOURNAL_PAGES = [
  { cover: true },
  {
    kicker: "About me", title: "Hello, I'm Kwun", meta: "Bangkok, Thailand",
    body: (
      <>
        <p style={{ ...sans, fontSize: 12.5, fontStyle: "italic", lineHeight: 1.55, color: T.cocoa }}>
          &ldquo;I'm passionate about how creativity meets business — especially where data,
          partnership, and audience insights come together to build meaningful connections
          between artists and brands.&rdquo;
        </p>
        <p className="mt-2.5" style={{ ...sans, fontSize: 13, lineHeight: 1.55, color: T.ink }}>
          A senior in Srinakharinwirot University's B.A. programme in Cinema &amp; Digital Media
          Management. Through COSCI, UWE Bristol, Warner Bros. (FE) Inc., and Universal Music
          Thailand, I've built a foundation in content creation, marketing strategy, and brand
          storytelling.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat big="3.96" small="Cumulative GPA" />
          <Stat big="Senior" small="Class of 2026" />
        </div>
      </>
    ),
  },
  {
    kicker: "Experience · 2026", title: "Universal Music Thailand", meta: "Content Creative Intern, Domestic Marketing",
    body: (
      <>
        <div className="grid grid-cols-3 gap-1.5">
          <Stat big="2.72M+" small="Verified views" />
          <Stat big="265K+" small="Engagements" />
          <Stat big="฿1.55–1.75M" small="Est. EMV" />
        </div>
        <ul className="mt-3 space-y-1.5">
          <Bullet>Adapted global label strategies for Thai market engagement using streaming trends and fan-culture insights</Bullet>
          <Bullet>Produced 29 core promotional assets plus 20 cross-posted collaborative features across Instagram, TikTok, Facebook and YouTube</Bullet>
          <Bullet>Drove rollout campaigns for PUN, SCRUBB, Violette Wautier, Tobii, Patrick and Kwanjai</Bullet>
          <Bullet>Sourced 485 prospective KOLs and coordinated 43 creators for the MUSEUM OF SOMNIA (PUN Exhibition)</Bullet>
        </ul>
      </>
    ),
  },
  {
    kicker: "Experience · 2023–2025", title: "Warner Bros. (FE) Inc.", meta: "Film Distribution & Marketing Intern",
    body: (
      <>
        <ul className="space-y-1.5">
          <Bullet>Learned the full theatrical distribution pipeline — annual import planning, sub/dub localisation, and nationwide releases</Bullet>
          <Bullet>Helped plan the Superman premiere, including crisis management through unexpected PR challenges</Bullet>
          <Bullet>Voiced a role in <em>The Boy and the Heron</em> and observed the dubbing process on other titles for cultural adaptation</Bullet>
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["The Flash", "Barbie", "Aquaman", "Furiosa", "F1", "Superman"].map((t) => (
            <span key={t} style={{ ...sans, fontSize: 11.5, fontWeight: 700, color: T.ink, background: T.butter, border: `2px solid ${T.cocoa}`, borderRadius: 99, padding: "3px 10px" }}>{t}</span>
          ))}
        </div>
      </>
    ),
  },
  {
    kicker: "Study abroad · 2024", title: "UWE Bristol, UK", meta: "Filmmaking Summer School",
    body: (
      <>
        <ul className="space-y-1.5">
          <Bullet>Directed the short film <em>The Best Love</em> as the final project — scriptwriting, costume &amp; props design, and camera operation</Bullet>
          <Bullet>Worked with a small crew of four and a cast of three over the two-week programme at the University of the West of England</Bullet>
          <Bullet>Collaborated with international students, sharpening adaptability and teamwork in a multicultural production environment</Bullet>
        </ul>
        <div className="mt-4" style={{ background: T.cream, border: `2px dashed ${T.cocoa}`, borderRadius: 12, padding: 12 }}>
          <div style={{ ...label, fontSize: 9, color: T.cocoa }}>Director</div>
          <div style={{ ...serif, fontSize: 17, fontWeight: 700, color: T.ink }}>The Best Love (2024)</div>
        </div>
      </>
    ),
  },
  {
    kicker: "Competition · 2024–2025", title: "J-MAT Marketing Awards #33 & #34", meta: "Dentiste (2024) · Hi-Herb (2025)",
    body: (
      <>
        <ul className="space-y-1.5">
          <Bullet>Built marketing plans with SWOT analysis, market segmentation and brand positioning for both brands</Bullet>
          <Bullet>Created key messages, visuals, and a 1-year / 3-year growth roadmap for each</Bullet>
          <Bullet>Selected as one of the top 24 finalist teams out of 427 entries in J-MAT Award #34</Bullet>
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat big="#33" small="Dentiste" />
          <Stat big="#34" small="Hi-Herb" />
        </div>
      </>
    ),
  },
  {
    kicker: "Education", title: "Srinakharinwirot University", meta: "B.A. Cinema & Digital Media Management",
    body: (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Stat big="3.96" small="Cumulative GPA" />
          <Stat big="Senior" small="Class of 2026" />
        </div>
        <ul className="mt-3 space-y-1.5">
          <Bullet>Academic Excellence Scholarship, 2025 &amp; 2026 — ranked #1 in major</Bullet>
          <Bullet>The scholarship included a fully-funded trip representing the faculty at COMPUTEX 2025, Taiwan (Intel Pavilion)</Bullet>
        </ul>
        <p className="mt-3" style={{ ...sans, fontSize: 12, color: T.cocoa }}>
          There's more on the desk — a trophy for other awards, and a globe for languages and travel.
        </p>
      </>
    ),
  },
];

function useWide(px = 760) {
  const [wide, setWide] = useState(typeof window !== "undefined" ? window.innerWidth >= px : true);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= px);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [px]);
  return wide;
}

function Stat({ big, small }) {
  return (
    <div style={{ background: T.cream, border: `2px solid ${T.cocoa}`, borderRadius: 12, padding: "7px 11px" }}>
      <div style={{ ...serif, fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{big}</div>
      <div style={{ ...label, fontSize: 8.5, color: T.cocoa, marginTop: 3 }}>{small}</div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex gap-2" style={{ ...sans, fontSize: 13.5, lineHeight: 1.55, color: T.ink }}>
      <span style={{ color: T.rose, fontWeight: 800 }}>·</span>
      <span>{children}</span>
    </li>
  );
}

function JPage({ page }) {
  if (page.cover) {
    return (
      <div className="dh-fade relative flex flex-col items-center justify-center text-center h-full gap-3" style={{ background: T.rose, borderRadius: 14, border: `2.5px solid ${T.cocoa}`, padding: "22px", boxShadow: "inset 0 0 0 6px rgba(255,255,255,.5)", minHeight: 360 }}>
        <div className="w-[36%]"><EmojiTile emoji="📖" bg={T.paper} /></div>
        <div style={{ ...label, color: T.paper, opacity: 0.85 }}>Portfolio journal · 2026</div>
        <h3 style={{ ...serif, fontSize: 30, fontWeight: 700, color: T.paper, lineHeight: 1.05 }}>Pakwun<br />Jindarat</h3>
        <p style={{ ...sans, fontSize: 13, color: T.paper, maxWidth: 250 }}>Strategy, marketing and stories that travel. Turn the page.</p>
      </div>
    );
  }
  return (
    <div className="dh-fade relative flex flex-col h-full" style={{ background: T.paper, borderRadius: 14, border: `2.5px solid ${T.cocoa}`, padding: "20px 20px 26px", boxShadow: "inset 0 0 0 6px rgba(255,255,255,.5)", minHeight: 360 }}>
      <div style={{ ...label, color: T.rose }}>{page.kicker}</div>
      <h3 className="mt-1" style={{ ...serif, fontSize: 21, fontWeight: 700, color: T.ink, lineHeight: 1.15 }}>{page.title}</h3>
      {page.meta && <div className="mt-1" style={{ ...sans, fontSize: 12, fontWeight: 700, color: T.moss }}>{page.meta}</div>}
      <div className="mt-3 flex-1">{page.body}</div>
    </div>
  );
}

function JournalModal({ open, onClose }) {
  const wide = useWide();
  const [i, setI] = useState(0);
  const step = wide ? 2 : 1;
  const max = Math.max(0, JOURNAL_PAGES.length - step);
  const go = (d) => setI((v) => Math.min(max, Math.max(0, v + d * step)));
  useEffect(() => { if (open) setI(0); }, [open]);

  return (
    <Modal open={open} onClose={onClose} maxWidth={880} tone={T.cream}>
      <ModalHeader eyebrow="Study · the desk journal" title="Kwun's portfolio journal" sub="Flip through — case studies, awards, and education." />
      <div className="dh-scroll flex-1 overflow-y-auto p-4 sm:p-7" style={{ background: T.cream }}>
        <div key={i} className="grid gap-4" style={{ gridTemplateColumns: wide ? "1fr 1fr" : "1fr" }}>
          {JOURNAL_PAGES.slice(i, i + step).map((p, k) => <JPage key={i + k} page={p} />)}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-7" style={{ background: T.blush, borderTop: `3px solid ${T.cocoa}` }}>
        <Button onClick={() => go(-1)} tone={T.paper}><ChevronLeft size={16} strokeWidth={3} /> Back</Button>
        <div className="flex gap-1.5">
          {Array.from({ length: Math.ceil(JOURNAL_PAGES.length / step) }).map((_, d) => (
            <span key={d} style={{ width: d * step === i ? 20 : 8, height: 8, borderRadius: 99, background: d * step === i ? T.cocoa : "rgba(110,78,57,.3)", transition: "width .25s" }} />
          ))}
        </div>
        <Button onClick={() => go(1)} tone={T.butter}>Next <ChevronRight size={16} strokeWidth={3} /></Button>
      </div>
    </Modal>
  );
}

const STUDY_TRINKETS = {
  achievements: {
    tag: "Achievements",
    title: "A shelf of small wins",
    lines: [
      "Academic Excellence Scholarship (2025 & 2026) — ranked #1 in major with a 3.96 GPA.",
      "Children and Youth Group Award (2019) — Thailand's National Outstanding Youth Award, for arts, culture & music with the Chulada Choir.",
      "TALENTED Screenwriting Program — 1 of 40 national finalists (2025).",
      "Silver Medal, National German Olympics (2022) — 10th place for German skills, video editing, presentation & collaboration.",
    ],
  },
  global: {
    tag: "Global & languages",
    title: "Passport stamps & languages",
    lines: [
      "🇨🇳 Thai–Chinese Exchange, South China Normal University (2018).",
      "🇵🇱 CIOFF Folklore Festival, Nowy Sącz, Poland (2018) — performed traditional Thai dance.",
      "🇺🇸 Thai–USA Cultural Exchange, Pittsburgh, PA (2019) — Upper St. Clair High School.",
      "🇬🇧 English course at Nacel English School, London (2023) — CEFR B2.",
      "Languages: English B2 (CUTEP 89/120) · German B1 (Fit in Deutsch 83/100) · Korean Level 2 (TOPIK I 163/200).",
    ],
  },
  skills: {
    tag: "Skills",
    title: "What's in my toolkit",
    lines: [
      "Infographic design — informative visuals for storytelling and marketing.",
      "Adobe Illustrator, Canva, Procreate & Inshot — layout and social content tools.",
      "Wix — designed and manage my own portfolio site.",
      "Public speaking — emcee work, speech & debate, COSCI New Gen 2023.",
      "Leadership & time management — film sets, university clubs, and event coordination.",
    ],
  },
};

const BOOKSHELF_PROJECTS = [
  { emoji: "👗", title: "Lost Shirt and Bought", year: "2023–2024", tag: "Film marketing", desc: "Distribution & marketing strategy for a student project film, built on product evaluation, market positioning and competitive analysis." },
  { emoji: "📜", title: "Script Analysis: Eternity", year: "2023–2024", tag: "Screenwriting", desc: "Analysed themes, character dynamics and visual design — sharpening script analysis and storytelling skills." },
  { emoji: "🎤", title: "T-POP Research", year: "2023–2024", tag: "Industry research", desc: "Studied the K-POP model's casting, training, producing and promoting systems, proposing strategies for T-POP's global appeal." },
  { emoji: "🍜", title: "Yoshinoya Pitch", year: "2023–2024", tag: "Campaign · won", desc: "Branding, audience and campaign strategy plus mock-up event models — the team's pitch won, judged by Yoshinoya and Central Group marketers." },
  { emoji: "🎞️", title: "Journal Book", year: "2022–2023", tag: "Film criticism", desc: "Critiqued 16 films through formalism, realism and feminism, sharpening cinematic analysis skills." },
  { emoji: "🗺️", title: "Bangkok a-doodle-doo", year: "2023", tag: "Travel media", desc: "Field research in the Phra Nakhon district, a travel vlog, and a mock tourism social account — visual storytelling meets field research." },
  { emoji: "🎭", title: "ICH SO DU SO", year: "2022", tag: "International theatre", desc: "Represented Thailand in a month-long online theatre workshop with 9 countries, co-creating a short play about unity and identity." },
];

function BookshelfModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={620}>
      <ModalHeader eyebrow="Study · the bookshelf" title="A few more projects" sub="Smaller case studies, research, and a bit of theatre." bg={T.sage} />
      <div className="dh-scroll flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
        {BOOKSHELF_PROJECTS.map((p) => (
          <div key={p.title} className="flex gap-3" style={{ background: T.paper, border: `2px solid ${T.cocoa}`, borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>{p.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div style={{ ...serif, fontWeight: 700, fontSize: 14, color: T.ink }}>{p.title}</div>
                <div style={{ ...sans, fontSize: 10.5, color: T.cocoa, opacity: 0.7 }}>{p.year}</div>
              </div>
              <div style={{ ...label, fontSize: 8, color: T.rose, marginTop: 1 }}>{p.tag}</div>
              <p style={{ ...sans, fontSize: 11.5, color: T.cocoa, marginTop: 3, lineHeight: 1.4 }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function StudyZone({ highlighted }) {
  const [journalOpen, setJournalOpen] = useState(false);
  const [bookshelfOpen, setBookshelfOpen] = useState(false);
  const [openTrinket, setOpenTrinket] = useState(null); // 'achievements' | 'global' | 'skills' | null
  const toggle = (id) => setOpenTrinket((v) => (v === id ? null : id));

  return (
    <Room className="col-span-1 row-span-1" wall="#F6EEDF" floor={T.wood} name="Study" highlighted={highlighted}>
      {/* ambient furniture */}
      <div className="absolute top-[14%] left-[6%] w-[38%]"><ShelfArt /></div>
      <div className="absolute top-[28%] left-[68%] w-[13%]"><LampArt /></div>
      <div className="absolute top-[54%] left-[18%] w-[60%]"><DeskArt /></div>
      <div className="absolute top-[52%] left-[76%] w-[17%]"><ChairArt /></div>

      {/* STUDY: notebook / flipbook hotspot — swap emoji for <img src="/assets/notebook.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[50%] left-[38%] w-[13%]" label="Open my journal" onClick={() => setJournalOpen(true)} float>
        <EmojiTile emoji="📖" bg={T.rose} />
      </Hotspot>

      {/* STUDY: more books on the shelf — university projects, research & theatre — swap emoji for <img src="/assets/books.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[18%] left-[15%] w-[7%]" label="More projects" onClick={() => setBookshelfOpen(true)}>
        <EmojiTile emoji="📚" bg={T.sage} small />
      </Hotspot>

      {/* STUDY EASTER EGG: trophy — achievements & awards — swap emoji for <img src="/assets/trophy.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[30%] left-[74%] w-[9%]" label="Achievements" onClick={() => toggle("achievements")}>
        <EmojiTile emoji="🏆" bg={T.butter} small />
      </Hotspot>

      {/* STUDY EASTER EGG: globe — languages & global experiences — swap emoji for <img src="/assets/globe.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[19%] left-[26%] w-[8%]" label="Languages & travel" onClick={() => toggle("global")}>
        <EmojiTile emoji="🌍" bg={T.sky} small />
      </Hotspot>

      {/* STUDY EASTER EGG: click Kwun herself — skills — swap for <img src="/assets/kwun-study-pose.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[38%] left-[90%] w-[14%]" label="My skills" onClick={() => toggle("skills")}>
        <KwunFigure />
      </Hotspot>

      {openTrinket && (
        <Popover open onClose={() => setOpenTrinket(null)} anchorClassName="top-[6%] left-[44%]" width={250}>
          <div style={{ ...label, fontSize: 8.5, color: T.rose }}>{STUDY_TRINKETS[openTrinket].tag}</div>
          <div style={{ ...serif, fontWeight: 700, fontSize: 14, color: T.ink, marginTop: 2 }}>{STUDY_TRINKETS[openTrinket].title}</div>
          <ul className="mt-1.5 space-y-1">
            {STUDY_TRINKETS[openTrinket].lines.map((l, i) => (
              <li key={i} className="flex gap-1.5" style={{ ...sans, fontSize: 11, color: T.cocoa, lineHeight: 1.4 }}>
                <span style={{ color: T.rose, fontWeight: 800 }}>·</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </Popover>
      )}

      <JournalModal open={journalOpen} onClose={() => setJournalOpen(false)} />
      <BookshelfModal open={bookshelfOpen} onClose={() => setBookshelfOpen(false)} />
    </Room>
  );
}

/* --- Zone 2: Living room & mini cinema (film, media, daily vibe) --- */
const PLAYLIST_URL = "https://music.apple.com/th/playlist/feeling-like-a-no-1/pl.u-MDAWWE6CWa6kE1g";

const DAILY_QUOTES = [
  // fresh starts
  { mood: "fresh", text: "A brand new day is blooming just for you." },
  { mood: "fresh", text: "Today is a blank page — write something kind on it." },
  { mood: "fresh", text: "Small beginnings still count as beginnings." },
  { mood: "fresh", text: "The morning light is quietly rooting for you." },
  // confidence
  { mood: "confidence", text: "You're the main character in today's story." },
  { mood: "confidence", text: "Trust the version of you that's still becoming." },
  { mood: "confidence", text: "Confidence looks good on you today." },
  { mood: "confidence", text: "You don't need permission to take up space." },
  // cozy comfort
  { mood: "cozy", text: "Slow down — the cozy moments are the real ones." },
  { mood: "cozy", text: "You're allowed to rest without earning it first." },
  { mood: "cozy", text: "Warm tea, soft light, gentle pace. That's enough today." },
  { mood: "cozy", text: "Comfort is not the opposite of ambition." },
  // creativity
  { mood: "creativity", text: "An exciting little adventure is waiting for you today." },
  { mood: "creativity", text: "Your weird little ideas are usually the good ones." },
  { mood: "creativity", text: "Make something today just because it's fun." },
];

function pickRandom(list, excludeKey, keyOf) {
  if (list.length <= 1) return list[0];
  let pick;
  do { pick = list[Math.floor(Math.random() * list.length)]; } while (keyOf(pick) === excludeKey);
  return pick;
}

const VIDEO_PROJECTS = [
  {
    title: "The Best Love", year: "2024", tag: "Director", emoji: "🎬",
    desc: "Directed end-to-end during UWE Bristol's Filmmaking Summer School — script, shoot, and final cut.",
  },
  {
    title: "To Be Heard", year: "2024", tag: "Producer", emoji: "🎭",
    desc: "Original musical drama student film, developed from concept to pilot teaser — plus the market analysis and integrated marketing & distribution plan behind it, for Thai and international audiences.",
  },
  {
    title: "Cherrie", year: "2024", tag: "Production support", emoji: "🍒",
    desc: "Short film showcasing teamwork and technical skills — worked in catering, actor support, and sound, learning production-set management and behind-the-scenes collaboration.",
  },
  {
    title: "Symphony of Light", year: "2023", tag: "Actor", emoji: "🕯️",
    desc: "Acted in the short film and contributed to its concept and performance.",
  },
  {
    title: "(not close) Friends Contest", year: "2023", tag: "Actor · Music video", emoji: "🎶",
    desc: "Acted in the music video and contributed to its concept and performance, alongside Symphony of Light.",
  },
  {
    title: "Pin's Music", year: "2022", tag: "Producer · Scriptwriter", emoji: "🥁",
    desc: "Short film เพลงของพิณพาทย์ for a national competition — produced, scripted, and coached acting on a real drama shooting set.",
  },
];

function CinemaModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={760}>
      <ModalHeader eyebrow="Living room · the mini cinema" title="Watch my work" sub="Short films, productions and reviews — press play." bg={T.sky} />
      <div className="dh-scroll flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {VIDEO_PROJECTS.map((v) => (
            <div key={v.title} style={{ background: T.paper, border: `2.5px solid ${T.cocoa}`, borderRadius: 16, padding: 14 }}>
              {/* Replace this thumbnail block with: <img src="/assets/video-thumb.png" alt="" className="w-full aspect-video object-cover rounded-lg" /> */}
              <div className="flex items-center justify-center aspect-video rounded-lg" style={{ background: T.cream, border: `2px dashed ${T.cocoa}`, fontSize: 34 }}>
                {v.emoji}
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <div style={{ ...serif, fontWeight: 700, fontSize: 15, color: T.ink }}>{v.title}</div>
                <div style={{ ...sans, fontSize: 11, color: T.cocoa, opacity: 0.7 }}>{v.year}</div>
              </div>
              <div style={{ ...label, fontSize: 8.5, color: T.rose, marginTop: 2 }}>{v.tag}</div>
              <p style={{ ...sans, fontSize: 12, color: T.cocoa, marginTop: 5, lineHeight: 1.45 }}>{v.desc}</p>
              {/* Swap href="#" for the real video URL (YouTube / Vimeo / hosted file) */}
              <a
                href="#"
                className="mt-3 inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5"
                style={{ ...sans, fontSize: 11.5, fontWeight: 800, color: T.ink, background: T.butter, border: `2px solid ${T.cocoa}`, borderRadius: 99, padding: "5px 12px" }}
              >
                ▶ Watch
              </a>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function VinylBubble({ open, onClose, anchorClassName }) {
  const [entry, setEntry] = useState(null);

  const shuffle = useCallback(() => {
    setEntry((prev) => ({
      track: pickRandom(TRACKS, prev?.track?.id, (t) => t.id),
      quote: pickRandom(DAILY_QUOTES, prev?.quote?.text, (q) => q.text),
    }));
  }, []);

  useEffect(() => {
    if (open) shuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Popover open={open} onClose={onClose} anchorClassName={anchorClassName} width={220}>
      {/* typewriter-style daily quote note */}
      <p style={{ ...sans, fontStyle: "italic", fontSize: 12.5, color: T.cocoa, lineHeight: 1.4 }}>
        &ldquo;{entry?.quote?.text}&rdquo;
      </p>
      <div className="mt-2.5 pt-2.5" style={{ borderTop: `1.5px dashed ${T.cocoa}` }}>
        <div style={{ ...serif, fontWeight: 700, fontSize: 14, color: T.ink }}>{entry?.track?.title}</div>
        <div style={{ ...sans, fontSize: 11, color: T.cocoa }}>{entry?.track?.artists}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button onClick={shuffle} tone={T.blush} compact><Shuffle size={12} strokeWidth={2.8} /> Shuffle</Button>
        <Button as="a" href={PLAYLIST_URL} tone={T.cream} compact><ExternalLink size={12} strokeWidth={2.8} /> Apple Music</Button>
      </div>
    </Popover>
  );
}

function LivingZone({ highlighted }) {
  const [cinemaOpen, setCinemaOpen] = useState(false);
  const [vinylOpen, setVinylOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const toggleVinyl = () => {
    setVinylOpen((v) => !v);
    setSpinning(true);
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <Room className="col-span-1 row-span-1" wall={T.blush} floor={T.woodDark} name="Living room" highlighted={highlighted}>
      {/* ambient furniture */}
      <div className="absolute top-[52%] left-[4%] w-[46%]"><SofaArt /></div>
      <div className="absolute top-[70%] left-[56%] w-[32%]"><TableArt /></div>

      {/* LIVING ROOM: retro TV / mini cinema hotspot — swap emoji for <img src="/assets/retro-tv.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[28%] left-[26%] w-[15%]" label="Watch my work" onClick={() => setCinemaOpen(true)} float>
        <EmojiTile emoji="📺" bg={T.sky} />
      </Hotspot>

      {/* LIVING ROOM: vinyl player hotspot — swap emoji for <img src="/assets/vinyl-player.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[58%] left-[74%] w-[12%]" label="Shuffle a track" onClick={toggleVinyl}>
        <span className={spinning ? "block dh-vinyl-spin" : "block"}>
          <EmojiTile emoji="💿" bg={T.vinyl} small />
        </span>
      </Hotspot>
      <VinylBubble open={vinylOpen} onClose={() => setVinylOpen(false)} anchorClassName="top-[18%] left-[50%]" />

      <CinemaModal open={cinemaOpen} onClose={() => setCinemaOpen(false)} />
    </Room>
  );
}

/* --- Zone 3: Kitchen & dining (branding & design easter eggs) --- */
const KITCHEN_TRINKETS = {
  bowl: {
    tag: "Branding", title: "CERAÏS ceramic bowl",
    desc: "Brand strategy & identity concept for a skincare line — naming, palette and packaging built around a ceramic, tactile feel.",
  },
  candy: {
    tag: "Packaging", title: "Milky candy box",
    desc: "Redesigned Milky's packaging, blending Impressionist art, Ghibli-style illustration and embroidery aesthetics into a nostalgic, playful look — a Concept & Design Innovation course project favouring reinterpretation over imitation.",
  },
  book: {
    tag: "Editorial", title: "“In Their Eyes”",
    desc: "A book cover concept, under the theme “Horror is a Good Thing,” reimagining horror as a comforting presence through a child and her imaginary friend — coloured-pencil textures balancing innocence and quiet unease.",
  },
  washer: {
    tag: "Creative direction", title: "Loop the Look",
    desc: "A visual campaign reintroducing The Chemical Brothers' “Do It Again” to Gen Z through remix culture and sustainable fashion — Y2K nostalgia meets anti-fast-fashion, told through collage and retro-futuristic design.",
  },
};

function KitchenZone({ highlighted }) {
  const [open, setOpen] = useState(null);
  const toggle = (id) => setOpen((v) => (v === id ? null : id));

  return (
    <Room className="col-span-2 row-span-1" wall="#E3EEF3" floor="#EFE0CE" name="Kitchen & dining" highlighted={highlighted}>
      {/* ambient furniture */}
      <div className="absolute top-[56%] left-[30%] w-[46%]"><CounterArt /></div>
      <div className="absolute top-[50%] left-[62%] w-[8%]"><KettleArt /></div>
      <div className="absolute top-[16%] left-[42%] w-[7%]"><PotPlantArt c={T.moss} /></div>

      {/* KITCHEN EASTER EGG: CERAÏS ceramic bowl — swap emoji for <img src="/assets/cerais-bowl.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[55%] left-[24%] w-[7%]" label="CERAÏS bowl" onClick={() => toggle("bowl")}>
        <EmojiTile emoji="🥣" bg={T.paper} small />
      </Hotspot>
      {/* KITCHEN EASTER EGG: milky candy box — swap emoji for <img src="/assets/candy-box.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[46%] left-[64%] w-[6.5%]" label="Milky candy box" onClick={() => toggle("candy")}>
        <EmojiTile emoji="🍬" bg={T.blush} small />
      </Hotspot>
      {/* KITCHEN EASTER EGG: "In Their Eyes" book cover — swap emoji for <img src="/assets/in-their-eyes.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[58%] left-[86%] w-[6.5%]" label="In Their Eyes" onClick={() => toggle("book")}>
        <EmojiTile emoji="📕" bg={T.sage} small />
      </Hotspot>
      {/* KITCHEN EASTER EGG: washing machine — Loop the Look — swap emoji for <img src="/assets/washing-machine.png" alt="" className="w-full h-auto" /> */}
      <Hotspot className="top-[30%] left-[10%] w-[7%]" label="Loop the Look" onClick={() => toggle("washer")}>
        <EmojiTile emoji="🧺" bg={T.paper} small />
      </Hotspot>

      {open && (
        <Popover open onClose={() => setOpen(null)} anchorClassName="top-[14%] left-[62%]" width={210}>
          <div style={{ ...label, fontSize: 8.5, color: T.rose }}>{KITCHEN_TRINKETS[open].tag}</div>
          <div style={{ ...serif, fontWeight: 700, fontSize: 14, color: T.ink, marginTop: 2 }}>{KITCHEN_TRINKETS[open].title}</div>
          <p style={{ ...sans, fontSize: 11.5, color: T.cocoa, marginTop: 5, lineHeight: 1.45 }}>{KITCHEN_TRINKETS[open].desc}</p>
        </Popover>
      )}
    </Room>
  );
}

function Interior({ highlightZone, onExit }) {
  return (
    <div className="absolute inset-0">
      {/* roof cap */}
      <div className="absolute left-0 top-0 w-full h-[9%]" style={{ background: T.rose, borderBottom: `4px solid ${T.cocoa}` }}>
        <div className="absolute left-1/2 top-1/2 flex items-center gap-2" style={{ transform: "translate(-50%,-50%)" }}>
          <span style={{ ...serif, fontSize: "clamp(12px,2vw,18px)", fontWeight: 700, color: T.paper }}>Kwun&rsquo;s house</span>
        </div>
        <button
          onClick={onExit}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-transform hover:-translate-x-0.5"
          style={{ ...label, fontSize: 9, color: T.paper, background: "rgba(74,54,39,.35)", border: `2px solid ${T.paper}`, borderRadius: 99, padding: "4px 10px", cursor: "pointer" }}
        >
          <ChevronLeft size={12} strokeWidth={3} /> Outside
        </button>
      </div>

      {/* the three zones, laid out on a 2-up / 1-wide grid */}
      <div className="absolute inset-x-0 top-[9%] bottom-0 grid grid-cols-2 grid-rows-2">
        <StudyZone highlighted={highlightZone === "study"} />
        <LivingZone highlighted={highlightZone === "living"} />
        <KitchenZone highlighted={highlightZone === "kitchen"} />
      </div>
    </div>
  );
}

/* =========================================================================
   MAILBOX / CONTACT POSTCARD (triggered from the persistent header)
   ========================================================================= */
const CONTACTS = [
  { id: "email", Icon: Mail, label: "Email", value: "pakwun.putthakhoon@gmail.com", href: "mailto:pakwun.putthakhoon@gmail.com" },
  { id: "ig", Icon: Instagram, label: "Instagram", value: "@pakwun", href: "https://instagram.com/pakwun" },
  { id: "line", Icon: MessageCircle, label: "Line", value: "pakwun.p", href: null },
];

function MailModal({ open, onClose }) {
  const [copied, setCopied] = useState(null);
  const copy = async (c) => {
    try { await navigator.clipboard.writeText(c.value); } catch { /* clipboard blocked — the text is still on screen */ }
    setCopied(c.id);
    setTimeout(() => setCopied(null), 1600);
  };
  return (
    <Modal open={open} onClose={onClose} maxWidth={560}>
      <ModalHeader eyebrow="Say hello" title="Get in touch" sub="Post is collected daily. Reply guaranteed." bg={T.rose} />
      <div className="dh-scroll flex-1 overflow-y-auto p-5 sm:p-7">
        <div style={{ background: T.cream, border: `3px solid ${T.cocoa}`, borderRadius: 16, padding: 18, boxShadow: "0 8px 0 rgba(110,78,57,.15)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div style={label}>Postcard from</div>
              <div style={{ ...serif, fontSize: 22, fontWeight: 700, color: T.ink }}>Pakwun Jindarat</div>
              <div style={{ ...sans, fontSize: 13, color: T.cocoa }}>Bangkok, Thailand</div>
            </div>
            <div style={{ width: 58, height: 64, background: T.butter, border: `2.5px dashed ${T.cocoa}`, borderRadius: 8, display: "grid", placeItems: "center" }}>
              <span style={{ fontSize: 24 }}>💌</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {CONTACTS.map((c) => (
              <div key={c.id} className="flex items-center gap-3" style={{ background: T.paper, border: `2px solid ${T.cocoa}`, borderRadius: 12, padding: "10px 12px" }}>
                <c.Icon size={17} strokeWidth={2.4} color={T.rose} />
                <div className="min-w-0 flex-1">
                  <div style={{ ...label, fontSize: 8.5, color: T.cocoa, opacity: .7 }}>{c.label}</div>
                  {c.href
                    ? <a href={c.href} target="_blank" rel="noreferrer" className="block truncate" style={{ ...sans, fontSize: 14, fontWeight: 700, color: T.ink }}>{c.value}</a>
                    : <div className="truncate" style={{ ...sans, fontSize: 14, fontWeight: 700, color: T.ink }}>{c.value}</div>}
                </div>
                <button onClick={() => copy(c)} aria-label={`Copy ${c.label}`}
                  className="transition-transform hover:-translate-y-0.5"
                  style={{ background: copied === c.id ? T.sage : T.cream, border: `2px solid ${T.cocoa}`, borderRadius: 9, padding: 7, cursor: "pointer", color: T.ink }}>
                  {copied === c.id ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.6} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
   THE APP
   ========================================================================= */
export default function DollhousePortfolio() {
  const [phase, setPhase] = useState("exterior"); // exterior · zooming · interior
  const [entering, setEntering] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [highlightZone, setHighlightZone] = useState(null);

  const highlightTimeout = useRef(null);
  const pendingZoneRef = useRef(null);

  const enter = () => {
    setPhase("zooming");
    setEntering(true);
    setTimeout(() => setPhase("interior"), 1150);
    setTimeout(() => setEntering(false), 1200);
  };
  const exit = () => setPhase("exterior");

  const flashZone = (zoneId) => {
    setHighlightZone(zoneId);
    clearTimeout(highlightTimeout.current);
    highlightTimeout.current = setTimeout(() => setHighlightZone(null), 1500);
  };

  const jumpTo = (zoneId) => {
    if (phase !== "interior") {
      pendingZoneRef.current = zoneId;
      enter();
    } else {
      flashZone(zoneId);
    }
  };

  useEffect(() => {
    if (phase === "interior" && pendingZoneRef.current) {
      const z = pendingZoneRef.current;
      pendingZoneRef.current = null;
      flashZone(z);
    }
  }, [phase]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-3 pt-20 sm:p-6 sm:pt-24" style={{ background: `radial-gradient(circle at 50% 0%, #F6E7DC 0%, ${T.cream} 55%, #EFE6DA 100%)` }}>
      <GlobalStyle />
      <SiteHeader onJump={jumpTo} onOpenMail={() => setMailOpen(true)} />

      {/* the stage */}
      <div
        className="relative w-full aspect-[16/10] overflow-hidden"
        style={{ maxWidth: 1080, background: T.cocoa, borderRadius: 28, border: `5px solid ${T.cocoa}`, boxShadow: "0 16px 0 rgba(110,78,57,.18)" }}
      >
        {phase !== "interior" && <Exterior onEnter={enter} zooming={phase === "zooming"} />}
        {phase === "interior" && (
          <div
            className="absolute inset-0"
            style={{ background: T.cocoa, opacity: entering ? 0 : 1, transform: entering ? "scale(1.55)" : "scale(1)", transition: "transform 1.3s cubic-bezier(.2,.8,.25,1), opacity .9s ease" }}
          >
            <Interior highlightZone={highlightZone} onExit={exit} />
          </div>
        )}
      </div>

      {/* caption */}
      <p className="mt-4 text-center px-4" style={{ ...sans, fontSize: 12.5, color: T.cocoa }}>
        {phase === "interior"
          ? "Everything in the house is clickable — the journal, the TV, the vinyl, and a few kitchen easter eggs."
          : "An interactive portfolio by Pakwun Jindarat · Cinema & Digital Media Management"}
      </p>

      <MailModal open={mailOpen} onClose={() => setMailOpen(false)} />
    </div>
  );
}
