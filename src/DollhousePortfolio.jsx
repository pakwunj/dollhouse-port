/* =========================================================================
   KWUN'S DOLLHOUSE — interactive portfolio
   Pakwun Jindarat (Kwun) · Cinema & Digital Media Management

   HOW TO SWAP IN YOUR OWN ARTWORK
   -------------------------------
   Every clickable object lives inside a <Hotspot> with a comment block above
   it that tells you exactly what to replace. The pattern is always:

       <Hotspot top="45%" left="30%" width="18%" label="Journal" ...>
         ... swap <NotebookArt /> for <img src="/assets/notebook.png" alt="" />
       </Hotspot>

   Positions are percentages of the parent room, so your PNGs land in the same
   spot on every screen size. (They're written as inline styles rather than
   Tailwind's top-[45%] syntax because this preview runs without a Tailwind
   compiler — in your own Next/Vite project you can use either.)

   NOTE ON ANIMATION: this build uses CSS transitions + keyframes instead of
   Framer Motion (not available in the artifact sandbox). Every animated value
   is a transform/opacity, so dropping in <motion.div> later is a 1:1 swap.
   ========================================================================= */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Mail, Instagram, Phone, MessageCircle, ChevronLeft, ChevronRight,
  Shuffle, Download, Camera, Upload, ExternalLink, Copy, Check, Sparkles,
  RotateCcw, Trash2,
} from "lucide-react";

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
  shadow: "0 10px 0 rgba(110,78,57,0.13)",
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
@keyframes dh-twinkle { 0%,100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.15); } }

.dh-float { animation: dh-float 4.5s ease-in-out infinite; }
.dh-sway { animation: dh-sway 5s ease-in-out infinite; transform-origin: bottom center; }
.dh-pop { animation: dh-pop .38s cubic-bezier(.2,.9,.3,1.2) both; }
.dh-fade { animation: dh-fade .5s ease both; }
.dh-twinkle { animation: dh-twinkle 2.6s ease-in-out infinite; }
.dh-vinyl { animation: dh-spin 3.4s linear infinite; }

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

/** A clickable object in a room. Centered on (left, top) of its parent. */
function Hotspot({ top, left, width, label: name, onClick, children, float }) {
  return (
    <button
      onClick={onClick}
      aria-label={name}
      className={`absolute group ${float ? "dh-float" : ""}`}
      style={{
        top,
        left,
        width,
        transform: "translate(-50%, -50%)",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
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

function Modal({ open, onClose, children, maxWidth = 920, tone = T.paper }) {
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
          maxHeight: "92vh",
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
      <h2 className="mt-1" style={{ ...serif, fontSize: "clamp(22px,4vw,32px)", fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>
        {title}
      </h2>
      {sub && <p className="mt-1" style={{ ...sans, fontSize: 13.5, color: T.cocoa }}>{sub}</p>}
    </div>
  );
}

function Chip({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      className="transition-transform hover:-translate-y-0.5"
      style={{
        ...sans, fontSize: 12.5, fontWeight: 700, color: active ? T.paper : T.ink,
        background: active ? T.cocoa : color || T.cream,
        border: `2px solid ${T.cocoa}`, borderRadius: 99, padding: "6px 13px", cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Button({ onClick, children, tone = T.butter, wide, as = "button", href }) {
  const style = {
    ...sans, fontSize: 13.5, fontWeight: 800, color: T.ink, background: tone,
    border: `2.5px solid ${T.cocoa}`, borderRadius: 99, padding: "10px 18px",
    boxShadow: `0 4px 0 ${T.cocoa}`, cursor: "pointer", display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8, width: wide ? "100%" : undefined,
    textDecoration: "none",
  };
  const cls = "transition-all duration-150 hover:translate-y-0.5 active:translate-y-1";
  if (as === "a")
    return <a href={href} target="_blank" rel="noreferrer" className={cls} style={style}>{children}</a>;
  return <button onClick={onClick} className={cls} style={style}>{children}</button>;
}

/* =========================================================================
   PLACEHOLDER ARTWORK
   Each of these is a stand-in drawing. To use your own cut-outs, delete the
   component call in the room below and drop in an <img /> instead — the
   wrappers already handle sizing and positioning.
   ========================================================================= */

const S = { stroke: T.cocoa, strokeWidth: 3.2, strokeLinejoin: "round", strokeLinecap: "round" };

function NotebookArt() {
  return (
    <svg viewBox="0 0 120 90" className="w-full h-auto" style={{ filter: "drop-shadow(0 5px 0 rgba(110,78,57,.18))" }}>
      <rect x="8" y="14" width="104" height="66" rx="8" fill={T.rose} {...S} />
      <rect x="14" y="8" width="98" height="66" rx="8" fill={T.paper} {...S} />
      <path d="M63 8v66" fill="none" {...S} />
      {[22, 34, 46].map((y) => <path key={y} d={`M24 ${y}h28M74 ${y}h28`} stroke={T.blush} strokeWidth="3.4" strokeLinecap="round" />)}
      <circle cx="88" cy="60" r="7" fill={T.butter} {...S} />
    </svg>
  );
}

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

function VaseArt() {
  return (
    <svg viewBox="0 0 110 140" className="w-full h-auto" style={{ filter: "drop-shadow(0 5px 0 rgba(110,78,57,.15))" }}>
      <g className="dh-sway">
        <path d="M55 76V34M55 46c-14-4-18-16-18-16s14-2 18 16zM55 52c14-6 20-18 20-18s-16-2-20 18z" fill={T.sage} {...S} />
        <circle cx="34" cy="24" r="11" fill={T.rose} {...S} />
        <circle cx="76" cy="20" r="10" fill={T.butter} {...S} />
        <circle cx="55" cy="10" r="9" fill={T.paper} {...S} />
        <circle cx="55" cy="10" r="3" fill={T.butter} />
      </g>
      <path d="M32 76h46l-7 52a8 8 0 01-8 7H47a8 8 0 01-8-7z" fill={T.sky} {...S} />
      <path d="M40 96h30" stroke={T.paper} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function RecordPlayerArt() {
  return (
    <svg viewBox="0 0 150 110" className="w-full h-auto" style={{ filter: "drop-shadow(0 5px 0 rgba(110,78,57,.15))" }}>
      <rect x="6" y="24" width="138" height="76" rx="12" fill={T.wood} {...S} />
      <rect x="6" y="6" width="138" height="24" rx="10" fill={T.cream} {...S} />
      <circle cx="62" cy="62" r="30" fill={T.ink} {...S} />
      <circle cx="62" cy="62" r="9" fill={T.rose} {...S} />
      <path d="M120 34l-8 42" fill="none" {...S} />
      <circle cx="120" cy="34" r="6" fill={T.butter} {...S} />
    </svg>
  );
}

function FridgeArt() {
  return (
    <svg viewBox="0 0 120 190" className="w-full h-auto" style={{ filter: "drop-shadow(0 6px 0 rgba(110,78,57,.15))" }}>
      <rect x="6" y="6" width="108" height="178" rx="20" fill={T.sky} {...S} />
      <path d="M6 68h108" fill="none" {...S} />
      <rect x="86" y="30" width="9" height="26" rx="4" fill={T.cream} {...S} />
      <rect x="86" y="84" width="9" height="34" rx="4" fill={T.cream} {...S} />
      <rect x="22" y="92" width="42" height="34" rx="5" fill={T.paper} {...S} transform="rotate(-5 43 109)" />
      <circle cx="30" cy="146" r="9" fill={T.rose} {...S} />
      <circle cx="56" cy="152" r="7" fill={T.butter} {...S} />
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

function MailboxArt() {
  return (
    <svg viewBox="0 0 130 160" className="w-full h-auto" style={{ filter: "drop-shadow(0 6px 0 rgba(110,78,57,.15))" }}>
      <path d="M65 80v76" fill="none" {...S} />
      <rect x="18" y="26" width="94" height="58" rx="26" fill={T.rose} {...S} />
      <rect x="30" y="44" width="58" height="26" rx="6" fill={T.paper} {...S} />
      <path d="M112 42v34" fill="none" {...S} />
      <path d="M112 42h16v14h-16z" fill={T.butter} {...S} />
      <path d="M40 152h50" fill="none" {...S} />
    </svg>
  );
}

function BenchArt() {
  return (
    <svg viewBox="0 0 180 90" className="w-full h-auto">
      <rect x="10" y="34" width="160" height="12" rx="5" fill={T.wood} {...S} />
      <rect x="10" y="14" width="160" height="10" rx="5" fill={T.wood} {...S} />
      <path d="M28 46v34M152 46v34M28 24v10M152 24v10" fill="none" {...S} />
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

/** The visitor — swap for your own Sylvanian doll cut-out PNG. */
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
   SCENE 1 — EXTERIOR LANDING
   ========================================================================= */
function Exterior({ onEnter, zooming }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `linear-gradient(#DCEBF3 0%, #EFE3D6 62%, ${T.sage} 62%, #A8C2A0 100%)`,
        transform: zooming ? "scale(4.2)" : "scale(1)",
        transformOrigin: "50% 44%",
        opacity: zooming ? 0 : 1,
        transition: "transform 1.5s cubic-bezier(.6,0,.35,1), opacity 1.5s ease-in 0.35s",
      }}
    >
      {/* ambient sky */}
      <div className="absolute dh-float" style={{ top: "8%", left: "14%", width: "16%" }}>
        <svg viewBox="0 0 120 60" className="w-full h-auto"><path d="M20 48c-11 0-18-7-18-15S9 18 20 18c3-11 13-16 24-13 7-8 21-6 26 4 12-1 21 8 21 18s-8 21-20 21z" fill={T.paper} opacity=".9" /></svg>
      </div>
      <div className="absolute dh-float" style={{ top: "16%", right: "12%", width: "12%", animationDelay: "1.2s" }}>
        <svg viewBox="0 0 120 60" className="w-full h-auto"><path d="M20 48c-11 0-18-7-18-15S9 18 20 18c3-11 13-16 24-13 7-8 21-6 26 4 12-1 21 8 21 18s-8 21-20 21z" fill={T.paper} opacity=".75" /></svg>
      </div>

      {/* ===== THE DOLLHOUSE FACADE ===== */}
      {/* Replace with: <img src="/assets/house-exterior.png" alt="" className="w-full" /> */}
      <button
        onClick={onEnter}
        className="absolute group"
        style={{ top: "44%", left: "50%", width: "58%", transform: "translate(-50%,-50%)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
        aria-label="Enter the house"
      >
        <span className="block transition-transform duration-500 group-hover:scale-105">
          <svg viewBox="0 0 420 340" className="w-full h-auto" style={{ filter: "drop-shadow(0 14px 0 rgba(110,78,57,.16))" }}>
            <path d="M210 12L404 122H16z" fill={T.rose} {...S} />
            <path d="M52 118h316v206H52z" fill={T.cream} {...S} />
            <rect x="36" y="112" width="348" height="18" rx="8" fill={T.wood} {...S} />
            {/* arched windows — the camera flies into these */}
            {[110, 262].map((x) => (
              <g key={x}>
                <path d={`M${x} 250v-58a38 38 0 0176 0v58z`} fill={T.sky} {...S} />
                <path d={`M${x + 38} 134v116M${x} 192h76`} fill="none" {...S} />
                <path d={`M${x - 8} 250h92`} stroke={T.wood} strokeWidth="10" strokeLinecap="round" />
                <rect x={x - 6} y="252" width="88" height="20" rx="6" fill={T.sage} {...S} />
                <circle cx={x + 16} cy="256" r="7" fill={T.butter} {...S} />
                <circle cx={x + 40} cy="254" r="7" fill={T.rose} {...S} />
                <circle cx={x + 64} cy="256" r="7" fill={T.paper} {...S} />
              </g>
            ))}
            <path d="M186 324v-52a24 24 0 0148 0v52z" fill={T.moss} {...S} />
            <circle cx="226" cy="300" r="5" fill={T.butter} {...S} />
            <rect x="292" y="16" width="34" height="60" rx="8" fill={T.woodDark} {...S} />
          </svg>
        </span>
      </button>

      {/* ===== KWUN, SITTING OUTSIDE ===== */}
      {/* Replace with: <img src="/assets/kwun-cutout.png" alt="" className="w-full" /> */}
      <div className="absolute" style={{ bottom: "4%", left: "11%", width: "15%" }}>
        <KwunFigure />
      </div>
      <div className="absolute" style={{ bottom: "3%", right: "9%", width: "9%" }}><PotPlantArt c={T.moss} /></div>

      {/* ===== CALL TO ACTION ===== */}
      <div className="absolute w-full text-center px-4" style={{ bottom: "9%" }}>
        <p className="mb-3" style={{ ...label, color: T.cocoa }}>Pakwun Jindarat · portfolio</p>
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
          Click to peek inside
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   SCENE 2 — THE CUTAWAY INTERIOR
   ========================================================================= */

/** One room of the cutaway. Children are positioned in % of THIS room. */
function Room({ top, left, wall, floor, name, children }) {
  return (
    <div
      className="absolute overflow-hidden"
      style={{ top, left, width: "50%", height: "50%", background: wall, borderRight: `4px solid ${T.cocoa}`, borderBottom: `4px solid ${T.cocoa}` }}
    >
      {/* floor */}
      <div className="absolute bottom-0 left-0 w-full" style={{ height: "16%", background: floor, borderTop: `3px solid ${T.cocoa}` }} />
      {/* room nameplate */}
      <div className="absolute" style={{ top: 8, left: 10, ...label, fontSize: 9, color: T.cocoa, opacity: 0.55 }}>{name}</div>
      {children}
    </div>
  );
}

function Interior({ onOpen, entering, onExit }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: T.cocoa,
        transform: entering ? "scale(1.55)" : "scale(1)",
        opacity: entering ? 0 : 1,
        transition: "transform 1.3s cubic-bezier(.2,.8,.25,1), opacity .9s ease",
      }}
    >
      {/* roof cap */}
      <div className="absolute left-0 top-0 w-full" style={{ height: "9%", background: T.rose, borderBottom: `4px solid ${T.cocoa}` }}>
        <div className="absolute left-1/2 top-1/2 flex items-center gap-2" style={{ transform: "translate(-50%,-50%)" }}>
          <span style={{ ...serif, fontSize: "clamp(12px,2vw,18px)", fontWeight: 700, color: T.paper }}>Kwun&rsquo;s house</span>
        </div>
        <button
          onClick={onExit}
          className="absolute flex items-center gap-1.5 transition-transform hover:-translate-x-0.5"
          style={{ left: 12, top: "50%", transform: "translateY(-50%)", ...label, fontSize: 9, color: T.paper, background: "rgba(74,54,39,.35)", border: `2px solid ${T.paper}`, borderRadius: 99, padding: "4px 10px", cursor: "pointer" }}
        >
          <ChevronLeft size={12} strokeWidth={3} /> Outside
        </button>
      </div>

      {/* the four rooms */}
      <div className="absolute" style={{ top: "9%", left: 0, width: "100%", height: "91%" }}>

        {/* ================= ROOM 1 · STUDY & WORK DESK ================= */}
        <Room top="0" left="0" wall="#F6EEDF" floor={T.wood} name="Study">
          {/* Replace with: <img src="/assets/shelf.png" ... /> */}
          <div className="absolute" style={{ top: "16%", left: "8%", width: "40%" }}><ShelfArt /></div>
          <div className="absolute" style={{ top: "30%", left: "70%", width: "13%" }}><LampArt /></div>
          <div className="absolute" style={{ top: "56%", left: "20%", width: "62%" }}><DeskArt /></div>
          <div className="absolute" style={{ top: "54%", left: "78%", width: "18%" }}><ChairArt /></div>

          {/* === STUDY ROOM: INTERACTIVE NOTEBOOK (opens the flipbook journal) === */}
          {/* Replace with: <img src="/assets/notebook.png" alt="" className="w-full" /> */}
          <Hotspot top="52%" left="42%" width="24%" label="Open my journal" onClick={() => onOpen("journal")} float>
            <NotebookArt />
          </Hotspot>
        </Room>

        {/* ================= ROOM 2 · COZY LIVING ROOM ================= */}
        <Room top="0" left="50%" wall={T.blush} floor={T.woodDark} name="Living room">
          <div className="absolute" style={{ top: "50%", left: "6%", width: "48%" }}><SofaArt /></div>
          <div className="absolute" style={{ top: "70%", left: "58%", width: "34%" }}><TableArt /></div>

          {/* === LIVING ROOM: FLOWER VASE (opens the bouquet builder) === */}
          {/* Replace with: <img src="/assets/vase.png" alt="" className="w-full" /> */}
          <Hotspot top="56%" left="72%" width="15%" label="Make me a bouquet" onClick={() => onOpen("bouquet")}>
            <VaseArt />
          </Hotspot>

          {/* === LIVING ROOM: RECORD PLAYER (opens the music widget) === */}
          {/* Replace with: <img src="/assets/record-player.png" alt="" className="w-full" /> */}
          <Hotspot top="24%" left="26%" width="26%" label="Play my playlist" onClick={() => onOpen("vinyl")} float>
            <RecordPlayerArt />
          </Hotspot>
        </Room>

        {/* ================= ROOM 3 · KITCHEN & PANTRY ================= */}
        <Room top="50%" left="0" wall="#E3EEF3" floor="#EFE0CE" name="Kitchen">
          <div className="absolute" style={{ top: "58%", left: "38%", width: "56%" }}><CounterArt /></div>
          <div className="absolute" style={{ top: "50%", left: "62%", width: "11%" }}><KettleArt /></div>
          <div className="absolute" style={{ top: "14%", left: "48%", width: "10%" }}><PotPlantArt c={T.moss} /></div>

          {/* === KITCHEN: RETRO FRIDGE (opens the 4-cut photo booth) === */}
          {/* Replace with: <img src="/assets/fridge.png" alt="" className="w-full" /> */}
          <Hotspot top="52%" left="18%" width="22%" label="Take a photo strip" onClick={() => onOpen("photobooth")}>
            <FridgeArt />
          </Hotspot>
        </Room>

        {/* ================= ROOM 4 · FRONT PORCH ================= */}
        <Room top="50%" left="50%" wall="#DCEBF3" floor={T.sage} name="Front porch">
          {/* fence line */}
          <div className="absolute" style={{ bottom: "16%", left: 0, width: "100%", height: "22%" }}>
            <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 40h400M0 66h400" stroke={T.paper} strokeWidth="9" />
              {Array.from({ length: 13 }).map((_, i) => (
                <path key={i} d={`M${14 + i * 30} 90V26l8-12 8 12v64`} fill={T.paper} stroke={T.paper} strokeWidth="4" />
              ))}
            </svg>
          </div>
          <div className="absolute" style={{ top: "56%", left: "8%", width: "36%" }}><BenchArt /></div>
          <div className="absolute" style={{ top: "62%", left: "48%", width: "10%" }}><PotPlantArt c={T.rose} /></div>

          {/* === PORCH: MAILBOX (opens the contact postcard) === */}
          {/* Replace with: <img src="/assets/mailbox.png" alt="" className="w-full" /> */}
          <Hotspot top="46%" left="76%" width="20%" label="Send me a letter" onClick={() => onOpen("mail")} float>
            <MailboxArt />
          </Hotspot>
        </Room>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 1 — THE FLIPBOOK JOURNAL (portfolio)
   ========================================================================= */
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

function JPage({ kicker, title, meta, children, cover }) {
  return (
    <div
      className="dh-fade relative flex flex-col h-full"
      style={{
        background: cover ? T.rose : T.paper,
        borderRadius: 14,
        border: `2.5px solid ${T.cocoa}`,
        padding: "22px 22px 30px",
        boxShadow: "inset 0 0 0 6px rgba(255,255,255,.5)",
        minHeight: 380,
      }}
    >
      {cover ? (
        <div className="flex flex-col items-center justify-center text-center h-full gap-3">
          <div style={{ width: "38%" }}><NotebookArt /></div>
          <div style={{ ...label, color: T.paper, opacity: .85 }}>Portfolio journal · 2026</div>
          <h3 style={{ ...serif, fontSize: 32, fontWeight: 700, color: T.paper, lineHeight: 1.05 }}>
            Pakwun<br />Jindarat
          </h3>
          <p style={{ ...sans, fontSize: 13.5, color: T.paper, maxWidth: 260 }}>
            Film marketing, content creative, and stories that travel. Turn the page.
          </p>
        </div>
      ) : (
        <>
          <div style={{ ...label, color: T.rose }}>{kicker}</div>
          <h3 className="mt-1" style={{ ...serif, fontSize: 22, fontWeight: 700, color: T.ink, lineHeight: 1.15 }}>{title}</h3>
          {meta && <div className="mt-1" style={{ ...sans, fontSize: 12, fontWeight: 700, color: T.moss }}>{meta}</div>}
          <div className="mt-3 flex-1">{children}</div>
        </>
      )}
    </div>
  );
}

const JOURNAL = [
  <JPage cover key="cover" />,
  <JPage key="about" kicker="About me" title="Hello, I'm Kwun" meta="Bangkok, Thailand">
    <p style={{ ...sans, fontSize: 13.5, lineHeight: 1.6, color: T.ink }}>
      A final-year Cinema & Digital Media Management student who likes the messy middle of a campaign —
      where a film, an artist, or a brand still needs a reason for people to care.
    </p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Stat big="3.96" small="Cumulative GPA" />
      <Stat big="Senior" small="Class of 2026" />
    </div>
    <ul className="mt-3 space-y-1.5">
      <Bullet>Srinakharinwirot University — Cinema &amp; Digital Media Management</Bullet>
      <Bullet>Academic Excellence Scholarship recipient</Bullet>
      <Bullet>Interested in distribution, content strategy, and audience building</Bullet>
    </ul>
  </JPage>,
  <JPage key="umt" kicker="Experience · 2026" title="Universal Music Thailand" meta="Content Creative Intern, Domestic Marketing">
    <div className="grid grid-cols-2 gap-2">
      <Stat big="2.72M+" small="Views earned" />
      <Stat big="265K+" small="Engagements" />
    </div>
    <ul className="mt-3 space-y-1.5">
      <Bullet>Created social-first content for artist campaigns including PUN, Violette Wautier and SCRUBB</Bullet>
      <Bullet>Produced behind-the-scenes cuts from music video shoots for release-week rollouts</Bullet>
      <Bullet>Worked inside the domestic marketing team on concepts, captions and posting rhythm</Bullet>
    </ul>
  </JPage>,
  <JPage key="wb" kicker="Experience · 2023–2025" title="Warner Bros. (FE) Inc." meta="Film Distribution & Marketing Intern">
    <ul className="space-y-1.5">
      <Bullet>Supported theatrical campaigns for <em>The Flash</em>, <em>Barbie</em>, <em>Furiosa</em> and <em>Twisters</em></Bullet>
      <Bullet>Coordinated Thai voice-dubbing sessions and localisation assets</Bullet>
      <Bullet>Tracked release materials, press moments and partner deliverables across titles</Bullet>
    </ul>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {["The Flash", "Barbie", "Furiosa", "Twisters"].map((t) => (
        <span key={t} style={{ ...sans, fontSize: 11.5, fontWeight: 700, color: T.ink, background: T.butter, border: `2px solid ${T.cocoa}`, borderRadius: 99, padding: "3px 10px" }}>{t}</span>
      ))}
    </div>
  </JPage>,
  <JPage key="uwe" kicker="Study abroad · 2024" title="UWE Bristol, UK" meta="Filmmaking Summer School">
    <ul className="space-y-1.5">
      <Bullet>Directed the short film <em>The Best Love</em>, from script through to final cut</Bullet>
      <Bullet>Led a mixed-nationality crew across pre-production, shoot days and edit</Bullet>
      <Bullet>Trained in UK production workflow, coverage and directing actors</Bullet>
    </ul>
    <div className="mt-4" style={{ background: T.cream, border: `2px dashed ${T.cocoa}`, borderRadius: 12, padding: 12 }}>
      <div style={{ ...label, fontSize: 9, color: T.cocoa }}>Director</div>
      <div style={{ ...serif, fontSize: 17, fontWeight: 700, color: T.ink }}>The Best Love (2024)</div>
    </div>
  </JPage>,
  <JPage key="jmat" kicker="Competition" title="J-MAT Awards #33 & #34" meta="Top 24 Finalist — both years">
    <ul className="space-y-1.5">
      <Bullet>Built full strategic marketing plans for <strong>Dentiste</strong> and <strong>Hi-Herb</strong></Bullet>
      <Bullet>Research, segmentation, positioning and campaign idea, pitched to industry judges</Bullet>
      <Bullet>Selected into the national top 24 in two consecutive editions</Bullet>
    </ul>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Stat big="#33" small="Dentiste" />
      <Stat big="#34" small="Hi-Herb" />
    </div>
  </JPage>,
  <JPage key="projects" kicker="Selected work" title="University projects" meta="Strategy · marketing · production">
    <ul className="space-y-1.5">
      <Bullet><strong>CERAÏS</strong> — brand strategy and identity build for a skincare concept</Bullet>
      <Bullet><strong>Lost Shirt and Bought</strong> — film marketing campaign and release plan</Bullet>
      <Bullet><strong>To Be Heard</strong> — musical drama production</Bullet>
      <Bullet><strong>Barbie</strong> — critical review of the film's marketing and cultural reach</Bullet>
    </ul>
  </JPage>,
  <JPage key="lang" kicker="Languages" title="Four alphabets" meta="Still collecting more">
    <div className="grid grid-cols-2 gap-2">
      <Stat big="Thai" small="Native" />
      <Stat big="English" small="B2" />
      <Stat big="German" small="B1" />
      <Stat big="Korean" small="Level 2" />
    </div>
    <p className="mt-4" style={{ ...sans, fontSize: 13.5, lineHeight: 1.6, color: T.ink }}>
      Thanks for reading to the end. The mailbox on the porch has my email if you'd like to talk.
    </p>
  </JPage>,
];

function JournalModal({ open, onClose }) {
  const wide = useWide();
  const [i, setI] = useState(0);
  const step = wide ? 2 : 1;
  const max = Math.max(0, JOURNAL.length - step);
  const go = (d) => setI((v) => Math.min(max, Math.max(0, v + d * step)));
  useEffect(() => { if (open) setI(0); }, [open]);

  return (
    <Modal open={open} onClose={onClose} maxWidth={940} tone={T.cream}>
      <ModalHeader eyebrow="Study · the desk journal" title="Kwun's portfolio journal" sub="Flip through the pages — experience, projects, and a bit about me." />
      <div className="dh-scroll flex-1 overflow-y-auto p-4 sm:p-7" style={{ background: T.cream }}>
        <div key={i} className="grid gap-4" style={{ gridTemplateColumns: wide ? "1fr 1fr" : "1fr" }}>
          {JOURNAL.slice(i, i + step)}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-7" style={{ background: T.blush, borderTop: `3px solid ${T.cocoa}` }}>
        <Button onClick={() => go(-1)} tone={T.paper}><ChevronLeft size={16} strokeWidth={3} /> Back</Button>
        <div className="flex gap-1.5">
          {Array.from({ length: Math.ceil(JOURNAL.length / step) }).map((_, d) => (
            <span key={d} style={{ width: d * step === i ? 20 : 8, height: 8, borderRadius: 99, background: d * step === i ? T.cocoa : "rgba(110,78,57,.3)", transition: "width .25s" }} />
          ))}
        </div>
        <Button onClick={() => go(1)} tone={T.butter}>Next <ChevronRight size={16} strokeWidth={3} /></Button>
      </div>
    </Modal>
  );
}

/* =========================================================================
   MODAL 2 — THE BOUQUET BUILDER
   ========================================================================= */
const FLOWERS = [
  { id: "tulip", name: "Tulip", colors: ["#E9A0AE", "#F0C08A", "#D98B9E"] },
  { id: "daisy", name: "Daisy", colors: ["#FFFBF0", "#FBE7A1", "#F6D2D8"] },
  { id: "rose", name: "Rose", colors: ["#D9776F", "#E8A7A0", "#C05C63"] },
  { id: "lavender", name: "Lavender", colors: ["#B6A6D8", "#C9BCE4", "#9C89C4"] },
  { id: "sunflower", name: "Sunflower", colors: ["#F2C64B", "#EFD37A"] },
  { id: "breath", name: "Baby's breath", colors: ["#FFFDF7", "#F3E6F0"] },
];
const WRAPS = [
  { id: "kraft", name: "Kraft", c: "#DDBB94" },
  { id: "blush", name: "Blush", c: "#F0CFC8" },
  { id: "mint", name: "Mint", c: "#BFDCCB" },
  { id: "butter", name: "Butter", c: "#F4DEA3" },
  { id: "sky", name: "Sky", c: "#B9D2E6" },
];
const RIBBONS = [
  { id: "satin", name: "Satin", c: "#E09A93" },
  { id: "twine", name: "Twine", c: "#B79268" },
  { id: "velvet", name: "Velvet", c: "#8E6FA8" },
  { id: "gingham", name: "Gingham", c: "#7E9A78" },
];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

function FlowerHead({ type, color }) {
  const st = { stroke: T.cocoa, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" };
  if (type === "tulip")
    return (
      <g>
        <path d="M-17 0c0-26 8-40 17-40s17 14 17 40c-6 5-11 5-17 0-6 5-11 5-17 0z" fill={color} {...st} />
      </g>
    );
  if (type === "daisy")
    return (
      <g>
        {Array.from({ length: 9 }).map((_, k) => (
          <ellipse key={k} cx="0" cy="-24" rx="7.5" ry="15" fill={color} {...st} transform={`rotate(${k * 40})`} />
        ))}
        <circle cx="0" cy="0" r="9" fill={T.butter} {...st} />
      </g>
    );
  if (type === "rose")
    return (
      <g>
        <circle cx="0" cy="-6" r="20" fill={color} {...st} />
        <path d="M-10-6a10 10 0 0120 0 10 10 0 01-16 8" fill="none" {...st} />
      </g>
    );
  if (type === "lavender")
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <ellipse key={k} cx={k % 2 ? 7 : -7} cy={-8 - k * 10} rx="8" ry="7" fill={color} {...st} />
        ))}
      </g>
    );
  if (type === "sunflower")
    return (
      <g>
        {Array.from({ length: 12 }).map((_, k) => (
          <ellipse key={k} cx="0" cy="-26" rx="6.5" ry="14" fill={color} {...st} transform={`rotate(${k * 30})`} />
        ))}
        <circle cx="0" cy="0" r="12" fill="#8A5A3B" {...st} />
      </g>
    );
  return (
    <g>
      {[[-14, -30], [0, -44], [15, -28], [-7, -12], [10, -8], [2, -26]].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="6.5" fill={color} {...st} />
      ))}
    </g>
  );
}

function BouquetSVG({ svgRef, stems, wrap, ribbon, note }) {
  const noteLines = (note || "").match(/.{1,30}(\s|$)/g)?.slice(0, 3) || [];
  return (
    <svg ref={svgRef} viewBox="0 0 400 560" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="400" height="560" rx="26" fill={T.paper} stroke={T.cocoa} strokeWidth="6" />
      <g transform="translate(200,0)">
        {/* stems */}
        {stems.map((s, k) => {
          const t = stems.length === 1 ? 0.5 : k / (stems.length - 1);
          const x = -96 + 192 * t;
          const y = 250 - 46 * Math.sin(Math.PI * t);
          const rot = -20 + 40 * t;
          return (
            <g key={s.key} transform={`translate(${x},${y}) rotate(${rot})`}>
              <path d={`M0 0C6 60 -6 120 ${-x * 0.55} 220`} fill="none" stroke={T.moss} strokeWidth="5" strokeLinecap="round" />
              <FlowerHead type={s.type} color={s.color} />
            </g>
          );
        })}
        {/* wrapping paper */}
        <path d="M-104 262L104 262L52 452H-52Z" fill={wrap.c} stroke={T.cocoa} strokeWidth="5" strokeLinejoin="round" opacity="0.97" />
        <path d="M-104 262L0 300L104 262" fill="none" stroke={T.cocoa} strokeWidth="4" />
        {/* ribbon */}
        <rect x="-58" y="352" width="116" height="20" rx="8" fill={ribbon.c} stroke={T.cocoa} strokeWidth="4" />
        <path d="M-58 362c-24-18-38-4-26 12 8 10 20 4 26-12z" fill={ribbon.c} stroke={T.cocoa} strokeWidth="4" strokeLinejoin="round" />
        <path d="M58 362c24-18 38-4 26 12-8 10-20 4-26-12z" fill={ribbon.c} stroke={T.cocoa} strokeWidth="4" strokeLinejoin="round" />
      </g>
      {/* note card */}
      <g transform="translate(200,478)">
        <rect x="-150" y="-14" width="300" height="66" rx="12" fill={T.cream} stroke={T.cocoa} strokeWidth="4" />
        {noteLines.length ? (
          noteLines.map((ln, k) => (
            <text key={k} x="0" y={4 + k * 17} textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fill={T.ink}>{ln.trim()}</text>
          ))
        ) : (
          <text x="0" y="12" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fill="rgba(74,54,39,.45)">Your note goes here</text>
        )}
        <text x="0" y="46" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10.5" letterSpacing="2" fill={T.rose}>FROM KWUN&rsquo;S LIVING ROOM</text>
      </g>
    </svg>
  );
}

function BouquetModal({ open, onClose }) {
  const [stems, setStems] = useState([]);
  const [wrap, setWrap] = useState(WRAPS[0]);
  const [ribbon, setRibbon] = useState(RIBBONS[0]);
  const [note, setNote] = useState("");
  const svgRef = useRef(null);
  const keyRef = useRef(0);

  const add = (f) => setStems((s) => (s.length >= 9 ? s : [...s, { key: ++keyRef.current, type: f.id, color: rand(f.colors) }]));
  const removeAt = (k) => setStems((s) => s.filter((x) => x.key !== k));
  const randomize = () => {
    const n = 4 + Math.floor(Math.random() * 4);
    setStems(Array.from({ length: n }).map(() => { const f = rand(FLOWERS); return { key: ++keyRef.current, type: f.id, color: rand(f.colors) }; }));
    setWrap(rand(WRAPS));
    setRibbon(rand(RIBBONS));
  };

  const download = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 800; c.height = 1120;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, 800, 1120);
        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = "bouquet-from-kwun.png";
        a.click();
      } catch {
        const a = document.createElement("a");
        a.href = url; a.download = "bouquet-from-kwun.svg"; a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { const a = document.createElement("a"); a.href = url; a.download = "bouquet-from-kwun.svg"; a.click(); };
    img.src = url;
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={900}>
      <ModalHeader eyebrow="Living room · the vase" title="Build a bouquet" sub="Pick your stems, wrap it, tie a ribbon, write a note. Then take it home." bg={T.sage} />
      <div className="dh-scroll flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
          <div className="grid gap-5 md:grid-cols-2">
            {/* preview */}
            <div className="order-2 md:order-1">
              <BouquetSVG svgRef={svgRef} stems={stems} wrap={wrap} ribbon={ribbon} note={note} />
            </div>

            {/* controls */}
            <div className="order-1 md:order-2 space-y-4">
              <div>
                <div style={label}>Stems <span style={{ color: T.rose }}>({stems.length}/9)</span></div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FLOWERS.map((f) => <Chip key={f.id} onClick={() => add(f)} color={f.colors[0]}>+ {f.name}</Chip>)}
                </div>
                {stems.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stems.map((s) => (
                      <button key={s.key} onClick={() => removeAt(s.key)}
                        className="flex items-center gap-1 transition-transform hover:-translate-y-0.5"
                        style={{ ...sans, fontSize: 11, fontWeight: 700, color: T.ink, background: s.color, border: `2px solid ${T.cocoa}`, borderRadius: 99, padding: "3px 9px", cursor: "pointer" }}>
                        {FLOWERS.find((f) => f.id === s.type)?.name} <X size={11} strokeWidth={3} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={label}>Wrapping paper</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WRAPS.map((w) => <Chip key={w.id} active={w.id === wrap.id} onClick={() => setWrap(w)} color={w.c}>{w.name}</Chip>)}
                </div>
              </div>

              <div>
                <div style={label}>Ribbon</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RIBBONS.map((r) => <Chip key={r.id} active={r.id === ribbon.id} onClick={() => setRibbon(r)} color={r.c}>{r.name}</Chip>)}
                </div>
              </div>

              <div>
                <div style={label}>Note on the card</div>
                <textarea
                  value={note} maxLength={90} rows={2}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Thanks for stopping by…"
                  className="mt-2 w-full"
                  style={{ ...sans, fontSize: 13.5, color: T.ink, background: T.cream, border: `2.5px solid ${T.cocoa}`, borderRadius: 12, padding: "9px 12px", resize: "none" }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={randomize} tone={T.blush}><Shuffle size={15} strokeWidth={2.6} /> Random bouquet</Button>
                <Button onClick={download}><Download size={15} strokeWidth={2.6} /> Save card</Button>
                {stems.length > 0 && <Button onClick={() => setStems([])} tone={T.cream}><Trash2 size={15} strokeWidth={2.6} /> Clear</Button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
   MODAL 3 — THE RECORD PLAYER (Apple Music)
   ========================================================================= */
const PLAYLIST_URL = "https://music.apple.com/th/playlist/feeling-like-a-no-1/pl.u-MDAWWE6CWa6kE1g";
const PLAYLIST_EMBED = "https://embed.music.apple.com/th/playlist/feeling-like-a-no-1/pl.u-MDAWWE6CWa6kE1g";

function VinylModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={760}>
      <ModalHeader eyebrow="Living room · the record player" title="Feeling Like a No.1" sub="The playlist that's usually on while I work. Press play." bg={T.butter} />
      <div className="dh-scroll flex-1 overflow-y-auto p-5 sm:p-7">
        <div className="flex flex-col items-center gap-5">
          {/* spinning disc */}
          <div style={{ width: 172 }}>
            <svg viewBox="0 0 200 200" className="w-full h-auto dh-vinyl" style={{ filter: "drop-shadow(0 8px 0 rgba(110,78,57,.18))" }}>
              <circle cx="100" cy="100" r="94" fill={T.ink} stroke={T.cocoa} strokeWidth="5" />
              {[78, 66, 54].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2" />)}
              <circle cx="100" cy="100" r="40" fill={T.rose} stroke={T.cocoa} strokeWidth="5" />
              <circle cx="100" cy="100" r="7" fill={T.paper} stroke={T.cocoa} strokeWidth="4" />
              <path d="M100 68a32 32 0 0132 32" stroke={T.paper} strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {/* Apple Music embed. If the player doesn't load inside this frame,
              the button below opens the playlist in the Apple Music app/site. */}
          <iframe
            title="Feeling Like a No.1 on Apple Music"
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            frameBorder="0"
            height="450"
            style={{ width: "100%", maxWidth: 660, overflow: "hidden", borderRadius: 14, border: `3px solid ${T.cocoa}`, background: T.cream }}
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            src={PLAYLIST_EMBED}
          />

          <Button as="a" href={PLAYLIST_URL} tone={T.blush}>
            <ExternalLink size={15} strokeWidth={2.6} /> Listen on Apple Music
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
   MODAL 4 — THE FRIDGE (4-cut photo booth)
   ========================================================================= */
const FRAMES = [
  { id: "blush", name: "Blush", bg: "#F0CFC8", ink: "#4A3627" },
  { id: "butter", name: "Butter", bg: "#F4DEA3", ink: "#4A3627" },
  { id: "mint", name: "Mint", bg: "#BFDCCB", ink: "#4A3627" },
  { id: "sky", name: "Sky", bg: "#B9D2E6", ink: "#4A3627" },
  { id: "cocoa", name: "Cocoa", bg: "#6E4E39", ink: "#FFFCF6" },
];
const STICKERS = ["🌷", "🎀", "🧸", "⭐️", "🍓", "☁️", "🐰", "🍰", "💌", "🌙", "✨", "🍀"];

function PhotoBoothModal({ open, onClose }) {
  const [shots, setShots] = useState([null, null, null, null]);
  const [stickers, setStickers] = useState([[], [], [], []]);
  const [slot, setSlot] = useState(0);
  const [frame, setFrame] = useState(FRAMES[0]);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  useEffect(() => { if (!open) stopCam(); return stopCam; }, [open, stopCam]);

  const startCam = async () => {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCamOn(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 50);
    } catch {
      setCamError("The camera isn't available here. Upload a photo instead — it works the same way.");
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = 640; c.height = 480;
    const ctx = c.getContext("2d");
    ctx.translate(640, 0); ctx.scale(-1, 1); // mirror, like a real booth
    const r = Math.max(640 / v.videoWidth, 480 / v.videoHeight);
    const w = v.videoWidth * r, h = v.videoHeight * r;
    ctx.drawImage(v, (640 - w) / 2, (480 - h) / 2, w, h);
    setShot(c.toDataURL("image/jpeg", 0.9));
  };

  const setShot = (url) => {
    setShots((s) => s.map((x, k) => (k === slot ? url : x)));
    setSlot((k) => (k + 1) % 4);
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => setShot(rd.result);
    rd.readAsDataURL(f);
    e.target.value = "";
  };

  const addSticker = (emoji) =>
    setStickers((s) => s.map((arr, k) => (k === slot ? [...arr, {
      key: Math.random().toString(36).slice(2), emoji,
      x: 12 + Math.random() * 70, y: 12 + Math.random() * 66, rot: -18 + Math.random() * 36,
    }] : arr)));

  const reset = () => { setShots([null, null, null, null]); setStickers([[], [], [], []]); setSlot(0); };

  const download = async () => {
    const PAD = 22, W = 440, PW = W - PAD * 2, PH = Math.round(PW * 0.75), GAP = 12, FOOT = 88;
    const H = PAD + 4 * (PH + GAP) - GAP + FOOT;
    const c = document.createElement("canvas");
    c.width = W * 2; c.height = H * 2;
    const ctx = c.getContext("2d");
    ctx.scale(2, 2);
    ctx.fillStyle = frame.bg; ctx.fillRect(0, 0, W, H);

    const loads = shots.map((src) => new Promise((res) => {
      if (!src) return res(null);
      const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src;
    }));
    const imgs = await Promise.all(loads);

    imgs.forEach((im, k) => {
      const y = PAD + k * (PH + GAP);
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(PAD, y, PW, PH);
      if (im) {
        ctx.save(); ctx.beginPath(); ctx.rect(PAD, y, PW, PH); ctx.clip();
        const r = Math.max(PW / im.width, PH / im.height);
        const w = im.width * r, h = im.height * r;
        ctx.drawImage(im, PAD + (PW - w) / 2, y + (PH - h) / 2, w, h);
        ctx.restore();
      }
      stickers[k].forEach((st) => {
        ctx.save();
        ctx.translate(PAD + (st.x / 100) * PW, y + (st.y / 100) * PH);
        ctx.rotate((st.rot * Math.PI) / 180);
        ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(st.emoji, 0, 0);
        ctx.restore();
      });
    });

    ctx.fillStyle = frame.ink;
    ctx.textAlign = "center";
    ctx.font = "600 19px Georgia, serif";
    ctx.fillText("Kwun's kitchen", W / 2, H - 50);
    ctx.font = "11px Georgia, serif";
    ctx.fillText(new Date().toLocaleDateString(), W / 2, H - 28);

    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "photostrip.png";
    a.click();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={900}>
      <ModalHeader eyebrow="Kitchen · the fridge" title="Four-cut photo booth" sub="Fill four frames, decorate them, and take the strip with you." bg={T.sky} />
      <div className="dh-scroll flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* strip preview */}
          <div className="flex justify-center">
            <div style={{ width: 210, background: frame.bg, border: `3px solid ${T.cocoa}`, borderRadius: 14, padding: 11, boxShadow: "0 8px 0 rgba(110,78,57,.18)" }}>
              {shots.map((src, k) => (
                <button
                  key={k}
                  onClick={() => setSlot(k)}
                  className="relative block w-full overflow-hidden"
                  style={{
                    aspectRatio: "4 / 3", marginBottom: k === 3 ? 8 : 7, borderRadius: 6, cursor: "pointer",
                    background: src ? `center/cover url(${src})` : "rgba(255,255,255,.6)",
                    border: slot === k ? `3px solid ${T.rose}` : "3px solid transparent",
                  }}
                  aria-label={`Frame ${k + 1}`}
                >
                  {!src && <span style={{ ...serif, fontSize: 20, color: "rgba(74,54,39,.35)", position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{k + 1}</span>}
                  {stickers[k].map((st) => (
                    <span key={st.key} style={{ position: "absolute", left: `${st.x}%`, top: `${st.y}%`, fontSize: 20, transform: `translate(-50%,-50%) rotate(${st.rot}deg)` }}>{st.emoji}</span>
                  ))}
                </button>
              ))}
              <div className="text-center" style={{ ...serif, fontSize: 12, fontWeight: 600, color: frame.ink }}>
                Kwun&rsquo;s kitchen
              </div>
            </div>
          </div>

          {/* controls */}
          <div className="space-y-4">
            {camOn && (
              <div>
                <video ref={videoRef} playsInline muted style={{ width: "100%", borderRadius: 12, border: `3px solid ${T.cocoa}`, transform: "scaleX(-1)", background: T.ink }} />
                <div className="mt-2 flex gap-2">
                  <Button onClick={capture} tone={T.rose}><Camera size={15} strokeWidth={2.6} /> Take frame {slot + 1}</Button>
                  <Button onClick={stopCam} tone={T.cream}>Stop camera</Button>
                </div>
              </div>
            )}

            {!camOn && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={startCam} tone={T.rose}><Camera size={15} strokeWidth={2.6} /> Use camera</Button>
                <Button onClick={() => fileRef.current?.click()} tone={T.cream}><Upload size={15} strokeWidth={2.6} /> Upload photo</Button>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
              </div>
            )}
            {camError && <p style={{ ...sans, fontSize: 12.5, color: T.cocoa, background: T.butter, border: `2px solid ${T.cocoa}`, borderRadius: 10, padding: "8px 11px" }}>{camError}</p>}

            <div>
              <div style={label}>Frame colour</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {FRAMES.map((f) => <Chip key={f.id} active={f.id === frame.id} onClick={() => setFrame(f)} color={f.bg}>{f.name}</Chip>)}
              </div>
            </div>

            <div>
              <div style={label}>Stickers <span style={{ color: T.rose }}>· added to frame {slot + 1}</span></div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STICKERS.map((e) => (
                  <button key={e} onClick={() => addSticker(e)}
                    className="transition-transform hover:-translate-y-0.5"
                    style={{ fontSize: 19, lineHeight: 1, background: T.cream, border: `2px solid ${T.cocoa}`, borderRadius: 10, padding: "5px 7px", cursor: "pointer" }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={download}><Download size={15} strokeWidth={2.6} /> Save strip</Button>
              <Button onClick={reset} tone={T.cream}><RotateCcw size={15} strokeWidth={2.6} /> Start over</Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
   MODAL 5 — THE MAILBOX (contact)
   ========================================================================= */
const CONTACTS = [
  { id: "email", Icon: Mail, label: "Email", value: "pakwun.putthakhoon@gmail.com", href: "mailto:pakwun.putthakhoon@gmail.com" },
  { id: "ig", Icon: Instagram, label: "Instagram", value: "@pakwun", href: "https://instagram.com/pakwun" },
  { id: "line", Icon: MessageCircle, label: "Line", value: "pakwun.p", href: null },
  { id: "phone", Icon: Phone, label: "Phone", value: "+66 85 909 0544", href: "tel:+66859090544" },
];

function MailModal({ open, onClose }) {
  const [copied, setCopied] = useState(null);
  const copy = async (c) => {
    try { await navigator.clipboard.writeText(c.value); } catch { /* clipboard blocked — the text is still on screen */ }
    setCopied(c.id);
    setTimeout(() => setCopied(null), 1600);
  };
  return (
    <Modal open={open} onClose={onClose} maxWidth={640}>
      <ModalHeader eyebrow="Front porch · the mailbox" title="Say hello" sub="Post is collected daily. Reply guaranteed." bg={T.rose} />
      <div className="dh-scroll flex-1 overflow-y-auto p-5 sm:p-7">
        {/* postcard */}
        <div style={{ background: T.cream, border: `3px solid ${T.cocoa}`, borderRadius: 16, padding: 18, boxShadow: "0 8px 0 rgba(110,78,57,.15)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div style={label}>Postcard from</div>
              <div style={{ ...serif, fontSize: 22, fontWeight: 700, color: T.ink }}>Pakwun Jindarat</div>
              <div style={{ ...sans, fontSize: 13, color: T.cocoa }}>Bangkok, Thailand</div>
            </div>
            <div style={{ width: 62, height: 68, background: T.butter, border: `2.5px dashed ${T.cocoa}`, borderRadius: 8, display: "grid", placeItems: "center" }}>
              <span style={{ fontSize: 26 }}>🌷</span>
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
  const [modal, setModal] = useState(null);

  const enter = () => {
    setPhase("zooming");
    setEntering(true);
    setTimeout(() => setPhase("interior"), 1150);
    setTimeout(() => setEntering(false), 1200);
  };
  const exit = () => { setModal(null); setPhase("exterior"); };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6" style={{ background: `radial-gradient(circle at 50% 0%, #F6E7DC 0%, ${T.cream} 55%, #EFE6DA 100%)` }}>
      <GlobalStyle />

      {/* the stage */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: 1080, aspectRatio: "16 / 10", background: T.cocoa,
          borderRadius: 28, border: `5px solid ${T.cocoa}`, boxShadow: "0 16px 0 rgba(110,78,57,.18)",
        }}
      >
        {phase !== "interior" && <Exterior onEnter={enter} zooming={phase === "zooming"} />}
        {phase === "interior" && <Interior onOpen={setModal} entering={entering} onExit={exit} />}
      </div>

      {/* caption */}
      <p className="mt-4 text-center px-4" style={{ ...sans, fontSize: 12.5, color: T.cocoa }}>
        {phase === "interior"
          ? "Everything in the house is clickable — the journal, the vase, the record player, the fridge, the mailbox."
          : "An interactive portfolio by Pakwun Jindarat · Cinema & Digital Media Management"}
      </p>

      <JournalModal open={modal === "journal"} onClose={() => setModal(null)} />
      <BouquetModal open={modal === "bouquet"} onClose={() => setModal(null)} />
      <VinylModal open={modal === "vinyl"} onClose={() => setModal(null)} />
      <PhotoBoothModal open={modal === "photobooth"} onClose={() => setModal(null)} />
      <MailModal open={modal === "mail"} onClose={() => setModal(null)} />
    </div>
  );
}
