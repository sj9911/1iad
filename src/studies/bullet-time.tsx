"use client";

// Bullet Time — press and hold to grind an orbital system to a crawl.
// Time is lerped (never snapped) so the slow-down feels like sinking into
// water, and the camera pushes in while the vignette closes.

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { IconCircleDot, IconGauge, IconZoomInArea, IconZoomOutArea } from "@tabler/icons-react";
import { DialRow, TunerHeader } from "@/components/tuner-controls";
import { useCanvas } from "./canvas";

type Settings = {
  slowFactor: number;
  zoom: number;
  orbiters: number;
  trails: number;
};

export const BULLET_TIME_DEFAULTS: Settings = { slowFactor: 0.05, zoom: 1.09, orbiters: 46, trails: 5 };

type Orbiter = { angle: number; radius: number; speed: number; size: number; tilt: number };

export function BulletTime({ slowFactor = BULLET_TIME_DEFAULTS.slowFactor, zoom = BULLET_TIME_DEFAULTS.zoom, orbiters = BULLET_TIME_DEFAULTS.orbiters, trails = BULLET_TIME_DEFAULTS.trails }: Settings) {
  const [frozen, setFrozen] = React.useState(false);
  const timeScale = React.useRef(1);
  const targetScale = React.useRef(1);
  const lastT = React.useRef(0);
  const reduced = useReducedMotion();
  React.useEffect(() => {
    targetScale.current = frozen ? slowFactor : 1;
  }, [frozen, slowFactor]);
  const canvasRef = useCanvas((ctx, w, h, t) => {
    const dtReal = Math.min(0.05, t - lastT.current);
    lastT.current = t;
    const floor = reduced ? 0.3 : 0.02;
    targetScale.current = Math.max(targetScale.current, 0);
    timeScale.current += (targetScale.current - timeScale.current) * 0.09;
    const scale = Math.max(floor, timeScale.current);
    const dt = dtReal * scale;
    ctx.fillStyle = "#060814";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i += 1) {
      const x = ((i * 97.31) % 100) / 100 * w;
      const y = ((i * 57.77) % 100) / 100 * h;
      ctx.fillStyle = `rgba(148,163,255,${0.06 + (i % 5) * 0.02})`;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    const cx = w / 2;
    const cy = h / 2;
    const host = ctx.canvas as HTMLCanvasElement & { __orbiters?: Orbiter[] };
    let system = host.__orbiters;
    if (!system || system.length !== orbiters) {
      const previous = system ?? [];
      system = Array.from({ length: orbiters }, (_, i) =>
        previous[i] ?? {
          angle: Math.random() * Math.PI * 2,
          radius: 24 + Math.random() * Math.min(w, h) * 0.34,
          speed: 0.5 + Math.random() * 1.6,
          size: 1.4 + Math.random() * 2.6,
          tilt: 0.42 + Math.random() * 0.2,
        },
      );
      host.__orbiters = system;
    }
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 64);
    core.addColorStop(0, `rgba(94,140,255,${0.28 + (1 - scale) * 0.4})`);
    core.addColorStop(1, "rgba(94,140,255,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();
    for (const orbiter of system) {
      orbiter.angle += orbiter.speed * dt;
      for (let segment = trails; segment >= 0; segment -= 1) {
        const angle = orbiter.angle - orbiter.speed * dt * segment * 1.4;
        const x = cx + Math.cos(angle) * orbiter.radius;
        const y = cy + Math.sin(angle) * orbiter.radius * orbiter.tilt;
        const alpha = 0.85 * (1 - segment / (trails + 1));
        ctx.fillStyle = `hsl(${218 + orbiter.radius * 0.25} 90% 70% / ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, orbiter.size * (1 - segment / (trails + 4)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [frozen, slowFactor, orbiters, trails, reduced]);
  return (
    <div
      className="relative h-full min-h-[62vh] touch-none select-none overflow-hidden"
      onPointerDown={() => setFrozen(true)}
      onPointerUp={() => setFrozen(false)}
      onPointerCancel={() => setFrozen(false)}
      onPointerLeave={() => setFrozen(false)}
    >
      <div
        className="absolute inset-0"
        style={{ transform: frozen ? `scale(${zoom})` : "scale(1)", transition: "transform 700ms cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 size-full cursor-pointer" />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: frozen ? 1 : 0,
          transition: "opacity 700ms cubic-bezier(0.23, 1, 0.32, 1)",
          background: "radial-gradient(circle at 50% 50%, transparent 38%, rgba(3,4,12,.55) 100%)",
        }}
      />
      <div className="pointer-events-none absolute left-5 top-5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-white/70">
        {frozen ? `${slowFactor.toFixed(2)}×` : "1.00×"}
      </div>
      <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[.2em] text-white/45">{frozen ? "bullet time — hold to keep it slow" : "press and hold to slow the system"}</p>
    </div>
  );
}

/* --- tuner --- */

const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function BulletTimeTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(BULLET_TIME_DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function BulletTimeStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? BULLET_TIME_DEFAULTS;
  return <BulletTime {...settings} />;
}

export function BulletTimeTunerPanel() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const { settings, setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <div>
      <TunerHeader title="Bullet time" blurb="Hold anywhere to sink into slow motion. Tune the crawl speed, the camera push, and the trails." />
      <div className="mt-5 space-y-1.5 border-t border-hairline pt-5">
        <DialRow icon={IconGauge} label="Slow factor" value={settings.slowFactor} min={0.01} max={0.3} step={0.01} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => set("slowFactor", v)} />
        <DialRow icon={IconZoomInArea} label="Camera push" value={settings.zoom} min={1} max={1.3} step={0.01} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => set("zoom", v)} />
        <DialRow icon={IconCircleDot} label="Orbiters" value={settings.orbiters} min={10} max={90} step={2} format={(v) => String(v)} onChange={(v) => set("orbiters", v)} />
        <DialRow icon={IconZoomOutArea} label="Trails" value={settings.trails} min={0} max={9} step={1} format={(v) => String(v)} onChange={(v) => set("trails", v)} />
      </div>
      <button onClick={() => setSettings(BULLET_TIME_DEFAULTS)} className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button>
    </div>
  );
}
