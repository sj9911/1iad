"use client";

import { useId, useRef, useState } from "react";
import { Action, clamp, point, useMaterials, useSimulation, useSound } from "./shared";

const notes = [523.25, 587.33, 659.25, 783.99];
const chimeColours = [["#ffae42", "#ff487b"], ["#59efc7", "#00a8b5"], ["#bd85ff", "#7150f2"], ["#ff89b9", "#f23d78"]];
const chimeTubes = [
  { x: 245, top: 170, length: 165 },
  { x: 279, top: 206, length: 186 },
  { x: 326, top: 216, length: 193 },
  { x: 358, top: 174, length: 196 },
];
export function WindChimes({ className = "", showControls = true, breezeMultiplier = 1, windActive = true }: { className?: string; showControls?: boolean; breezeMultiplier?: number; windActive?: boolean } = {}) {
  const patternId = useId();
  const play = useSound();
  const tubes = useRef<(SVGGElement | null)[]>([]);
  const pendulum = useRef<SVGGElement>(null);
  const sail = useRef({ angle: 0, velocity: 0 });
  const physics = useRef(notes.map((_, i) => ({ angle: (i - 2) * 0.7, velocity: 0, struck: -10 })));
  const held = useRef<{ index: number; x: number } | null>(null);
  const cordHeld = useRef<{ offset: number; time: number } | null>(null);
  const gust = useRef(0);
  const strike = (i: number, velocity = 18) => {
    physics.current[i].velocity += velocity;
    const now = performance.now() / 1000;
    if (now - physics.current[i].struck > 0.18) { play(notes[i], "bell", Math.min(1, Math.abs(velocity) / 20 + 0.2)); physics.current[i].struck = now; }
  };
  const ref = useSimulation((dt, time) => {
    const breeze = windActive
      ? (Math.sin(time * 0.8) * 1.25 + Math.sin(time * 0.36 + 1.4) * .75 + Math.max(0, Math.sin(time * 0.24)) ** 20 * 24 + gust.current) * breezeMultiplier
      : 0;
    gust.current *= Math.exp(-dt * 3);
    if (!cordHeld.current) {
      sail.current.velocity += (-sail.current.angle * 3.8 - sail.current.velocity * 1.2 + breeze * .55) * dt;
      sail.current.angle = clamp(sail.current.angle + sail.current.velocity * dt, -35, 35);
    }
    pendulum.current?.setAttribute("transform", `rotate(${sail.current.angle} 300 132)`);
    physics.current.forEach((body, i) => {
      if (held.current?.index !== i) {
        body.velocity += (-body.angle * (7 + i * 0.45) - body.velocity * 0.85 + breeze * Math.sin(time * 2 + i)) * dt;
        body.angle += body.velocity * dt;
        body.angle = clamp(body.angle, -28, 28);
      }
      const tube = chimeTubes[i];
      const clapperX = 300 - Math.sin(sail.current.angle * Math.PI / 180) * 151;
      const tubeX = tube.x - Math.sin(body.angle * Math.PI / 180) * 151;
      if (Math.abs(clapperX - tubeX) < 28 && Math.abs(sail.current.velocity) > 5 && performance.now() / 1000 - body.struck > .38) {
        strike(i, clamp(sail.current.velocity * .3, -24, 24));
        if (!cordHeld.current) sail.current.velocity *= .9;
      }
      tubes.current[i]?.setAttribute("transform", `rotate(${body.angle} ${tube.x} 132)`);
      if (i > 0) {
        const other = physics.current[i - 1];
        const gap = tube.x - chimeTubes[i - 1].x - Math.sin(body.angle * Math.PI / 180) * 170 + Math.sin(other.angle * Math.PI / 180) * 170;
        if (gap < 19 && body.velocity > other.velocity) { const speed = body.velocity; body.velocity = other.velocity * 0.72 - 3; other.velocity = speed * 0.72 + 3; strike(i, 0); }
      }
    });
  });
  return <>
    <svg ref={ref} className={`w-full h-auto touch-none select-none ${className}`} viewBox="0 0 600 560" aria-label="Four colourful wind chimes. Drag the centre cord, wind catcher, or individual tubes. Hover to light up the colours." onPointerMove={(event) => {
      if (cordHeld.current) {
        const p = point(event), now = performance.now();
        const angle = clamp(-Math.atan2(p.x - 300, Math.max(25, p.y - 132)) * 180 / Math.PI + cordHeld.current.offset, -32, 32);
        const dt = Math.max(.008, (now - cordHeld.current.time) / 1000);
        sail.current.velocity = clamp(sail.current.velocity * .35 + (angle - sail.current.angle) / dt * .65, -100, 100);
        sail.current.angle = angle; cordHeld.current.time = now;
        pendulum.current?.setAttribute("transform", `rotate(${angle} 300 132)`);
        return;
      }
      if (!held.current) return;
      const p = point(event); const body = physics.current[held.current.index];
      body.angle = clamp((held.current.x - p.x) * 0.18, -28, 28);
      tubes.current[held.current.index]?.setAttribute("transform", `rotate(${body.angle} ${chimeTubes[held.current.index].x} 132)`);
    }} onPointerUp={() => { if (held.current) strike(held.current.index, physics.current[held.current.index].angle * -1.5); held.current = null; cordHeld.current = null; }} onPointerCancel={() => { held.current = null; cordHeld.current = null; sail.current.velocity = 0; }}>
      <defs>
        <clipPath id={patternId}><path d="M278 438H321Q335 487 300 535L259 529Q287 487 278 438Z"/></clipPath>
        {chimeColours.map((colours, i) => <linearGradient key={i} id={`${patternId}-colour-${i}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={colours[0]}/><stop offset="1" stopColor={colours[1]}/></linearGradient>)}
        <radialGradient id={`${patternId}-glow`}><stop stopColor="#ffffff" stopOpacity=".95"/><stop offset=".3" stopColor="#bffff1" stopOpacity=".8"/><stop offset="1" stopColor="#8befff" stopOpacity="0"/></radialGradient>
      </defs>
      <circle cx="300" cy="21" r="3.4" fill="#191b19"/>
      <path d="M220 132Q242 72 300 72T380 132Z" fill={`url(#${patternId}-colour-0)`}/>
      <path d="M220 132 300 21 380 132M267 124 300 21 334 124" fill="none" stroke="#191b19" strokeWidth="1.7" strokeLinejoin="round"/>
      <ellipse cx="300" cy="132" rx="80" ry="13" fill="#141715"/>
      {notes.map((note, i) => {
        const tube = chimeTubes[i];
        const stripe = i % 2 === 0 ? `M0 15Q3 55 18 76V${tube.length - 4}Q9 ${tube.length - 15} 8 ${tube.length - 53}L0 15Z` : `M18 0Q0 34 7 82T0 ${tube.length - 1}V0Z`;
        return <g key={note} ref={(node) => { tubes.current[i] = node; }} className="pg-grabbable pg-chime-colour" onPointerEnter={(event) => { if (event.pointerType === "mouse" && !held.current && !cordHeld.current) strike(i, (i % 2 ? -1 : 1) * 14); }} onPointerDown={(event) => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); held.current = { index: i, x: point(event).x }; strike(i, 4); }}>
          <path d={`M${tube.x - 10} 136 ${tube.x} ${tube.top} ${tube.x + 6} 139`} fill="none" stroke="#222622" strokeWidth="1.3"/>
          <g transform={`translate(${tube.x - 9} ${tube.top})`}>
            <rect x="-6" width="30" height={tube.length} fill="transparent"/>
            <path d={`M0 0H18V${tube.length}Q9 ${tube.length + 6} 0 ${tube.length}Z`} fill="#141715"/>
            <defs><clipPath id={`${patternId}-stripe-${i}`}><path d={stripe}/></clipPath></defs>
            <path d={stripe} fill={`url(#${patternId}-colour-${i})`}/>
            <g clipPath={`url(#${patternId}-stripe-${i})`} pointerEvents="none"><ellipse className="pg-chime-inner-glow" cx="9" cy={tube.length * .5} rx="20" ry={tube.length * .55} fill={`url(#${patternId}-glow)`}/></g>
            <ellipse cx="9" cy={tube.length} rx="9" ry="3.2" fill="#141715"/>
          </g>
        </g>;
      })}
      <g ref={pendulum} className="pg-grabbable pg-chime-colour" role="button" tabIndex={0} aria-label="Swing centre cord. Drag, or use left and right arrow keys." onKeyDown={(event) => {
        if (["ArrowLeft", "ArrowRight", "Enter", " "].includes(event.key)) {
          event.preventDefault(); sail.current.velocity += event.key === "ArrowRight" ? -45 : 45;
          sail.current.angle = event.key === "ArrowRight" ? -12 : 12;
          pendulum.current?.setAttribute("transform", `rotate(${sail.current.angle} 300 132)`);
        }
      }} onPointerDown={(event) => {
        event.stopPropagation(); event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
        const p = point(event);
        cordHeld.current = { offset: sail.current.angle + Math.atan2(p.x - 300, Math.max(25, p.y - 132)) * 180 / Math.PI, time: performance.now() };
        sail.current.velocity = 0;
      }}>
        <path d="M300 145V448" stroke="transparent" strokeWidth="22" fill="none" pointerEvents="stroke"/>
        <path d="M300 145V448" stroke="#202320" strokeWidth="1.6"/>
        <path d="M278 282Q300 299 322 282V291Q300 313 278 291Z" fill="#141715"/>
        <ellipse cx="300" cy="283" rx="22" ry="11" fill={`url(#${patternId}-colour-0)`}/>
        <path d="M278 438H321Q335 487 300 535L259 529Q287 487 278 438Z" fill={`url(#${patternId}-colour-1)`}/>
        <g clipPath={`url(#${patternId})`} pointerEvents="none"><ellipse className="pg-chime-inner-glow" cx="300" cy="480" rx="44" ry="75" fill={`url(#${patternId}-glow)`}/></g>
        <g clipPath={`url(#${patternId})`} stroke="#222622" strokeWidth="1.2" fill="none">
          {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${258 - i * 8} ${438 + i * 11}Q${337 - i * 6} ${457 + i * 9} ${293 - i * 11} ${510 + i * 7}M${326 + i * 9} 430Q${306 + i * 9} 453 ${346 + i * 8} 469`}/>)}
          <path d="M249 537Q262 501 333 493M265 545Q275 519 327 507"/>
        </g>
        <circle cx="301" cy="447" r="3.3" fill="#faf9f5"/>
      </g>
    </svg>
    {showControls && <div className="pg-controls"><div className="pg-note-buttons">{notes.map((note, i) => <button key={note} aria-label={`Play chime ${i + 1}`} onClick={() => strike(i, 28)}>{["C", "D", "E", "G", "A"][i]}</button>)}</div><Action onClick={() => { gust.current = 95; }}>A little breeze ↝</Action></div>}
  </>;
}


export function Landscape({ scene = 0 }: { scene?: number }) {
  return <>
    <rect width="216" height="220" fill={["#ddd7c3", "#c5d3d4", "#ddc3b8"][scene]}/>
    <circle cx={scene === 1 ? 57 : 158} cy="62" r="28" fill={["#f3eab8", "#eff0dc", "#f2ddbb"][scene]}/>
    <path d="M0 160 50 88 99 142 149 68 216 143 V220 H0Z" fill={["#8c9a85", "#799394", "#aa8679"][scene]}/>
    <path d="m0 184 74-60 66 62 76-43v77H0Z" fill={["#536d62", "#456e79", "#855e54"][scene]}/>
    <path d="M0 208 Q85 177 216 193 V220 H0Z" fill={["#354f47", "#294f62", "#613e39"][scene]}/>
    <path d="M145 181 Q82 196 128 220" fill="none" stroke="#f0e7cf" strokeWidth="8" opacity=".6"/>
  </>;
}

export function HangingPhoto() {
  const material = useMaterials();
  const play = useSound();
  const [scene, setScene] = useState(0);
  const photo = useRef<SVGGElement>(null);
  const strings = useRef<SVGPathElement>(null);
  const sim = useRef({ x: 0, y: 0, angle: -3, vx: 0, vy: 0, va: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const paint = () => {
    const s = sim.current;
    photo.current?.setAttribute("transform", `translate(${300 + s.x} ${224 + s.y}) rotate(${s.angle})`);
    const r = s.angle * Math.PI / 180;
    const anchor = (x: number) => `${300 + s.x + x * Math.cos(r) + 123 * Math.sin(r)} ${224 + s.y + x * Math.sin(r) - 123 * Math.cos(r)}`;
    strings.current?.setAttribute("d", `M220 36 L${anchor(-87)} M380 36 L${anchor(87)}`);
  };
  const ref = useSimulation((dt, time) => {
    if (!drag.current) {
      const s = sim.current;
      s.vx += (-s.x * 10 - s.vx * 2.1 + Math.sin(time) * 3) * dt;
      s.vy += (-s.y * 17 - s.vy * 3) * dt;
      s.va += (-s.angle * 10 - s.va * 1.25 + Math.sin(time * .7) * 4) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.angle += s.va * dt;
    }
    paint();
  });
  return <>
    <svg ref={ref} className="pg-visual" viewBox="0 0 600 420" aria-label="A hanging landscape photo. Drag it to swing." onPointerMove={(event) => {
      if (!drag.current) return;
      const p = point(event), d = drag.current, s = sim.current;
      d.moved ||= Math.hypot(p.x - d.x, p.y - d.y) > 4;
      s.x = clamp((p.x - d.x) * .6, -72, 72); s.y = clamp((p.y - d.y) * .32, -25, 33);
      s.angle = clamp((p.x - d.x) * .14 + (d.x - 300) * .08, -23, 23);
      s.va = s.angle * -1; paint();
    }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      {material.defs}
      <path ref={strings} d="M220 36 213 101 M380 36 387 101" fill="none" stroke="#b8ae96" strokeWidth="1.3"/>
      {[220, 380].map((x) => <g key={x}><circle cx={x} cy="36" r="5" fill="#aea994"/><circle cx={x - 1} cy="35" r="2" fill="#eee9d9"/></g>)}
      <g ref={photo} transform="translate(300 224) rotate(-3)" className="pg-grabbable" onPointerDown={(event) => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); const p = point(event); drag.current = { ...p, moved: false }; }}>
        <rect x="-123" y="-129" width="246" height="283" fill={material.paper} filter={material.shadow}/>
        <g transform="translate(-108 -114)"><Landscape scene={scene}/></g><text x="0" y="135" textAnchor="middle" fontSize="13" fill="#626657">{["a place to slow down, 01", "the long way home, 02", "one last evening, 03"][scene]}</text>
      </g>
    </svg>
    <div className="pg-controls"><Action onClick={() => { setScene((scene + 1) % 3); play(400, "paper", .35); }}>Next photograph →</Action></div>
  </>;
}
