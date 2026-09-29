"use client";

// Murmuration — a calm, orbiting flock. The pointer leads with a soft
// tangential pull (birds circle you instead of piling onto the cursor),
// wander is a slow drift, and every bird respects a tunable speed ceiling.

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { IconFeather, IconGauge, IconMagnet, IconTarget, IconWind } from "@tabler/icons-react";
import { DialRow, TunerHeader } from "@/components/tuner-controls";
import { useCanvas } from "./canvas";

type Settings = {
  count: number;
  speed: number;
  eagerness: number;
  wander: number;
  cohesion: number;
};

export const MURMURATION_DEFAULTS: Settings = {
  count: 110,
  speed: 1.25,
  eagerness: 0.55,
  wander: 0.5,
  cohesion: 1,
};

type Boid = { x: number; y: number; vx: number; vy: number };

export function Murmuration({
  count = MURMURATION_DEFAULTS.count,
  speed = MURMURATION_DEFAULTS.speed,
  eagerness = MURMURATION_DEFAULTS.eagerness,
  wander = MURMURATION_DEFAULTS.wander,
  cohesion = MURMURATION_DEFAULTS.cohesion,
}: Settings) {
  const pointer = React.useRef({ x: 0, y: 0, active: false });
  const burst = React.useRef({ x: 0, y: 0, strength: 0 });
  const reduced = useReducedMotion();
  const canvasRef = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    burst.current.strength *= 0.94;
    const host = ctx.canvas as HTMLCanvasElement & { __flock?: Boid[] };
    let boids = host.__flock;
    if (!boids || boids.length !== count) {
      const previous = boids ?? [];
      boids = Array.from({ length: count }, (_, i) =>
        previous[i] ?? {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
        },
      );
      host.__flock = boids;
    }
    const radius = 200;
    for (const b of boids) {
      let ax = 0;
      let ay = 0;
      let cx = 0;
      let cy = 0;
      let vx = 0;
      let vy = 0;
      let neighbours = 0;
      for (const o of boids) {
        if (o === b) continue;
        const dx = o.x - b.x;
        const dy = o.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 6400) continue;
        neighbours += 1;
        cx += o.x;
        cy += o.y;
        vx += o.vx;
        vy += o.vy;
        if (d2 < 360) {
          ax -= dx * 0.09;
          ay -= dy * 0.09;
        }
      }
      if (neighbours > 0) {
        ax += ((cx / neighbours - b.x) * 0.0032 + (vx / neighbours - b.vx) * 0.045) * cohesion;
        ay += ((cy / neighbours - b.y) * 0.0032 + (vy / neighbours - b.vy) * 0.045) * cohesion;
      }
      if (!reduced) {
        ax += Math.sin(t * 0.35 + b.x * 0.012) * 0.005 * wander;
        ay += Math.cos(t * 0.3 + b.y * 0.012) * 0.005 * wander;
      }
      if (pointer.current.active) {
        const dx = pointer.current.x - b.x;
        const dy = pointer.current.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < radius) {
          const falloff = 1 - d / radius;
          // radial pull + tangential swirl: the flock orbits you instead of
          // collapsing onto the cursor
          ax += (dx * 0.012 + -dy * 0.017) * falloff * eagerness;
          ay += (dy * 0.012 + dx * 0.017) * falloff * eagerness;
        }
      }
      if (burst.current.strength > 0.01) {
        const dx = b.x - burst.current.x;
        const dy = b.y - burst.current.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 240) {
          const push = burst.current.strength * (1 - d / 240);
          ax += (dx / d) * push * 2.6;
          ay += (dy / d) * push * 2.6;
        }
      }
      const margin = 34;
      if (b.x < margin) ax += (margin - b.x) * 0.008;
      if (b.x > w - margin) ax -= (b.x - (w - margin)) * 0.008;
      if (b.y < margin) ay += (margin - b.y) * 0.008;
      if (b.y > h - margin) ay -= (b.y - (h - margin)) * 0.008;
      b.vx += ax;
      b.vy += ay;
      const velocity = Math.hypot(b.vx, b.vy);
      if (velocity > speed) {
        b.vx = (b.vx / velocity) * speed;
        b.vy = (b.vy / velocity) * speed;
      }
      b.x += b.vx;
      b.y += b.vy;
      const glow = Math.hypot(b.vx, b.vy) / speed;
      ctx.fillStyle = `hsl(224 85% 66% / 0.14)`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7 + glow * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsl(224 90% ${62 + glow * 18}% / ${0.45 + glow * 0.45})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.2 + glow * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [count, speed, eagerness, wander, cohesion, reduced]);
  return (
    <div className="relative h-full min-h-[62vh] bg-[linear-gradient(180deg,#0b0e1d,#101530)]">
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
      <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-white/40">move to lead the flock · click to scatter</p>
    </div>
  );
}

/* --- tuner --- */

const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function MurmurationTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(MURMURATION_DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function MurmurationStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? MURMURATION_DEFAULTS;
  return <Murmuration {...settings} />;
}

export function MurmurationTunerPanel() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const { settings, setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <div>
      <TunerHeader title="Flock" blurb="A calm murmuration. The birds orbit your cursor instead of chasing it — tune how eager, loose, and fast they are." />
      <div className="mt-5 space-y-1.5 border-t border-hairline pt-5">
        <DialRow icon={IconFeather} label="Birds" value={settings.count} min={30} max={220} step={5} format={(v) => String(v)} onChange={(v) => set("count", v)} />
        <DialRow icon={IconGauge} label="Speed ceiling" value={settings.speed} min={0.5} max={3} step={0.05} format={(v) => `${v.toFixed(2)} px/f`} onChange={(v) => set("speed", v)} />
        <DialRow icon={IconMagnet} label="Eagerness" value={settings.eagerness} min={0} max={1.5} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => set("eagerness", v)} />
        <DialRow icon={IconTarget} label="Cohesion" value={settings.cohesion} min={0.2} max={2} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => set("cohesion", v)} />
        <DialRow icon={IconWind} label="Wander" value={settings.wander} min={0} max={1.5} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => set("wander", v)} />
      </div>
      <button onClick={() => setSettings(MURMURATION_DEFAULTS)} className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button>
    </div>
  );
}
