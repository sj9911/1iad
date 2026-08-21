"use client";

// Live tuning panel for the Intelligence Glow day page. The provider owns the
// layer table; the stage reads it through context, so anywhere the provider
// isn't mounted (gallery cards, installed copies) the defaults apply.
// Styled to match the day sidebar's spec sheet: poster header, hairline rows,
// iOS-style sliders and switches.

import * as React from "react";
import {
  IntelligenceGlow,
  GLOW_LAYERS,
  type GlowLayer,
} from "@/interactions/intelligence-glow";

type TunerCtx = {
  layers: GlowLayer[];
  setLayers: React.Dispatch<React.SetStateAction<GlowLayer[]>>;
};
const Ctx = React.createContext<TunerCtx | null>(null);

export function GlowTunerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [layers, setLayers] = React.useState<GlowLayer[]>(GLOW_LAYERS);
  return <Ctx.Provider value={{ layers, setLayers }}>{children}</Ctx.Provider>;
}

export function GlowStageTuned() {
  const layers = React.useContext(Ctx)?.layers ?? GLOW_LAYERS;
  return <IntelligenceGlow className="absolute inset-0" layers={layers} />;
}

// same maxed variable axes as the sidebar's poster title
const POSTER = {
  fontVariationSettings: '"wght" 800, "wdth" 100, "opsz" 96',
} as const;

function Slider({
  label,
  value,
  min,
  max,
  step,
  format = (v: number) => String(v),
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="grid grid-cols-[64px_1fr_44px] items-center gap-4">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tuner-range w-full"
        style={{
          background: `linear-gradient(to right, var(--oiad-blue) ${pct}%, var(--hairline) ${pct}%)`,
        }}
        aria-label={label}
      />
      <span className="text-right text-sm font-semibold tabular-nums">
        {format(value)}
      </span>
    </label>
  );
}

function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`h-[24px] w-[40px] shrink-0 rounded-full p-[3px] transition-colors duration-200 ${
        on ? "bg-[var(--oiad-blue)]" : "bg-black/15 dark:bg-white/25"
      }`}
    >
      <span
        className={`block size-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-transform duration-200 ${
          on ? "translate-x-[16px]" : ""
        }`}
      />
    </button>
  );
}

export function GlowTunerPanel() {
  const ctx = React.useContext(Ctx);
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  if (!ctx) return null;
  const { layers, setLayers } = ctx;

  const set = (i: number, patch: Partial<GlowLayer>) =>
    setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const code = `export const GLOW_LAYERS: GlowLayer[] = [\n${layers
    .map(
      (l) =>
        `  { t: ${l.t}, b: ${l.b}, o: ${l.o}, breathe: ${l.breathe}, delay: "${l.delay}" },`,
    )
    .join("\n")}\n];`;

  function copy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div>
      {/* poster header, same recipe as the sidebar */}
      <header className="pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--oiad-blue)]">
          Live tuner
        </p>
        <h2
          className="mt-3 text-[34px] uppercase leading-none tracking-[-0.01em]"
          style={POSTER}
        >
          Glow
        </h2>
        <p className="mb-8 mt-3 text-base leading-relaxed text-muted">
          Reshape the bloom in real time. Yours to play with.
        </p>
      </header>

      {layers.map((l, i) => (
        <section key={i} className="space-y-4 border-t border-hairline py-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-tight">
              <span aria-hidden="true" className="mr-2 text-[var(--oiad-blue)]">
                /
              </span>
              Layer {String(i + 1).padStart(2, "0")}
            </h3>
            <button
              onClick={() => setLayers((ls) => ls.filter((_, j) => j !== i))}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted transition-colors duration-150 hover:text-foreground"
            >
              Remove
            </button>
          </div>
          <Slider label="Ring" value={l.t} min={0} max={80} step={1} onChange={(v) => set(i, { t: v })} />
          <Slider label="Blur" value={l.b} min={0} max={160} step={1} onChange={(v) => set(i, { b: v })} />
          <Slider
            label="Opacity"
            value={l.o}
            min={0}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => set(i, { o: v })}
          />
          <div className="grid grid-cols-[64px_1fr] items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Breathe
            </span>
            <div className="flex items-center justify-between">
              <Switch on={l.breathe} onChange={(v) => set(i, { breathe: v })} label={`Layer ${i + 1} breathe`} />
            </div>
          </div>
          {l.breathe && (
            <Slider
              label="Delay"
              value={parseFloat(l.delay) || 0}
              min={0}
              max={2}
              step={0.1}
              format={(v) => `${v}s`}
              onChange={(v) => set(i, { delay: `${v}s` })}
            />
          )}
        </section>
      ))}

      <button
        onClick={() =>
          setLayers((ls) => [...ls, { ...(ls[ls.length - 1] ?? GLOW_LAYERS[0]) }])
        }
        className="flex w-full items-center gap-2 border-t border-hairline py-5 text-sm font-semibold uppercase tracking-tight transition-colors duration-150 hover:text-[var(--oiad-blue)]"
      >
        <span aria-hidden="true" className="text-[var(--oiad-blue)]">
          +
        </span>
        Add layer
      </button>

      {/* the values, sidebar "Steal it" style: code block + solid button */}
      <div className="border-t border-hairline py-6 pb-12">
        <code className="block break-all rounded-xl border border-hairline bg-background p-4 font-mono text-[12px] leading-relaxed whitespace-pre overflow-x-auto">
          {code}
        </code>
        <button
          onClick={copy}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background transition-opacity duration-150 hover:opacity-85"
        >
          {copied ? "Copied" : "Copy values"}
        </button>
      </div>
    </div>
  );
}
