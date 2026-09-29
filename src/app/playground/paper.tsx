"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Action, clamp, point, useMaterials, useSimulation, useSound } from "./shared";

export function TicketDispenser() {
  const play = useSound();
  const [feed, setFeed] = useState(0);
  const feeding = useRef(false);
  const paperFeed = useRef(0);
  const feedSound = useRef(0);
  const ref = useSimulation((dt, time) => {
    if (feeding.current) {
      paperFeed.current = Math.min(251, paperFeed.current + dt * 112);
      setFeed(paperFeed.current);
      if (time - feedSound.current > .13) { play(180, "click", .4); feedSound.current = time; }
    }
  });
  const startFeed = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { paperFeed.current = 251; setFeed(251); return; }
    feeding.current = true;
  };
  return <>
    <svg ref={ref} className="pg-visual" viewBox="0 0 600 420" aria-label="A boarding-pass dispenser. Hold feed to draw the pass out of the slot.">
      <defs><clipPath id="ticket-pass-crop"><rect x="215" y="165" width="170" height="251" /></clipPath></defs>
      <image href="/playground/ticket-dispenser-back.svg" x="155" y="72" width="290" height="93" />
      <g clipPath="url(#ticket-pass-crop)">
        <image href="/playground/ticket-dispenser-pass.svg" x="215" y={-86 + feed} width="170" height="251" />
      </g>
    </svg>
    <div className="pg-controls"><button className="pg-action" disabled={feed >= 251} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startFeed(); }} onPointerUp={() => { feeding.current = false; }} onPointerCancel={() => { feeding.current = false; }} onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); paperFeed.current = 251; setFeed(251); play(180); } }}>Hold to feed</button></div>
  </>;
}

const deckCards = [
  { title: "Make room.", subtitle: "FOR SOMETHING UNEXPECTED", colour: "#385c4b", shape: "circle", detail: "Leave one little space in your day unplanned." },
  { title: "Take a turn.", subtitle: "THE LONG WAY IS SOMETIMES BETTER", colour: "#b85836", shape: "steps", detail: "Try the street you always walk past." },
  { title: "Look closer.", subtitle: "THERE’S MORE HERE THAN YOU THINK", colour: "#354b94", shape: "rings", detail: "Find a detail you did not notice yesterday." },
  { title: "Go lightly.", subtitle: "YOU DON’T NEED TO CARRY IT ALL", colour: "#7c5476", shape: "arc", detail: "Put one unnecessary thing down." },
  { title: "Begin again.", subtitle: "AS MANY TIMES AS YOU NEED", colour: "#997139", shape: "star", detail: "A fresh start can be a very small thing." },
];

export function ShuffleDeck() {
  const [order, setOrder] = useState([0, 1, 2, 3, 4]);
  const [flipped, setFlipped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);
  const play = useSound();
  const next = (reverse = false) => { setOrder((cards) => reverse ? [cards[cards.length - 1], ...cards.slice(0, -1)] : [...cards.slice(1), cards[0]]); setFlipped(false); play(440, "paper"); };
  return <>
    <div className="pg-deck-area" aria-label="A deck of five cards. Drag the top card sideways to browse or tap to flip.">
      {[...order.slice(0, 3)].reverse().map((id, reverseIndex) => {
        const depth = 2 - reverseIndex, card = deckCards[id];
        return <motion.div className="pg-deck-card" key={id} style={{ background: card.colour, zIndex: 3 - depth, cursor: depth === 0 ? "grab" : "default" }}
          animate={{ rotate: depth * 5 - 2, x: depth * 7, y: depth * 8, scale: 1 - depth * .035 }}
          drag={depth === 0} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={.85}
          onDragStart={() => { setDragging(true); moved.current = true; }} onPointerDown={() => { moved.current = false; }}
          onDragEnd={(_, info) => { setDragging(false); if (Math.abs(info.offset.x) > 65 || Math.abs(info.velocity.x) > 500) next(info.offset.x > 0); }}
          onClick={() => { if (!moved.current && depth === 0) { setFlipped(!flipped); play(440, "paper", .6); } }}
          transition={{ type: "spring", stiffness: 280, damping: 27 }}>
          <span className="pg-deck-count">FIELD NOTES / 0{id + 1}</span>
          {depth === 0 && flipped ? <div className="pg-deck-message">{card.detail}</div> : <><svg viewBox="0 0 200 180" aria-hidden="true">{card.shape === "circle" ? <><circle cx="100" cy="90" r="63" fill="#d9e5bf"/><circle cx="126" cy="69" r="42" fill={card.colour}/></> : card.shape === "steps" ? <path d="M30 150V112H65V77H103V40H165V150Z" fill="#f2d29b"/> : card.shape === "rings" ? <>{[25, 40, 55, 70].map((r) => <circle key={r} cx="100" cy="90" r={r} fill="none" stroke="#d3d9ed" strokeWidth="6"/>)}</> : card.shape === "arc" ? <path d="M30 140Q30 32 100 32T170 140" fill="none" stroke="#e7c4da" strokeWidth="25"/> : <path d="m100 15 17 48 52-14-33 42 33 44-52-15-17 47-17-47-52 15 33-44-33-42 52 14Z" fill="#efd9aa"/>}</svg><h3>{card.title}</h3><p>{card.subtitle}</p></>}
          <span className="pg-deck-bottom">{depth === 0 && dragging ? "LET GO TO SHUFFLE" : "A SMALL PROMPT FOR TODAY"} <span>↗</span></span>
        </motion.div>;
      })}
    </div>
    <div className="pg-controls"><Action onClick={() => next(true)}>← Previous</Action><Action onClick={() => { setFlipped(!flipped); play(440, "paper"); }}>Flip</Action><Action onClick={() => next()}>Next →</Action></div>
  </>;
}

const essentials = ["Camera", "Passport", "Headphones", "Bottle", "Notebook", "Sunglasses"];
const homes = essentials.map((_, i) => ({ x: 85 + (i % 2) * 85, y: 115 + Math.floor(i / 2) * 95 }));

function Essential({ index }: { index: number }) {
  if (index === 0) return <><rect x="-28" y="-19" width="56" height="39" rx="7" fill="#494b48"/><rect x="-17" y="-25" width="20" height="8" rx="2" fill="#494b48"/><circle r="15" fill="#969c93"/><circle r="10" fill="#24332d"/><circle cx="-3" cy="-3" r="3" fill="#8baca4"/></>;
  if (index === 1) return <><rect x="-22" y="-31" width="44" height="62" rx="4" fill="#874738"/><circle cy="-2" r="12" fill="none" stroke="#ddbc7e"/><path d="M-12 -2H12M0-14V10" stroke="#ddbc7e"/><text y="22" textAnchor="middle" fontSize="5" fill="#ddbc7e">PASSPORT</text></>;
  if (index === 2) return <><path d="M-23 9V-5a23 23 0 0 1 46 0V9" fill="none" stroke="#575b53" strokeWidth="8"/><rect x="-29" y="0" width="14" height="27" rx="6" fill="#b7aa89"/><rect x="15" y="0" width="14" height="27" rx="6" fill="#b7aa89"/></>;
  if (index === 3) return <><rect x="-12" y="-29" width="24" height="9" rx="3" fill="#748576"/><rect x="-17" y="-22" width="34" height="55" rx="12" fill="#a4b9a5"/><path d="M-9-14V17" stroke="#d9e2cd" strokeWidth="3" strokeLinecap="round"/></>;
  if (index === 4) return <><rect x="-24" y="-29" width="48" height="58" rx="3" fill="#cea957"/><path d="M-17-29V29M15-29V29" stroke="#9b7938"/><path d="M-10-8H8M-10 0H8" stroke="#eee2b4"/></>;
  return <><path d="M-29-7h22l7 6 7-6h22l-4 22H9L0 0l-9 15h-16Z" fill="#534535"/><path d="M-25-3h15l-2 13h-10Zm35 0h15l-3 13H12Z" fill="#9b8d6b"/></>;
}

export function PackingList() {
  const material = useMaterials(), play = useSound();
  const [positions, setPositions] = useState(homes);
  const [packed, setPacked] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean; ox: number; oy: number } | null>(null);
  const toggle = (id: number) => {
    const exists = packed.includes(id);
    const next = exists ? packed.filter((i) => i !== id) : [...packed, id];
    const slots = essentials.map((_, i) => ({ x: 305 + i % 3 * 70, y: 204 + Math.floor(i / 3) * 73 }));
    const free = slots.find((slot) => !packed.some((item) => item !== id && Math.hypot(positions[item].x - slot.x, positions[item].y - slot.y) < 47)) ?? slots[id];
    setPacked(next);
    setPositions((value) => value.map((p, i) => i === id ? exists ? homes[id] : free : p));
    play(150, "thud", .6);
  };
  return <>
    <svg className="pg-visual" viewBox="0 0 600 420" aria-label="Packing list. Drag six travel items into the bag, or use the checklist below." onPointerMove={(event) => {
      if (!drag.current) return;
      const p = point(event), d = drag.current;
      d.moved ||= Math.hypot(p.x - d.x, p.y - d.y) > 5;
      setPositions((value) => value.map((item, i) => i === d.id ? { x: clamp(d.ox + p.x - d.x, 38, 562), y: clamp(d.oy + p.y - d.y, 50, 353) } : item));
    }} onPointerUp={() => {
      const d = drag.current; if (!d) return;
      if (!d.moved) toggle(d.id);
      else {
        const p = positions[d.id], inside = p.x > 262 && p.x < 516 && p.y > 151 && p.y < 328;
        if (inside) { setPacked((value) => value.includes(d.id) ? value : [...value, d.id]); play(150, "thud", .5); }
        else { setPacked((value) => value.filter((id) => id !== d.id)); setPositions((value) => value.map((p, i) => i === d.id ? homes[i] : p)); }
      }
      drag.current = null; setActive(null);
    }} onPointerCancel={() => { const d = drag.current; if (d) setPositions((value) => value.map((p, i) => i === d.id ? { x: d.ox, y: d.oy } : p)); drag.current = null; setActive(null); }}>
      {material.defs}
      <text x="126" y="55" textAnchor="middle" className="pg-svg-label" fill="#838274">THE ESSENTIALS</text>
      <path d="M332 169V117q0-48 43-48t43 48v52" fill="none" stroke="#6b7357" strokeWidth="14"/>
      <rect x="252" y="153" width="276" height="180" rx="32" fill="#485944" filter={material.shadow}/>
      <rect x="265" y="166" width="250" height="150" rx="24" fill="#293d30"/>
      {essentials.map((name, i) => <g key={name} transform={`translate(${homes[i].x} ${homes[i].y})`} opacity={packed.includes(i) ? .2 : .5}><rect x="-34" y="-37" width="68" height="74" rx="12" fill="none" stroke="#c4c0af" strokeDasharray="3 5"/></g>)}
      {essentials.map((name, i) => i).sort((a, b) => a === active ? 1 : b === active ? -1 : 0).map((i) => <g key={i} transform={`translate(${positions[i].x} ${positions[i].y}) rotate(${active === i ? -8 : packed.includes(i) ? (i % 3 - 1) * 7 : 0})`} filter={material.shadow} className="pg-grabbable" onPointerDown={(event) => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); const p = point(event); drag.current = { id: i, ...p, moved: false, ox: positions[i].x, oy: positions[i].y }; setActive(i); }}><rect x="-35" y="-38" width="70" height="76" fill="transparent"/><Essential index={i}/></g>)}
      <path d="M252 303 Q380 326 528 303 V324 Q528 349 502 349 H278Q252 349 252 324Z" fill="#7e8a62" pointerEvents="none"/>
      <path d="M264 331H516" stroke="#a4af85" strokeDasharray="3 4" pointerEvents="none"/>
      <text x="390" y="379" textAnchor="middle" className="pg-svg-label" fill="#6a7455">{packed.length === 6 ? "ALL PACKED. LET’S GO SOMEWHERE." : `${packed.length} OF 6 · A LITTLE ROOM FOR ADVENTURE`}</text>
    </svg>
    <div className="pg-checklist">{essentials.map((name, i) => <button key={name} aria-pressed={packed.includes(i)} onClick={() => toggle(i)}><span>{packed.includes(i) ? "✓" : "+"}</span>{name}</button>)}</div>
  </>;
}
