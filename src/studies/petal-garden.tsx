"use client";

// Petal Garden — wander slowly and flowers sprout; click to plant
// instantly. Blooms are layered (two petal rings), petals detach and
// drift on the wind, and the cursor pushes them like a breeze.

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { IconFlower, IconHandClick, IconPlant, IconWind } from "@tabler/icons-react";
import { DialRow, TunerHeader } from "@/components/tuner-controls";
import { useCanvas } from "./canvas";

export type GardenPalette = "blossom" | "lavender" | "meadow";

type Settings = {
  wind: number;
  bloomSpeed: number;
  plantRate: number;
  palette: GardenPalette;
  petals: boolean;
};

export const PETAL_GARDEN_DEFAULTS: Settings = {
  wind: 1,
  bloomSpeed: 1,
  plantRate: 1,
  palette: "blossom",
  petals: true,
};

const GARDEN_PALETTES: Record<GardenPalette, { label: string; hues: [number, number] }> = {
  blossom: { label: "Blossom", hues: [330, 370] },
  lavender: { label: "Lavender", hues: [255, 300] },
  meadow: { label: "Meadow", hues: [45, 80] },
};

type Plant = { x: number; y: number; height: number; maxH: number; bloom: number; hue: number };
type Petal = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; hue: number; life: number };
type Garden = { plants: Plant[]; petals: Petal[]; cooldown: number };

export function PetalGarden({ wind = PETAL_GARDEN_DEFAULTS.wind, bloomSpeed = PETAL_GARDEN_DEFAULTS.bloomSpeed, plantRate = PETAL_GARDEN_DEFAULTS.plantRate, palette = PETAL_GARDEN_DEFAULTS.palette, petals: petalShed = PETAL_GARDEN_DEFAULTS.petals }: Settings) {
  const pointer = React.useRef({ x: 0, y: 0, active: false });
  const reduced = useReducedMotion();
  const getGarden = (ctx: CanvasRenderingContext2D): Garden => {
    const host = ctx.canvas as HTMLCanvasElement & { __garden?: Garden };
    host.__garden ??= { plants: [], petals: [], cooldown: 0 };
    return host.__garden;
  };
  const plantAt = (ctx: CanvasRenderingContext2D, x: number, y: number, instant: boolean) => {
    const garden = getGarden(ctx);
    if (garden.plants.length >= 90) return;
    const [hueLow, hueHigh] = GARDEN_PALETTES[palette].hues;
    garden.plants.push({
      x,
      y: Math.min(y + 4, 9999),
      height: instant ? 10 : 2,
      maxH: 26 + Math.random() * 40,
      bloom: instant ? 0.5 : 0,
      hue: hueLow + Math.random() * (hueHigh - hueLow),
    });
    garden.cooldown = Math.max(1, Math.round(14 / plantRate));
  };
  const canvasRef = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fbfaf6";
    ctx.fillRect(0, 0, w, h);
    const garden = getGarden(ctx);
    const p = pointer.current;
    if (p.active) {
      garden.cooldown -= 1;
      const near = garden.plants.some((plant) => Math.hypot(plant.x - p.x, plant.y - p.y) < 26);
      if (garden.cooldown <= 0 && !near && p.y < h) plantAt(ctx, p.x, p.y, false);
    }
    const breeze = reduced ? 0 : Math.sin(t * 1.1) * 2.6 * wind + Math.sin(t * 0.37) * 1.8 * wind;
    for (const plant of garden.plants) {
      if (plant.height < plant.maxH) plant.height += 0.5 * bloomSpeed;
      else if (plant.bloom < 1) plant.bloom = Math.min(1, plant.bloom + 0.02 * bloomSpeed);
      const sway = breeze * (plant.height / 60);
      const tipX = plant.x + sway;
      const tipY = plant.y - plant.height;
      ctx.strokeStyle = "hsl(120 30% 46%)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(plant.x, plant.y);
      ctx.quadraticCurveTo(plant.x + sway * 0.4, plant.y - plant.height * 0.6, tipX, tipY);
      ctx.stroke();
      if (plant.bloom > 0) {
        const size = plant.bloom * (5 + (plant.maxH / 64) * 3);
        for (let i = 0; i < 6; i += 1) {
          const angle = (i / 6) * Math.PI * 2 + t * 0.08;
          ctx.fillStyle = `hsl(${plant.hue} 82% 76% / 0.9)`;
          ctx.beginPath();
          ctx.ellipse(tipX + Math.cos(angle) * size * 0.78, tipY + Math.sin(angle) * size * 0.78, size * 0.6, size * 0.34, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 0; i < 5; i += 1) {
          const angle = (i / 5) * Math.PI * 2 + t * 0.08 + 0.5;
          ctx.fillStyle = `hsl(${plant.hue + 12} 88% 68% / 0.95)`;
          ctx.beginPath();
          ctx.ellipse(tipX + Math.cos(angle) * size * 0.4, tipY + Math.sin(angle) * size * 0.4, size * 0.42, size * 0.26, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "hsl(45 92% 60%)";
        ctx.beginPath();
        ctx.arc(tipX, tipY, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (plant.bloom >= 1 && petalShed && !reduced && Math.random() < 0.007 * wind && garden.petals.length < 110) {
        garden.petals.push({
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
    for (let i = garden.petals.length - 1; i >= 0; i -= 1) {
      const petal = garden.petals[i];
      if (p.active) {
        const dx = petal.x - p.x;
        const dy = petal.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 80) {
          const push = (1 - d / 80) * 0.5;
          petal.vx += (dx / d) * push;
          petal.vy += (dy / d) * push * 0.4;
        }
      }
      petal.vx *= 0.96;
      petal.vy = petal.vy * 0.96 + 0.012;
      petal.x += petal.vx + Math.sin(t * 2 + petal.y * 0.05) * 0.5 * wind;
      petal.y += petal.vy;
      petal.rot += petal.vr;
      petal.life -= 0.002;
      if (petal.y > h + 10 || petal.life <= 0 || petal.x < -10 || petal.x > w + 10) {
        garden.petals.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rot);
      ctx.fillStyle = `hsl(${petal.hue} 82% 78% / ${petal.life})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [wind, bloomSpeed, plantRate, palette, petalShed, reduced]);
  return (
    <div className="relative h-full min-h-[62vh]">
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
          const canvas = event.currentTarget;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
          plantAt(ctx, event.clientX - rect.left, event.clientY - rect.top, true);
        }}
      />
      <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-slate-500/70">wander to plant · click to bloom · petals ride the breeze</p>
    </div>
  );
}

/* --- tuner --- */

const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function PetalGardenTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(PETAL_GARDEN_DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function PetalGardenStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? PETAL_GARDEN_DEFAULTS;
  return <PetalGarden {...settings} />;
}

export function PetalGardenTunerPanel() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const { settings, setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <div>
      <TunerHeader title="Garden" blurb="Wander slowly and flowers sprout in your wake. Tune the breeze, how fast things bloom, and how eagerly they plant." />
      <div className="mt-5 space-y-1.5 border-t border-hairline pt-5">
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Palette">
          {(Object.keys(GARDEN_PALETTES) as GardenPalette[]).map((key) => (
            <button
              key={key}
              aria-pressed={settings.palette === key}
              onClick={() => set("palette", key)}
              className={`relative flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${settings.palette === key ? "bg-foreground text-background" : "bg-black/[0.04] text-muted hover:text-foreground dark:bg-white/[0.07]"}`}
            >
              <span
                aria-hidden="true"
                className="size-3.5 rounded-full"
                style={{ background: `hsl(${GARDEN_PALETTES[key].hues[0] + 14} 85% 72%)` }}
              />
              {GARDEN_PALETTES[key].label}
            </button>
          ))}
        </div>
        <DialRow icon={IconWind} label="Breeze" value={settings.wind} min={0} max={2.5} step={0.1} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set("wind", v)} />
        <DialRow icon={IconFlower} label="Bloom speed" value={settings.bloomSpeed} min={0.2} max={3} step={0.1} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set("bloomSpeed", v)} />
        <DialRow icon={IconPlant} label="Plant rate" value={settings.plantRate} min={0.2} max={3} step={0.1} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set("plantRate", v)} />
        <button onClick={() => set("petals", !settings.petals)} className="flex h-11 w-full items-center justify-between rounded-xl bg-black/[0.04] px-3.5 text-sm font-medium transition-colors hover:bg-black/[0.06] dark:bg-white/[0.07] dark:hover:bg-white/[0.09]">
          <span className="flex items-center gap-2.5"><IconHandClick size={16} stroke={1.75} className="text-muted" />Shed petals</span>
          <span className="font-mono text-[12px] text-muted">{settings.petals ? "ON" : "OFF"}</span>
        </button>
      </div>
      <button onClick={() => setSettings(PETAL_GARDEN_DEFAULTS)} className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button>
    </div>
  );
}
