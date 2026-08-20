"use client";

// v2 hero: decorative SVG pieces + real text in the poster's 738x386 space.
// Interactions: hover a headline word to see its handwritten version, tap the
// heart (burst + racing beat), click the gear (ratchets + toggles theme),
// throw the globe (spins with momentum), click FREE TO STEAL (copies install).

import * as React from "react";
import { motion } from "motion/react";

const W = 738;
const H = 386;

export type Piece = {
  viewBox: string;
  inner: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/* --- tiny sounds + haptics --- */
let audioCtx: AudioContext | null = null;
function thump() {
  try {
    audioCtx ??= new AudioContext();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch {}
}
function tick() {
  try {
    audioCtx ??= new AudioContext();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch {}
}
function buzz(ms: number) {
  if (typeof navigator !== "undefined") navigator.vibrate?.(ms);
}

function box(p: Piece): React.CSSProperties {
  return {
    left: `${(p.x / W) * 100}%`,
    top: `${(p.y / H) * 100}%`,
    width: `${(p.w / W) * 100}%`,
    height: `${(p.h / H) * 100}%`,
  };
}

export function PieceSvg({ piece }: { piece: Piece }) {
  return (
    <svg
      viewBox={piece.viewBox}
      className="absolute"
      style={box(piece)}
      dangerouslySetInnerHTML={{ __html: piece.inner }}
    />
  );
}

/* --- headline word: handwritten version on hover --- */
function WordSlot({ print, hand }: { print: React.ReactNode; hand: Piece[] }) {
  const [hover, setHover] = React.useState(false);
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className={hover ? "opacity-0" : ""}>{print}</span>
      <span className={hover ? "" : "invisible"}>
        {hand.map((p, i) => (
          <PieceSvg key={i} piece={p} />
        ))}
      </span>
    </span>
  );
}

/* --- badges: tappable heart, gear = theme toggle --- */
const HEART_BURST = [
  { angle: 15, dist: 30, size: 5, color: "#002FFF" },
  { angle: 70, dist: 36, size: 4, color: "currentColor" },
  { angle: 120, dist: 30, size: 5, color: "#002FFF" },
  { angle: 165, dist: 38, size: 4, color: "#002FFF" },
  { angle: 210, dist: 32, size: 5, color: "currentColor" },
  { angle: 255, dist: 37, size: 4, color: "#002FFF" },
  { angle: 300, dist: 31, size: 5, color: "currentColor" },
  { angle: 345, dist: 36, size: 4, color: "#002FFF" },
];

function Badges({ piece }: { piece: Piece }) {
  const ref = React.useRef<SVGSVGElement>(null);
  const [burst, setBurst] = React.useState(0);
  const raceT = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const gearAngle = React.useRef(0);

  function onClick(e: React.MouseEvent) {
    const target = e.target as Element;
    const svg = ref.current!;
    if (target.closest(".oiad-heartbtn")) {
      thump();
      buzz(12);
      setBurst((b) => b + 1);
      svg.classList.add("oiad-racing");
      if (raceT.current) clearTimeout(raceT.current);
      raceT.current = setTimeout(
        () => svg.classList.remove("oiad-racing"),
        2200,
      );
    } else if (target.closest(".oiad-gear")) {
      tick();
      buzz(8);
      gearAngle.current += 60;
      svg
        .querySelector<SVGGElement>(".oiad-gear")
        ?.style.setProperty("transform", `rotate(${gearAngle.current}deg)`);
      const dark = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", dark);
      localStorage.theme = dark ? "dark" : "light";
    }
  }

  return (
    <>
      <svg
        ref={ref}
        viewBox={piece.viewBox}
        className="absolute [&_.oiad-gear]:cursor-pointer [&_.oiad-heartbtn]:cursor-pointer"
        style={box(piece)}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: piece.inner }}
      />
      {burst > 0 && (
        <span
          key={burst}
          aria-hidden="true"
          className="pointer-events-none absolute"
          // the heart's center within the badge row
          style={{
            left: `${((piece.x + 71.2) / W) * 100}%`,
            top: `${((piece.y + 17.3) / H) * 100}%`,
          }}
        >
          {HEART_BURST.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(rad) * p.dist,
                  y: Math.sin(rad) * p.dist,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
              />
            );
          })}
        </span>
      )}
    </>
  );
}

/* --- globe: ambient rotation, throwable with momentum --- */
function Globe({ piece }: { piece: Piece }) {
  const ref = React.useRef<SVGSVGElement>(null);
  const st = React.useRef({
    angle: 0,
    vel: 0,
    base: 0.133, // deg per frame ~= one turn per 45s
    dragging: false,
    last: 0,
  });

  React.useEffect(() => {
    const s = st.current;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) s.base = 0;
    s.vel = s.base;
    let raf = 0;
    const loop = () => {
      if (!s.dragging) {
        s.vel += (s.base - s.vel) * 0.015; // friction back to ambient drift
        s.angle += s.vel;
        ref.current?.style.setProperty("transform", `rotate(${s.angle}deg)`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function pointerAngle(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - (r.top + r.height / 2),
        e.clientX - (r.left + r.width / 2),
      ) *
        180) /
      Math.PI
    );
  }

  return (
    <svg
      ref={ref}
      viewBox={piece.viewBox}
      className="absolute cursor-grab touch-none select-none active:cursor-grabbing"
      style={box(piece)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const s = st.current;
        s.dragging = true;
        s.vel = 0;
        s.last = pointerAngle(e);
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (!s.dragging) return;
        const a = pointerAngle(e);
        let d = a - s.last;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        s.angle += d;
        s.vel = d;
        s.last = a;
        ref.current!.style.setProperty("transform", `rotate(${s.angle}deg)`);
      }}
      onPointerUp={() => (st.current.dragging = false)}
      onPointerCancel={() => (st.current.dragging = false)}
      dangerouslySetInnerHTML={{ __html: piece.inner }}
    />
  );
}

/* --- FREE TO STEAL: click copies the install command --- */
function Steal({ copyText }: { copyText: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(copyText);
        tick();
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="font-bricolage absolute flex cursor-pointer items-center gap-[0.8cqw] font-bold uppercase text-[#002FFF]"
      style={{ left: "6.5%", top: "86.6%", fontSize: "2.2cqw" }}
    >
      {copied ? "Copied." : "Free to steal"}
      <svg
        viewBox="0 0 11 12"
        className={`h-[0.72em] w-auto fill-current ${copied ? "oiad-steal-drop" : ""}`}
        aria-hidden="true"
      >
        <path d="M6.27246 7.5957L9.10645 4.76172L10.4639 6.08691L5.23633 11.3066L0 6.08691L1.35742 4.76172L4.19238 7.59668V0H6.27246V7.5957Z" />
      </svg>
    </button>
  );
}

export function HeroFlicker({
  statics,
  badges,
  globe,
  copyText,
  children,
  slots,
}: {
  statics: Piece[];
  badges: Piece;
  globe: Piece;
  copyText: string;
  children?: React.ReactNode; // static real-text layers
  slots: { print: React.ReactNode; hand: Piece[] }[];
}) {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size" }}
    >
      {statics.map((p, i) => (
        <PieceSvg key={i} piece={p} />
      ))}
      <Globe piece={globe} />
      <Badges piece={badges} />
      {children}
      {slots.map((slot, i) => (
        <WordSlot key={i} print={slot.print} hand={slot.hand} />
      ))}
      <Steal copyText={copyText} />
    </div>
  );
}
