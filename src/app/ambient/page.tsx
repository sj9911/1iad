"use client";

import * as React from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react";

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
    const tick = (now: FrameRequestCallback extends never ? never : number) => {
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

function Murmuration() {
  const pointer = React.useRef({ x: 0, y: 0, active: false });
  const burst = React.useRef({ x: 0, y: 0, strength: 0 });
  const reduced = useReducedMotion();
  const canvasRef = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    burst.current.strength *= 0.93;
    const N = 110;
    type Boid = { x: number; y: number; vx: number; vy: number };
    const host = ctx.canvas as HTMLCanvasElement & { __flock?: Boid[] };
    const boids: Boid[] =
      host.__flock ??
      Array.from({ length: N }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
      }));
    host.__flock = boids;
    for (const b of boids) {
      let ax = 0;
      let ay = 0;
      let cx = 0;
      let cy = 0;
      let vx = 0;
      let vy = 0;
      let count = 0;
      for (const o of boids) {
        if (o === b) continue;
        const dx = o.x - b.x;
        const dy = o.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 6400) continue;
        count += 1;
        cx += o.x;
        cy += o.y;
        vx += o.vx;
        vy += o.vy;
        if (d2 < 400) {
          ax -= dx * 0.05;
          ay -= dy * 0.05;
        }
      }
      if (count > 0) {
        ax += (cx / count - b.x) * 0.0035 + (vx / count - b.vx) * 0.05;
        ay += (cy / count - b.y) * 0.0035 + (vy / count - b.vy) * 0.05;
      }
      if (!reduced) {
        ax += Math.sin(t * 0.6 + b.x * 0.012) * 0.014;
        ay += Math.cos(t * 0.5 + b.y * 0.012) * 0.014;
      }
      if (pointer.current.active) {
        const dx = pointer.current.x - b.x;
        const dy = pointer.current.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 170) {
          const pull = 0.05 * (1 - d / 170);
          ax += dx * pull;
          ay += dy * pull;
        }
      }
      if (burst.current.strength > 0.01) {
        const dx = b.x - burst.current.x;
        const dy = b.y - burst.current.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 220) {
          const push = burst.current.strength * (1 - d / 220);
          ax += (dx / d) * push * 6;
          ay += (dy / d) * push * 6;
        }
      }
      const margin = 30;
      if (b.x < margin) ax += (margin - b.x) * 0.01;
      if (b.x > w - margin) ax -= (b.x - (w - margin)) * 0.01;
      if (b.y < margin) ay += (margin - b.y) * 0.01;
      if (b.y > h - margin) ay -= (b.y - (h - margin)) * 0.01;
      b.vx = Math.max(-4, Math.min(4, b.vx + ax));
      b.vy = Math.max(-4, Math.min(4, b.vy + ay));
      b.x += b.vx;
      b.y += b.vy;
      const speed = Math.hypot(b.vx, b.vy) || 1;
      const angle = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      ctx.fillStyle = `hsl(224 90% ${58 + (speed / 4) * 14}% / ${0.5 + (speed / 4) * 0.4})`;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, 3.2);
      ctx.lineTo(-2.4, 0);
      ctx.lineTo(-4, -3.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [reduced]);
  return (
    <div className="relative h-[300px] bg-[linear-gradient(180deg,#0b0e1d,#101530)]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full cursor-crosshair"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
        }}
        onPointerLeave={() => { pointer.current.active = false; }}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          burst.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, strength: 1 };
        }}
      />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-white/40">move to lead · click to scatter</p>
    </div>
  );
}

function InkPond() {
  const pointer = React.useRef({ x: 0, y: 0, px: 0, py: 0, active: false });
  const lastDrip = React.useRef(0);
  const hue = React.useRef(220);
  const reduced = useReducedMotion();
  const canvasRef = useCanvas((ctx, w, h, t) => {
    if (ctx.canvas.width === 0) return;
    ctx.fillStyle = "rgba(8, 10, 22, 0.08)";
    ctx.fillRect(0, 0, w, h);
    const p = pointer.current;
    const drop = (x: number, y: number, vx: number) => {
      hue.current = (hue.current + 0.35) % 360;
      const hueValue = 200 + Math.sin(t * 0.4) * 60;
      const radius = 3 + Math.min(14, Math.hypot(vx, 0) * 1.2);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
      gradient.addColorStop(0, `hsl(${hueValue} 90% 65% / 0.55)`);
      gradient.addColorStop(1, `hsl(${hueValue} 90% 55% / 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
      ctx.fill();
    };
    if (p.active) {
      drop(p.x, p.y, p.x - p.px);
      p.px = p.x;
      p.py = p.y;
    } else if (!reduced && t - lastDrip.current > 1.4) {
      lastDrip.current = t;
      drop(Math.random() * w, Math.random() * h, 0);
    }
  }, [reduced]);
  return (
    <div className="relative h-[300px] bg-[#080a16]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full cursor-crosshair"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const p = pointer.current;
          p.x = event.clientX - rect.left;
          p.y = event.clientY - rect.top;
          p.active = true;
        }}
        onPointerLeave={() => { pointer.current.active = false; }}
      />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-white/40">move slowly — the ink blooms where you linger</p>
    </div>
  );
}

function GrassField() {
  const pointer = React.useRef({ x: -999, y: -999 });
  const reduced = useReducedMotion();
  const canvasRef = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#eef4ff");
    sky.addColorStop(1, "#dfeafc");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    const baseY = h - 8;
    const gap = 7;
    const count = Math.ceil(w / gap) + 1;
    const blades = (ctx.canvas as HTMLCanvasElement & { __grass?: { x: number; height: number; phase: number; hue: number }[] }).__grass;
    const store =
      blades && blades.length === count
        ? blades
        : Array.from({ length: count }, (_, i) => ({
            x: i * gap,
            height: 34 + Math.random() * 46,
            phase: Math.random() * Math.PI * 2,
            hue: 96 + Math.random() * 26,
          }));
    (ctx.canvas as HTMLCanvasElement & { __grass?: typeof store }).__grass = store;
    ctx.lineCap = "round";
    for (const blade of store) {
      const wind = reduced ? 0 : Math.sin(t * 1.4 + blade.phase + blade.x * 0.02) * 3.4;
      const dx = blade.x - pointer.current.x;
      const dy = baseY - pointer.current.y;
      const dist = Math.hypot(dx, dy);
      const influence = dist < 90 ? (1 - dist / 90) : 0;
      const bend = wind + influence * Math.sign(dx || 1) * 26;
      ctx.strokeStyle = `hsl(${blade.hue} ${38 + influence * 22}% ${38 + influence * 16}%)`;
      ctx.lineWidth = 2 + influence * 1.2;
      ctx.beginPath();
      ctx.moveTo(blade.x, baseY);
      ctx.quadraticCurveTo(blade.x + bend * 0.35, baseY - blade.height * 0.62, blade.x + bend, baseY - blade.height);
      ctx.stroke();
      if (influence > 0.35 && !reduced && Math.random() < 0.012) {
        ctx.fillStyle = `hsl(${blade.hue + 30} 70% 72% / 0.9)`;
        ctx.beginPath();
        ctx.arc(blade.x + bend, baseY - blade.height, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [reduced]);
  return (
    <div className="relative h-[300px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full cursor-crosshair"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        }}
        onPointerLeave={() => { pointer.current = { x: -999, y: -999 }; }}
      />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-slate-500/70">comb through the grass — seeds shake loose</p>
    </div>
  );
}

function PetalGarden() {
  const pointer = React.useRef({ x: 0, y: 0, active: false });
  const reduced = useReducedMotion();
  const canvasRef = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fbfaf6";
    ctx.fillRect(0, 0, w, h);
    type Plant = { x: number; y: number; height: number; maxH: number; bloom: number; hue: number };
    type Petal = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; hue: number; life: number };
    const bag = (ctx.canvas as HTMLCanvasElement & { __garden?: { plants: Plant[]; petals: Petal[]; cooldown: number } }).__garden ?? { plants: [], petals: [], cooldown: 0 };
    (ctx.canvas as HTMLCanvasElement & { __garden?: typeof bag }).__garden = bag;
    const p = pointer.current;
    if (p.active) {
      bag.cooldown -= 1;
      const near = bag.plants.some((plant) => Math.hypot(plant.x - p.x, plant.y - p.y) < 26);
      if (bag.cooldown <= 0 && !near && bag.plants.length < 70) {
        bag.plants.push({
          x: p.x,
          y: Math.min(h - 6, p.y + 4),
          height: 2,
          maxH: 26 + Math.random() * 38,
          bloom: 0,
          hue: 330 + Math.random() * 40,
        });
        bag.cooldown = 14;
      }
    }
    const wind = reduced ? 0 : Math.sin(t * 1.1) * 2.6 + Math.sin(t * 0.37) * 1.8;
    for (const plant of bag.plants) {
      if (plant.height < plant.maxH) plant.height += 0.5;
      else if (plant.bloom < 1) plant.bloom = Math.min(1, plant.bloom + 0.02);
      const sway = wind * (plant.height / 60);
      const tipX = plant.x + sway;
      const tipY = plant.y - plant.height;
      ctx.strokeStyle = "hsl(120 30% 46%)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(plant.x, plant.y);
      ctx.quadraticCurveTo(plant.x + sway * 0.4, plant.y - plant.height * 0.6, tipX, tipY);
      ctx.stroke();
      if (plant.bloom > 0) {
        const size = plant.bloom * (4.5 + (plant.maxH / 64) * 2.5);
        for (let i = 0; i < 5; i += 1) {
          const angle = (i / 5) * Math.PI * 2 + t * 0.1;
          ctx.fillStyle = `hsl(${plant.hue} 80% 74% / 0.92)`;
          ctx.beginPath();
          ctx.ellipse(tipX + Math.cos(angle) * size * 0.7, tipY + Math.sin(angle) * size * 0.7, size * 0.55, size * 0.32, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `hsl(45 90% 62%)`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, size * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
      if (plant.bloom >= 1 && !reduced && Math.random() < 0.006 && bag.petals.length < 90) {
        bag.petals.push({
          x: tipX,
          y: tipY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.2 + Math.random() * 0.3,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.06,
          hue: plant.hue,
          life: 1,
        });
      }
    }
    for (let i = bag.petals.length - 1; i >= 0; i -= 1) {
      const petal = bag.petals[i];
      petal.x += petal.vx + Math.sin(t * 2 + petal.y * 0.05) * 0.5;
      petal.y += petal.vy;
      petal.rot += petal.vr;
      petal.life -= 0.002;
      if (petal.y > h + 10 || petal.life <= 0) {
        bag.petals.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rot);
      ctx.fillStyle = `hsl(${petal.hue} 80% 78% / ${petal.life})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.2, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-slate-500/70">wander slowly — flowers sprout, petals drift off</p>
    </div>
  );
}

export default function AmbientPage() {
  return (
    <main className="min-h-svh bg-background px-5 py-7 text-foreground sm:px-10 sm:py-10" style={{ backgroundImage: "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)", backgroundSize: "18px 18px" }}>
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.08]"><IconArrowLeft size={16} />Back</Link>
        <header className="mt-12 max-w-2xl sm:mt-16"><p className="font-mono text-xs font-semibold uppercase tracking-[.2em] text-[var(--oiad-blue)]">Take two / endless &amp; ambient</p><h1 className="font-bricolage mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Alive at rest.</h1><p className="mt-5 text-lg leading-relaxed text-muted">A second batch, in the Infinite Icon Grid direction — nothing to press, systems that drift on their own and come alive when you wander through them.</p></header>
        <div className="mt-12 grid gap-5 lg:grid-cols-2"><Study day="IDEA A" title="Murmuration" note="A flock you can lead"><Murmuration /></Study><Study day="IDEA B" title="Ink Pond" note="Luminous ink blooms"><InkPond /></Study><Study day="IDEA C" title="Grass Field" note="Comb through, seeds shake loose"><GrassField /></Study><Study day="IDEA D" title="Petal Garden" note="Wander to plant a garden"><PetalGarden /></Study></div>
        <div className="mt-8 flex items-center gap-2 text-sm text-muted"><IconSparkles size={16} className="text-[var(--oiad-blue)]" />Local study only — none of these are in the gallery yet.</div>
      </div>
    </main>
  );
}
