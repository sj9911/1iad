"use client";

// Ink Pond — luminous ink that blooms and diffuses. Hue is picked from a
// smooth spatial-temporal field (never random), so the pond reads as one
// living gradient instead of confetti. Four palettes, tunable trail life.

import * as React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import { IconDroplet, IconPalette, IconRadioactive, IconRipple, IconWaveSine } from "@tabler/icons-react";
import { DialRow, TunerHeader } from "@/components/tuner-controls";
import { useCanvas } from "./canvas";

export type Palette = "aurora" | "ocean" | "sunset" | "iridescent";

type Settings = {
  palette: Palette;
  spread: number;
  trail: number;
  intensity: number;
  dropSize: number;
  ambient: boolean;
};

export const INK_POND_DEFAULTS: Settings = {
  palette: "aurora",
  spread: 1,
  trail: 0.6,
  intensity: 0.6,
  dropSize: 1,
  ambient: true,
};

const PALETTES: Record<Palette, { base: number; range: number; sat: number; light: number; label: string }> = {
  aurora: { base: 150, range: 135, sat: 90, light: 60, label: "Aurora" },
  ocean: { base: 182, range: 58, sat: 92, light: 58, label: "Ocean" },
  sunset: { base: 330, range: 74, sat: 88, light: 62, label: "Sunset" },
  iridescent: { base: 0, range: 360, sat: 85, light: 64, label: "Iridescent" },
};

export function InkPond({
  palette = INK_POND_DEFAULTS.palette,
  spread = INK_POND_DEFAULTS.spread,
  trail = INK_POND_DEFAULTS.trail,
  intensity = INK_POND_DEFAULTS.intensity,
  dropSize = INK_POND_DEFAULTS.dropSize,
  ambient = INK_POND_DEFAULTS.ambient,
}: Settings) {
  const pointer = React.useRef({ x: 0, y: 0, px: 0, py: 0, active: false });
  const lastDrip = React.useRef(0);
  const reduced = useReducedMotion();
  const canvasRef = useCanvas((ctx, w, h, t) => {
    const fade = Math.max(0.022, 0.15 - trail * 0.12);
    ctx.fillStyle = `rgba(5, 6, 14, ${fade})`;
    ctx.fillRect(0, 0, w, h);
    const tone = PALETTES[palette];
    const drop = (x: number, y: number, speed: number) => {
      // one smooth hue field across space and time — the whole pond shares
      // one gradient instead of picking random colours per drop
      const field =
        (Math.sin(x * 0.0016 + t * 0.21) + Math.sin(y * 0.0013 - t * 0.16) + Math.sin((x + y) * 0.0009 + t * 0.09)) / 6;
      const hue = tone.base + ((field * 0.5 + 0.5) ** 1.4) * tone.range * spread;
      const radius = (5 + Math.min(16, speed * 0.05)) * dropSize;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3.4);
      gradient.addColorStop(0, `hsl(${hue} ${tone.sat}% ${tone.light + 14}% / ${intensity})`);
      gradient.addColorStop(0.35, `hsl(${hue} ${tone.sat}% ${tone.light}% / ${intensity * 0.5})`);
      gradient.addColorStop(1, `hsl(${hue} ${tone.sat}% ${tone.light - 8}% / 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3.4, 0, Math.PI * 2);
      ctx.fill();
    };
    const p = pointer.current;
    if (p.active) {
      drop(p.x, p.y, Math.hypot(p.x - p.px, p.y - p.py));
      p.px = p.x;
      p.py = p.y;
    } else if (ambient && !reduced && t - lastDrip.current > 1.3) {
      lastDrip.current = t;
      drop(Math.random() * w, Math.random() * h, 0);
    }
  }, [palette, spread, trail, intensity, dropSize, ambient, reduced]);
  return (
    <div className="relative h-full min-h-[62vh] bg-[#05060e]">
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
      <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-white/40">move slowly — the ink blooms where you linger</p>
    </div>
  );
}

/* --- tuner --- */

const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function InkPondTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(INK_POND_DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function InkPondStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? INK_POND_DEFAULTS;
  return <InkPond {...settings} />;
}

export function InkPondTunerPanel() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const { settings, setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <div>
      <TunerHeader title="Ink" blurb="One living gradient under the cursor. Pick the palette, then tune how long the ink lingers and how hot it blooms." />
      <motion.section className="mt-5 border-t border-hairline pt-5">
        <p className="mb-2 flex items-center gap-2 px-1 text-sm font-medium"><IconPalette size={16} stroke={1.75} className="text-muted" />Palette</p>
        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Palette">
          {(Object.keys(PALETTES) as Palette[]).map((key) => (
            <button
              key={key}
              aria-pressed={settings.palette === key}
              onClick={() => set("palette", key)}
              className={`relative flex h-11 items-center gap-2.5 overflow-hidden rounded-xl px-3.5 text-sm font-medium transition-colors ${settings.palette === key ? "text-background" : "text-muted hover:text-foreground"}`}
            >
              {settings.palette === key && (
                <motion.span
                  layoutId="ink-palette"
                  transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                  className="absolute inset-0 rounded-xl bg-foreground"
                />
              )}
              <span
                aria-hidden="true"
                className="relative size-4 rounded-full"
                style={{ background: `linear-gradient(135deg, hsl(${PALETTES[key].base} 90% 62%), hsl(${PALETTES[key].base + PALETTES[key].range * 0.6} 90% 62%))` }}
              />
              <span className="relative">{PALETTES[key].label}</span>
            </button>
          ))}
        </div>
      </motion.section>
      <div className="mt-5 space-y-1.5 border-t border-hairline pt-5">
        <DialRow icon={IconWaveSine} label="Hue spread" value={settings.spread} min={0.1} max={2} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => set("spread", v)} />
        <DialRow icon={IconRipple} label="Trail life" value={settings.trail} min={0.1} max={0.9} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set("trail", v)} />
        <DialRow icon={IconRadioactive} label="Intensity" value={settings.intensity} min={0.15} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set("intensity", v)} />
        <DialRow icon={IconDroplet} label="Drop size" value={settings.dropSize} min={0.4} max={2.4} step={0.1} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set("dropSize", v)} />
        <button onClick={() => set("ambient", !settings.ambient)} className="flex h-11 w-full items-center justify-between rounded-xl bg-black/[0.04] px-3.5 text-sm font-medium transition-colors hover:bg-black/[0.06] dark:bg-white/[0.07] dark:hover:bg-white/[0.09]">
          <span className="flex items-center gap-2.5"><IconRipple size={16} stroke={1.75} className="text-muted" />Ambient drips</span>
          <span className="font-mono text-[12px] text-muted">{settings.ambient ? "ON" : "OFF"}</span>
        </button>
      </div>
      <button onClick={() => setSettings(INK_POND_DEFAULTS)} className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button>
    </div>
  );
}
