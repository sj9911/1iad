"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { IconArrowLeft, IconSparkles, IconTarget } from "@tabler/icons-react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const CSS_EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

function Study({
  day,
  title,
  note,
  children,
}: {
  day: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-hairline bg-surface shadow-[0_18px_52px_rgba(0,0,0,.07)]">
      <div className="flex items-start justify-between gap-5 border-b border-hairline px-5 py-4 sm:px-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--oiad-blue)]">{day}</p>
          <h2 className="font-bricolage mt-1 text-xl font-semibold tracking-[-0.035em]">{title}</h2>
        </div>
        <p className="max-w-40 pt-1 text-right text-xs leading-relaxed text-muted">{note}</p>
      </div>
      <div className="min-h-[300px]">{children}</div>
    </section>
  );
}

function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  deps: React.DependencyList = [],
) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const start = performance.now();
    const tick = (now: number) => {
      draw(ctx, w, h, (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return canvasRef;
}

function XRayLens() {
  const [lens, setLens] = React.useState({ x: -200, y: -200, on: false });
  return (
    <div
      className="relative h-[300px] cursor-none overflow-hidden bg-[#f5f5f7]"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setLens({ x: event.clientX - rect.left, y: event.clientY - rect.top, on: true });
      }}
      onPointerLeave={() => setLens((current) => ({ ...current, on: false }))}
    >
      <div className="absolute inset-0 grid place-items-center [background-image:radial-gradient(circle,rgba(0,0,0,.13)_1.25px,transparent_1.25px)] [background-size:16px_16px]">
        <span className="font-bricolage select-none text-[clamp(4rem,16vw,7rem)] font-extrabold tracking-[-.05em] text-foreground/85">OIAD</span>
        <p className="absolute bottom-4 font-mono text-[10px] uppercase tracking-[.2em] text-black/30">surface — version you know</p>
      </div>
      <motion.div
        animate={{ opacity: lens.on ? 1 : 0 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        className="absolute inset-0 bg-[#04060f] [background-image:linear-gradient(rgba(64,140,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(64,140,255,.16)_1px,transparent_1px)] [background-size:22px_22px]"
        style={{ clipPath: `circle(88px at ${lens.x}px ${lens.y}px)` }}
      >
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-bricolage select-none text-[clamp(4rem,16vw,7rem)] font-extrabold tracking-[-.05em] text-[#5ea0ff]" style={{ textShadow: "0 0 18px rgba(94,160,255,.8), 0 0 42px rgba(94,160,255,.45)" }}>OIAD</span>
        </div>
        <span className="absolute left-5 top-4 font-mono text-[9px] uppercase tracking-[.18em] text-[#5ea0ff]/80">x-ray · beneath the surface</span>
        <span className="absolute right-5 top-4 font-mono text-[9px] tracking-[.14em] text-[#5ea0ff]/60">3,812 stars</span>
        <span className="absolute bottom-4 left-5 font-mono text-[9px] tracking-[.14em] text-[#5ea0ff]/60">day 07 · vinyl player · live</span>
        <span className="absolute bottom-4 right-5 font-mono text-[9px] tracking-[.14em] text-[#5ea0ff]/60">v2.4.1</span>
      </motion.div>
      <div
        className="pointer-events-none absolute size-[176px] rounded-full border-2 border-[var(--oiad-blue)] shadow-[0_0_24px_rgba(0,47,255,.35)_inset]"
        style={{ transform: `translate(${lens.x - 88}px, ${lens.y - 88}px)`, opacity: lens.on ? 1 : 0, transition: "opacity 150ms" }}
      />
    </div>
  );
}

function FerrousPool() {
  const pointer = React.useRef({ x: 0, y: 0, active: false });
  const reduced = useReducedMotion();
  const canvasRef = useCanvas((ctx, w, h, t) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0a0c18");
    sky.addColorStop(1, "#11142a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    const p = pointer.current;
    const baseY = h * 0.6;
    const surface: { x: number; y: number }[] = [];
    for (let x = 0; x <= w; x += 3) {
      const dist = Math.abs(x - p.x);
      const near = p.active ? Math.exp(-(dist * dist) / 7200) : 0;
      const n = Math.sin(x * 0.11 + t * 0.9) * 0.5 + Math.sin(x * 0.033 - t * 0.45) * 0.5;
      const spike = near * (14 + 30 * Math.abs(n) + (n > 0.55 ? 16 : 0));
      const idle = reduced ? 0 : Math.sin(x * 0.045 + t * 0.6) * 1.8;
      surface.push({ x, y: baseY - spike + idle });
    }
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(surface[0].x, surface[0].y);
    for (const point of surface) ctx.lineTo(point.x, point.y);
    ctx.lineTo(w, h);
    ctx.closePath();
    const pool = ctx.createLinearGradient(0, baseY - 60, 0, h);
    pool.addColorStop(0, "#181c30");
    pool.addColorStop(1, "#04050c");
    ctx.fillStyle = pool;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(surface[0].x, surface[0].y);
    for (const point of surface) ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = "rgba(120,160,255,.5)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (let i = 2; i < surface.length; i += 4) {
      const a = surface[i - 2];
      const b = surface[i];
      if (a.y - b.y > 3.2) {
        ctx.fillStyle = "rgba(160,190,255,.75)";
        ctx.beginPath();
        ctx.arc(b.x, b.y - 1.4, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (p.active && p.y < baseY) {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 70);
      glow.addColorStop(0, "rgba(140,170,255,.22)");
      glow.addColorStop(1, "rgba(140,170,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [reduced]);
  return (
    <div className="relative h-[300px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full cursor-crosshair"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
        }}
        onPointerLeave={() => { pointer.current.active = false; }}
      />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-white/40">hover the surface — the fluid reaches for you</p>
    </div>
  );
}

type Orbiter = { angle: number; radius: number; speed: number; size: number; tilt: number };

function BulletTime() {
  const [frozen, setFrozen] = React.useState(false);
  const timeScale = React.useRef(1);
  const reduced = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  useAnimationFrame((now) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const target = frozen ? 0.04 : 1;
    timeScale.current += (target - timeScale.current) * 0.09;
    const last = (canvas as HTMLCanvasElement & { __last?: number }).__last ?? now;
    const dt = Math.min(0.05, (now - last) / 1000) * timeScale.current;
    (canvas as HTMLCanvasElement & { __last?: number }).__last = now;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    if (canvas.width !== Math.round(w * dpr)) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#060814";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const store = (canvas as HTMLCanvasElement & { __orbiters?: Orbiter[] }).__orbiters;
    const orbiters =
      store ??
      Array.from({ length: 46 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 24 + Math.random() * 110,
        speed: 0.5 + Math.random() * 1.6,
        size: 1.4 + Math.random() * 2.6,
        tilt: 0.42 + Math.random() * 0.2,
      }));
    (canvas as HTMLCanvasElement & { __orbiters?: Orbiter[] }).__orbiters = orbiters;
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    coreGlow.addColorStop(0, "rgba(94,140,255,.5)");
    coreGlow.addColorStop(1, "rgba(94,140,255,0)");
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();
    for (const orbiter of orbiters) {
      orbiter.angle += orbiter.speed * dt;
      for (let segment = 5; segment >= 0; segment -= 1) {
        const angle = orbiter.angle - orbiter.speed * dt * segment * 1.4;
        const x = cx + Math.cos(angle) * orbiter.radius;
        const y = cy + Math.sin(angle) * orbiter.radius * orbiter.tilt;
        const alpha = 0.85 * (1 - segment / 6);
        ctx.fillStyle = `hsl(${218 + orbiter.radius * 0.25} 90% 70% / ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, orbiter.size * (1 - segment / 9), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  return (
    <div
      className="relative h-[300px] select-touch-none overflow-hidden"
      onPointerDown={() => { timeScale.current = Math.max(timeScale.current, reduced ? 0.4 : 0.35); setFrozen(true); }}
      onPointerUp={() => setFrozen(false)}
      onPointerLeave={() => setFrozen(false)}
    >
      <div
        className="absolute inset-0"
        style={{ transform: frozen ? "scale(1.09)" : "scale(1)", transition: `transform 700ms ${CSS_EASE_OUT}` }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 size-full cursor-pointer touch-none" />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: frozen ? 1 : 0,
          transition: `opacity 700ms ${CSS_EASE_OUT}`,
          background: "radial-gradient(circle at 50% 50%, transparent 38%, rgba(3,4,12,.55) 100%)",
        }}
      />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-white/45">{frozen ? "bullet time — hold to keep it slow" : "press and hold to slow the system"}</p>
    </div>
  );
}

function JellyCard() {
  const reduced = useReducedMotion();
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, reduced ? { stiffness: 320, damping: 30 } : { stiffness: 140, damping: 11, mass: 0.9 });
  const springY = useSpring(targetY, reduced ? { stiffness: 320, damping: 30 } : { stiffness: 140, damping: 11, mass: 0.9 });
  const dragging = React.useRef(false);
  const transform = useTransform([springX, springY], (values: number[]) => {
    const [x, y] = values;
    const distance = Math.hypot(x, y);
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    const stretch = Math.min(0.38, distance * 0.0011);
    return `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.55}) rotate(${-angle}deg)`;
  });
  return (
    <div
      className="relative grid h-[300px] place-items-center bg-[radial-gradient(circle_at_50%_45%,#eef1ff,transparent_62%)] touch-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragging.current = true;
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        targetX.set(event.clientX - rect.left - rect.width / 2);
        targetY.set(event.clientY - rect.top - rect.height / 2);
      }}
      onPointerUp={() => {
        dragging.current = false;
        targetX.set(0);
        targetY.set(0);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        targetX.set(0);
        targetY.set(0);
      }}
    >
      <motion.div
        style={{ transform }}
        className="grid h-[124px] w-[210px] cursor-grab place-items-center rounded-[26px] border border-[#002fff]/20 bg-[linear-gradient(150deg,#ffffff,#e9edfb)] shadow-[0_22px_48px_rgba(0,47,255,.16)] active:cursor-grabbing"
      >
        <span className="flex flex-col items-center gap-1.5 text-[var(--oiad-blue)]">
          <IconTarget size={22} stroke={1.7} />
          <span className="font-mono text-[10px] uppercase tracking-[.22em]">grab me anywhere</span>
        </span>
      </motion.div>
      <p className="absolute bottom-5 text-xs text-muted">drag it out — it stretches, then snaps home</p>
    </div>
  );
}

export default function WildPage() {
  return (
    <main className="min-h-svh bg-background px-5 py-7 text-foreground sm:px-10 sm:py-10" style={{ backgroundImage: "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)", backgroundSize: "18px 18px" }}>
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.08]"><IconArrowLeft size={16} />Back</Link>
        <header className="mt-12 max-w-2xl sm:mt-16"><p className="font-mono text-xs font-semibold uppercase tracking-[.2em] text-[var(--oiad-blue)]">Take three / loud &amp; strange</p><h1 className="font-bricolage mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">The wild batch.</h1><p className="mt-5 text-lg leading-relaxed text-muted">Four different styles: a magic reveal, a liquid metal pool, a bullet-time toy, and a physics object. Pick whatever feels most like a 1IAD day.</p></header>
        <div className="mt-12 grid gap-5 lg:grid-cols-2"><Study day="IDEA E" title="X-Ray Lens" note="Cursor as a porthole"><XRayLens /></Study><Study day="IDEA F" title="Ferrous Pool" note="Ferrofluid reaches for you"><FerrousPool /></Study><Study day="IDEA G" title="Bullet Time" note="Hold to slow the system"><BulletTime /></Study><Study day="IDEA H" title="Jelly Card" note="Grab, stretch, flick"><JellyCard /></Study></div>
        <div className="mt-8 flex items-center gap-2 text-sm text-muted"><IconSparkles size={16} className="text-[var(--oiad-blue)]" />Local study only — none of these are in the gallery yet.</div>
      </div>
    </main>
  );
}
