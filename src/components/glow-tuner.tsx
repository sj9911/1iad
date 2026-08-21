"use client";

// Live tuning panel for the Intelligence Glow day page. The provider owns the
// layer table; the stage reads it through context, so anywhere the provider
// isn't mounted (gallery cards, installed copies) the defaults apply.

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

function Num({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-16 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--oiad-blue)]"
      />
      <span className="w-10 text-right tabular-nums">{value}</span>
    </label>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold uppercase tracking-tight">
          Glow tuner
        </h2>
        <button
          onClick={copy}
          className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity duration-150 hover:opacity-85"
        >
          {copied ? "Copied" : "Copy values"}
        </button>
      </div>

      {layers.map((l, i) => (
        <div key={i} className="space-y-3 border-t border-hairline pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--oiad-blue)]">
              Layer {i}
            </span>
            <button
              onClick={() => setLayers((ls) => ls.filter((_, j) => j !== i))}
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              Remove
            </button>
          </div>
          <Num label="Ring" value={l.t} min={0} max={80} step={1} onChange={(v) => set(i, { t: v })} />
          <Num label="Blur" value={l.b} min={0} max={160} step={1} onChange={(v) => set(i, { b: v })} />
          <Num label="Opacity" value={l.o} min={0} max={1} step={0.05} onChange={(v) => set(i, { o: v })} />
          <div className="flex items-center gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={l.breathe}
                onChange={(e) => set(i, { breathe: e.target.checked })}
                className="accent-[var(--oiad-blue)]"
              />
              Breathe
            </label>
            <label className="flex items-center gap-2 text-muted">
              Delay
              <input
                type="text"
                value={l.delay}
                onChange={(e) => set(i, { delay: e.target.value })}
                className="w-16 rounded-lg border border-hairline bg-background px-2 py-1 text-foreground"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        onClick={() =>
          setLayers((ls) => [...ls, { ...(ls[ls.length - 1] ?? GLOW_LAYERS[0]) }])
        }
        className="w-full rounded-xl border border-hairline py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      >
        + Add layer
      </button>

      <pre className="overflow-x-auto rounded-xl border border-hairline bg-background p-4 font-mono text-xs leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
