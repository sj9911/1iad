"use client";

import { useRef, useState } from "react";
import { Action, clamp, point, useMaterials, useSimulation, useSound } from "./shared";

const books = [
  { title: "Ways of seeing", colour: "#c06e42", height: 182, detail: "A collection of small observations. Familiar things, seen with fresh eyes." },
  { title: "Field notes", colour: "#b7b695", height: 158, detail: "Sketches from walks, overheard sentences, and ideas worth keeping." },
  { title: "After hours", colour: "#414f73", height: 198, detail: "Things made just for the pleasure of making them. No brief required." },
  { title: "Soft systems", colour: "#858f72", height: 177, detail: "Interfaces with a little give. How movement can make software feel human." },
  { title: "Collected", colour: "#c4a294", height: 151, detail: "A home for the odd little things that do not fit anywhere else." },
];

export function ModularShelf() {
  const material = useMaterials(), play = useSound();
  const [order, setOrder] = useState([0, 1, 2, 3, 4]);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{ id: number; x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const reorder = (id: number, slot: number) => {
    setOrder((value) => { const next = value.filter((x) => x !== id); next.splice(clamp(slot, 0, 4), 0, id); return next; });
    play(170, "thud", .6);
  };
  return <>
    <svg className="pg-visual" viewBox="0 0 600 420" aria-label="A modular bookshelf. Drag books to reorder, tap to read." onPointerMove={(event) => {
      if (!start.current || !dragging) return;
      const p = point(event); start.current.moved ||= Math.hypot(p.x - start.current.x, p.y - start.current.y) > 5;
      setDragging({ id: dragging.id, x: clamp(p.x, 95, 435), y: clamp(p.y, 80, 270) });
    }} onPointerUp={() => {
      if (dragging && start.current) { if (!start.current.moved) setSelected(dragging.id); else reorder(dragging.id, Math.round((dragging.x - 135) / 59)); }
      setDragging(null); start.current = null;
    }} onPointerCancel={() => { setDragging(null); start.current = null; }}>
      {material.defs}
      <path d="M98 306V340M502 306V340" stroke="#aab0a2" strokeWidth="8"/><rect x="69" y="288" width="462" height="19" rx="3" fill={material.wood} filter={material.shadow}/>
      <path d="M79 297H521" stroke="#825b3a" opacity=".3"/>
      {order.filter((id) => id !== dragging?.id).concat(dragging ? [dragging.id] : []).map((id) => {
        const book = books[id], slot = order.indexOf(id), held = dragging?.id === id;
        const x = held ? dragging.x - 26 : 109 + slot * 59, y = held ? dragging.y - book.height / 2 : 288 - book.height;
        return <g key={id} transform={`translate(${x} ${y}) rotate(${held ? -7 : slot === 4 ? 7 : slot === 0 ? -3 : 0} 26 ${book.height})`} className="pg-grabbable" onPointerDown={(event) => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); const p = point(event); start.current = { ...p, moved: false }; setDragging({ id, x: x + 26, y: y + book.height / 2 }); }}>
          <rect width="52" height={book.height} rx="3" fill={book.colour} filter={material.shadow}/><rect x="4" y="0" width="3" height={book.height} fill="#fff" opacity=".15"/>
          <path d={`M11 13H43M11 ${book.height - 16}H43`} stroke="#fff" opacity=".35"/>
          <text transform={`translate(30 ${book.height - 28}) rotate(-90)`} fontSize="12" letterSpacing=".8" fill="#fcf7e8">{book.title}</text>
        </g>;
      })}
      <g transform="translate(471 269)"><ellipse cy="20" rx="26" ry="4" fill="#645e49" opacity=".16"/><path d="M-20-30Q-30 16-11 19H11Q30 16 20-30Z" fill="#d6d2c2"/><ellipse cy="-30" rx="20" ry="5" fill="#a39e8a"/><path d="M0-30Q-8-89 22-107M1-58Q-23-77-21-89M5-73Q29-78 31-92" stroke="#74876a" strokeWidth="3" fill="none"/><ellipse cx="19" cy="-105" rx="12" ry="5" transform="rotate(-32 19 -105)" fill="#8e9e7b"/><ellipse cx="-19" cy="-88" rx="12" ry="5" transform="rotate(40 -19 -88)" fill="#758768"/></g>
      <text x="300" y="378" textAnchor="middle" className="pg-svg-label" fill="#817966">A SHELF FOR THE THINGS YOU KEEP.</text>
    </svg>
    {selected !== null && <div className="pg-object-sheet" role="dialog" aria-label={books[selected].title}><button className="pg-sheet-close" aria-label="Return book to shelf" onClick={() => setSelected(null)}>×</button><span className="pg-eyebrow">FROM YOUR COLLECTION</span><h3>{books[selected].title}</h3><p>{books[selected].detail}</p><Action onClick={() => { reorder(selected, 0); setSelected(null); }}>Move to the start of the shelf ←</Action></div>}
    <div className="pg-controls"><span className="pg-small">{order.length} things worth keeping</span><Action onClick={() => setSelected(order[0])}>Open first book ↗</Action></div>
  </>;
}

const sourceColours = ["#cf6b43", "#748a62", "#7777be"];
const sourceNames = ["Pulse", "Sine", "Drift"];
const outputNames = ["Light", "Orbit", "Note"];
export function CablePatchboard() {
  const material = useMaterials(), play = useSound();
  const [routes, setRoutes] = useState<(number | null)[]>([null, null, null]);
  const [pending, setPending] = useState<number | null>(null);
  const [end, setEnd] = useState({ x: 290, y: 200 });
  const [status, setStatus] = useState("Choose a source, then patch it into an output.");
  const lights = useRef<SVGCircleElement>(null), orb = useRef<SVGCircleElement>(null), bar = useRef<SVGRectElement>(null);
  const lastBeat = useRef(-1);
  const routeValue = (source: number | null, time: number) => source === null ? 0 : source === 0 ? Math.sin(time * 5) > 0 ? 1 : .12 : source === 1 ? (Math.sin(time * 2) + 1) / 2 : (Math.sin(time * .7) * Math.cos(time * 1.3) + 1) / 2;
  const ref = useSimulation((_, time) => {
    lights.current?.setAttribute("opacity", String(.13 + routeValue(routes[0], time) * .87));
    const angle = routeValue(routes[1], time) * Math.PI * 2;
    orb.current?.setAttribute("cx", String(498 + Math.cos(angle) * 17)); orb.current?.setAttribute("cy", String(210 + Math.sin(angle) * 17));
    const note = routeValue(routes[2], time);
    bar.current?.setAttribute("height", String(4 + note * 25)); bar.current?.setAttribute("y", String(307 - note * 25));
    const beat = Math.floor(time * (routes[2] === 0 ? 2 : routes[2] === 1 ? 1 : .6));
    if (routes[2] !== null && beat !== lastBeat.current) { lastBeat.current = beat; play([392, 523.25, 659.25][routes[2]], "bell", .35); }
  });
  const connect = (output: number) => {
    setRoutes((value) => value.map((route, i) => i === output ? pending : route));
    setStatus(pending === null ? `${outputNames[output]} unplugged.` : `${sourceNames[pending]} → ${outputNames[output]}. Try another connection.`);
    play(200, "click"); setPending(null);
  };
  return <>
    <svg ref={ref} className="pg-visual" viewBox="0 0 600 420" aria-label="Cable patchboard. Drag from a left source to a right output, or use the connection selectors below." onPointerMove={(event) => { if (pending !== null) setEnd(point(event)); }} onPointerUp={(event) => {
      if (pending === null) return;
      const p = point(event), output = Math.round((p.y - 120) / 90);
      if (Math.abs(p.x - 415) < 34 && output >= 0 && output < 3 && Math.abs(p.y - (120 + output * 90)) < 32) connect(output);
    }} onPointerCancel={() => setPending(null)}>
      {material.defs}
      <rect x="61" y="49" width="478" height="320" rx="19" fill="#e0e0d6" stroke="#bec2b7" filter={material.shadow}/>
      {[78, 522].flatMap((x) => [65, 353].map((y) => <g key={`${x}${y}`}><circle cx={x} cy={y} r="4" fill={material.metal}/><path d={`M${x - 2} ${y}h4`} stroke="#747d71"/></g>))}
      <text x="96" y="83" className="pg-svg-label" fill="#6b7262">SOURCE</text><text x="383" y="83" className="pg-svg-label" fill="#6b7262">OUTPUT</text>
      {sourceNames.map((name, i) => <g key={name}><text x="100" y={125 + i * 90} fontSize="13" fill="#525c4d">{name}</text><circle cx="190" cy={120 + i * 90} r="16" fill={material.metal}/><circle data-port={`source-${i}`} cx="190" cy={120 + i * 90} r="11" stroke={pending === i ? sourceColours[i] : "#46503f"} strokeWidth="4" fill="#273124" className="pg-clickable" onPointerDown={(event) => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); setPending(i); setEnd(point(event)); play(160, "click", .5); }}/></g>)}
      {outputNames.map((name, i) => <g key={name}><text x="380" y={152 + i * 90} fontSize="11" fill="#636b59">{name}</text><circle cx="415" cy={120 + i * 90} r="16" fill={material.metal}/><circle data-port={`output-${i}`} cx="415" cy={120 + i * 90} r="11" fill="#273124" stroke={routes[i] === null ? "#46503f" : sourceColours[routes[i]!]} strokeWidth="4" className="pg-clickable" onPointerDown={() => { if (pending === null) { setRoutes((value) => value.map((v, index) => index === i ? null : v)); setStatus(`${name} unplugged.`); } }}/></g>)}
      <circle cx="498" cy="120" r="19" fill="#b9bfaa"/><circle ref={lights} cx="498" cy="120" r="15" fill={routes[0] === null ? "#a5ad91" : sourceColours[routes[0]]}/>
      <circle cx="498" cy="210" r="19" fill="none" stroke="#b5bcaa"/><circle ref={orb} cx="515" cy="210" r="5" fill={routes[1] === null ? "#adb59f" : sourceColours[routes[1]]}/>
      <rect x="478" y="281" width="40" height="32" rx="4" fill="#c3c9b9"/><rect ref={bar} x="489" y="304" width="18" height="4" rx="2" fill={routes[2] === null ? "#adb59f" : sourceColours[routes[2]]}/>
      {routes.map((source, output) => source === null ? null : <g key={output} pointerEvents="none"><path d={`M190 ${120 + source * 90} C235 ${260 + source * 45},365 ${310 + output * 25},415 ${120 + output * 90}`} stroke="#2f3329" strokeOpacity=".18" strokeWidth="12" fill="none" transform="translate(0 4)"/><path d={`M190 ${120 + source * 90} C235 ${260 + source * 45},365 ${310 + output * 25},415 ${120 + output * 90}`} stroke={sourceColours[source]} strokeWidth="7" strokeLinecap="round" fill="none"/><circle cx="190" cy={120 + source * 90} r="6" fill={sourceColours[source]}/><circle cx="415" cy={120 + output * 90} r="6" fill={sourceColours[source]}/></g>)}
      {pending !== null && <path d={`M190 ${120 + pending * 90} Q260 ${end.y + 120} ${end.x} ${end.y}`} stroke={sourceColours[pending]} strokeWidth="7" fill="none" strokeLinecap="round" pointerEvents="none"/>}
      <text x="300" y="399" textAnchor="middle" fontSize="11" fill="#78816e">{status}</text>
    </svg>
    <div className="pg-patches">{outputNames.map((name, i) => <label key={name}>{name}<select aria-label={`${name} source`} value={routes[i] ?? ""} onChange={(event) => { const value = event.target.value; setRoutes((routes) => routes.map((route, j) => i === j ? value === "" ? null : Number(value) : route)); play(180); }}><option value="">Unplugged</option>{sourceNames.map((source, j) => <option key={source} value={j}>{source}</option>)}</select></label>)}</div>
  </>;
}

export function StampDesk() {
  const material = useMaterials(), play = useSound();
  const [held, setHeld] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [pos, setPos] = useState({ x: 466, y: 292 });
  const [ink, setInk] = useState("#ba493d");
  const [label, setLabel] = useState("APPROVED");
  const [marks, setMarks] = useState<{ x: number; y: number; angle: number; opacity: number; ink: string; text: string }[]>([]);
  const down = useRef<{ x: number; y: number; time: number } | null>(null);
  const stamp = (x: number, y: number, time = 200) => {
    if (x < 106 || x > 323 || y < 79 || y > 323) return;
    setMarks((value) => [...value.slice(-29), { x, y, angle: (Math.random() - .5) * 15, opacity: clamp(.5 + time / 1100, .55, .93), ink, text: label.trim() || "APPROVED" }]);
    play(115, "thud", 1.5);
  };
  const stow = () => { setHeld(false); setPressed(false); down.current = null; setPos({ x: 466, y: 292 }); };
  return <>
    <svg className={`pg-visual ${held ? "pg-stamp-held" : ""}`} viewBox="0 0 600 420" aria-label="Stamp desk. Hover over the stamp to pick it up, then press the invoice." onPointerMove={(event) => { if (held) setPos(point(event)); }} onPointerLeave={stow} onPointerDown={(event) => { if (!held) return; const p = point(event); down.current = { ...p, time: performance.now() }; setPos(p); setPressed(true); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={() => { if (down.current) stamp(down.current.x, down.current.y, performance.now() - down.current.time); setPressed(false); down.current = null; }} onPointerCancel={stow}>
      {material.defs}
      <rect x="66" y="46" width="311" height="315" rx="3" fill={material.paper} filter={material.shadow}/>
      <text x="89" y="83" fontSize="24" fontWeight="600" fill="#42443d">Invoice</text><text x="89" y="104" className="pg-svg-label" fill="#8f9185">NO. 019 / THE LITTLE THINGS STUDIO</text>
      <path d="M89 126H354" stroke="#d8d6ca"/>
      <text x="89" y="153" fontSize="12" fill="#73766a">A little bit of imagination</text><text x="352" y="153" textAnchor="end" fontSize="12" fill="#73766a">120.00</text>
      <text x="89" y="181" fontSize="12" fill="#73766a">Time spent making things</text><text x="352" y="181" textAnchor="end" fontSize="12" fill="#73766a">80.00</text>
      <path d="M89 200H354" stroke="#d8d6ca"/><text x="89" y="227" fontSize="15" fill="#45483e">Total</text><text x="352" y="227" textAnchor="end" fontSize="21" fill="#45483e">200.00</text>
      <rect x="93" y="253" width="169" height="73" rx="4" fill="none" stroke="#cfccbd" strokeDasharray="3 4"/><text x="177" y="296" textAnchor="middle" className="pg-svg-label" fill="#bab7a8">STAMP HERE</text>
      {held && !pressed && pos.x > 106 && pos.x < 323 && pos.y > 79 && pos.y < 323 && <rect x={pos.x - 59} y={pos.y - 17} width="118" height="34" rx="3" fill="none" stroke={ink} opacity=".2"/>}
      {marks.map((mark, i) => <g key={i} transform={`translate(${mark.x} ${mark.y}) rotate(${mark.angle})`} opacity={mark.opacity} pointerEvents="none"><rect x="-59" y="-17" width="118" height="34" rx="3" fill="none" stroke={mark.ink} strokeWidth="2.4" strokeDasharray={`${19 + i % 7} .7 12 .3`}/><text y="6" textAnchor="middle" fontSize="16" fontWeight="800" letterSpacing="1" fill={mark.ink} textLength={Math.min(100, mark.text.length * 11)} lengthAdjust="spacingAndGlyphs">{mark.text}</text><path d="M-50-10l15 1m29 19 21-1M-3-5l2 11" stroke="#fffdf6" strokeWidth=".6" opacity=".55"/></g>)}
      <rect x="412" y="263" width="110" height="61" rx="12" fill="#655341" stroke="#4a3b2d" filter={material.shadow}/><rect x="422" y="272" width="90" height="39" rx="5" fill="#282a26"/>
      <text x="467" y="351" textAnchor="middle" className="pg-svg-label" fill="#948571">{held ? "STAMP IN USE" : "PICK ME UP"}</text>
      <g transform={`translate(${pos.x} ${pos.y - (pressed ? 0 : held ? 18 : 0)}) rotate(${held && !pressed ? -8 : 0})`} style={{ pointerEvents: held ? "none" : "auto" }} onPointerEnter={(event) => { if (event.pointerType === "mouse") { setHeld(true); setPos(point(event)); play(160, "click", .5); } }} onPointerDown={(event) => { event.stopPropagation(); setHeld(true); setPos(point(event)); }}>
        <ellipse cy="8" rx="56" ry={held ? 10 : 5} fill="#282519" opacity=".12"/>
        <rect x="-50" y="-15" width="100" height="22" rx="5" fill="#363631"/>
        <path d="M-48-16Q-39-34 0-34T48-16Z" fill={material.wood} stroke="#9b6948"/>
        <path d="M-11-30V-62Q-28-73-23-94Q-17-112 0-112T23-94Q28-73 11-62V-30Z" fill={material.wood} stroke="#9b6948"/>
        <path d="M-10-93Q-16-81-7-72" fill="none" stroke="#f0cc9c" strokeWidth="4" strokeLinecap="round" opacity=".6"/>
      </g>
    </svg>
    <div className="pg-stamp-controls"><input aria-label="Stamp text" value={label} maxLength={10} onChange={(event) => setLabel(event.target.value.toUpperCase().replace(/[^A-Z0-9 !]/g, ""))}/><div className="pg-inks">{["#ba493d", "#304fb1", "#3c7057"].map((colour, i) => <button key={colour} aria-label={`${["Red", "Blue", "Green"][i]} ink`} aria-pressed={ink === colour} style={{ background: colour }} onClick={() => setInk(colour)}/>)}</div><Action onClick={() => stamp(177, 285, 400)}>Stamp invoice</Action></div>
    <span className="pg-stamp-status" role="status">{marks.length ? `${marks.length} impression${marks.length > 1 ? "s" : ""} · demo document only` : "Hold a little longer for a darker impression."}</span>
  </>;
}

const folders = [
  { title: "Ideas", colour: "#c7b57d", heading: "Things to try.", body: "A tiny idea can turn into something worth keeping. Start with the part that makes you curious.", note: "03 NOTES / UPDATED TODAY" },
  { title: "Projects", colour: "#98aa95", heading: "A work in progress.", body: "One interaction a day. An ongoing collection of playful details, made to be touched and shared.", note: "10 EXPERIMENTS / IN THE MAKING" },
  { title: "Inspiration", colour: "#a9b2c4", heading: "Keep your eyes open.", body: "A drawer handle. A paper ticket. The sound of a chime. Good interfaces often start far from a screen.", note: "06 REFERENCES / COLLECTED SLOWLY" },
  { title: "Archive", colour: "#c1a297", heading: "Nothing is wasted.", body: "The paths you did not take are still useful. Put them somewhere you can find them again.", note: "04 STORIES / SAVED FOR LATER" },
];

export function FilingDrawer() {
  const material = useMaterials(), play = useSound();
  const [open, setOpen] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const handle = useRef<{ y: number; open: number; moved: boolean } | null>(null);
  const folderDrag = useRef<{ id: number; y: number } | null>(null);
  const [liftingFolder, setLiftingFolder] = useState<number | null>(null);
  const [lift, setLift] = useState(0);
  const changeOpen = (value: number) => { setOpen(value); setHover(null); play(210, "paper", .8); };
  return <>
    <svg className="pg-visual" viewBox="0 0 600 420" aria-label="Filing drawer. Pull the handle down, then hover over folders and lift one out." onPointerMove={(event) => {
      const p = point(event);
      if (handle.current) { handle.current.moved ||= Math.abs(p.y - handle.current.y) > 4; setOpen(clamp(handle.current.open + (p.y - handle.current.y) / 110, 0, 1)); }
      if (folderDrag.current) setLift(clamp(folderDrag.current.y - p.y, 0, 100));
    }} onPointerUp={() => {
      if (handle.current) { changeOpen(handle.current.moved ? open > .35 ? 1 : 0 : open > .5 ? 0 : 1); handle.current = null; }
      if (folderDrag.current) { setSelected(folderDrag.current.id); folderDrag.current = null; setLiftingFolder(null); setLift(0); play(500, "paper"); }
    }} onPointerCancel={() => { handle.current = null; folderDrag.current = null; setLiftingFolder(null); setLift(0); }}>
      {material.defs}
      <rect x="131" y="74" width="338" height="245" rx="12" fill="#aeb5af" stroke="#969f97" filter={material.shadow}/>
      <rect x="145" y="85" width="310" height="210" rx="5" fill="#48584f"/>
      <path d={`M145 117 121 ${221 + open * 79}H479L455 117`} fill="#7e8e7f" stroke="#66786b"/>
      {[0, 1, 2, 3].map((i) => {
        const y = 125 + i * open * 34 - (hover === i ? 16 : 0) - (liftingFolder === i ? lift : 0);
        return <g key={i} transform={`translate(159 ${y})`} className="pg-grabbable" style={{ pointerEvents: open > .5 ? "auto" : "none" }} onPointerEnter={() => { if (open > .5 && !handle.current) { setHover(i); play(650, "paper", .2); } }} onPointerLeave={() => { if (!folderDrag.current) setHover(null); }} onPointerDown={(event) => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); folderDrag.current = { id: i, y: point(event).y }; setLiftingFolder(i); }}>
          <path d={`M0 10H${i * 63 + 8}V-8Q${i * 63 + 8}-14 ${i * 63 + 15}-14H${i * 63 + 66}Q${i * 63 + 74}-14 ${i * 63 + 74}-8V10H282V128H0Z`} fill={folders[i].colour} stroke="#667460" strokeOpacity=".35"/>
          <rect x="13" y="24" width="255" height="87" fill="#f9f7eb"/><path d="M30 42H233M30 56H233M30 70H160" stroke="#d5d6c9"/>
          <text x={i * 63 + 40} y="1" textAnchor="middle" fontSize="9" fill="#465440">{folders[i].title}</text>
        </g>;
      })}
      <rect x="144" y="85" width="312" height={96 * (1 - open)} fill="#b7bfb5" pointerEvents="none"/>
      <g transform={`translate(0 ${open * 95})`}>
        <path d="M123 181H477V296Q477 306 466 306H134Q123 306 123 296Z" fill="#c8cec5" stroke="#a4aea2" filter={material.shadow}/>
        <path d="M134 192H466" stroke="#e6e9df" strokeWidth="2"/>
        <rect x="263" y="210" width="74" height="28" rx="3" fill={material.metal} stroke="#9ba599"/>
        <rect x="270" y="215" width="60" height="17" fill="#f6f1df"/><text x="300" y="227" textAnchor="middle" fontSize="6.3" letterSpacing=".1" fill="#5b6657">THE GOOD STUFF</text>
        <g className="pg-grabbable" onPointerDown={(event) => { event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); handle.current = { y: point(event).y, open, moved: false }; }}>
          <rect x="240" y="245" width="120" height="42" fill="transparent"/>
          <path d="M255 256V268Q300 277 345 268V256" fill="none" stroke="#869385" strokeWidth="12" strokeLinecap="round"/><path d="M255 253V265Q300 274 345 265V253" fill="none" stroke={material.metal} strokeWidth="8" strokeLinecap="round"/>
        </g>
      </g>
    </svg>
    {selected !== null && <div className="pg-object-sheet" role="dialog" aria-label={`${folders[selected].title} folder`}><button className="pg-sheet-close" aria-label="Return folder" onClick={() => setSelected(null)}>×</button><span className="pg-eyebrow">{folders[selected].note}</span><h3>{folders[selected].heading}</h3><p>{folders[selected].body}</p><Action onClick={() => { setSelected(null); play(500, "paper"); }}>Return to drawer ↓</Action></div>}
    <div className="pg-controls"><Action onClick={() => changeOpen(open > .5 ? 0 : 1)}>{open > .5 ? "Close drawer ↑" : "Open drawer ↓"}</Action>{open > .5 && <select className="pg-folder-select" aria-label="Open folder" value="" onChange={(event) => { if (event.target.value !== "") setSelected(Number(event.target.value)); }}><option value="">Choose a folder…</option>{folders.map((folder, i) => <option value={i} key={folder.title}>{folder.title}</option>)}</select>}</div>
  </>;
}
