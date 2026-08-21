"use client";

// Live tuning panel for the Intelligence Glow day page. DialKit-inspired
// controls (drag anywhere on a row; label inside the track, value right),
// but built on the site's own theme tokens so light/dark always match.
// The provider owns the layer table; the stage reads it through context, so
// gallery cards and installed copies keep the shipped defaults.

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

/* --- DialKit-style row: the whole row is the track — drag anywhere on it --- */
function DialRow({
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
  const ref = React.useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  function setFromClientX(clientX: number) {
    const r = ref.current!.getBoundingClientRect();
    const raw = min + ((clientX - r.left) / r.width) * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, Number(stepped.toFixed(4)))));
  }

  function nudge(dir: 1 | -1) {
    onChange(
      Math.min(max, Math.max(min, Number((value + dir * step).toFixed(4)))),
    );
  }

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons) setFromClientX(e.clientX);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") nudge(1);
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") nudge(-1);
      }}
      className="relative h-10 cursor-ew-resize touch-none select-none overflow-hidden rounded-lg bg-black/[0.04] outline-none focus-visible:ring-2 focus-visible:ring-[var(--oiad-blue)]/50 dark:bg-white/[0.07]"
    >
      {/* value fill */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-black/[0.08] dark:bg-white/[0.11]"
        style={{ width: `${pct}%` }}
      />
      <span className="relative flex h-full items-center justify-between px-3.5 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums">{format(value)}</span>
      </span>
    </div>
  );
}

/* --- DialKit-style segmented Off/On row --- */
function SegmentedRow({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex h-10 items-center justify-between rounded-lg bg-black/[0.04] px-3.5 text-sm dark:bg-white/[0.07]">
      <span className="text-muted">{label}</span>
      <div className="flex gap-1" role="group" aria-label={label}>
        {([false, true] as const).map((v) => (
          <button
            key={String(v)}
            aria-pressed={on === v}
            onClick={() => onChange(v)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150 ${
              on === v
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {v ? "On" : "Off"}
          </button>
        ))}
      </div>
    </div>
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
      <header className="pb-6 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--oiad-blue)]">
          Live tuner
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Reshape the bloom in real time. Yours to play with.
        </p>
      </header>

      <div className="space-y-6">
        {layers.map((l, i) => (
          <section key={i} className="space-y-1.5">
            <div className="flex items-baseline justify-between px-1 pb-1">
              <h3 className="text-sm font-semibold tracking-tight">
                Layer {String(i + 1).padStart(2, "0")}
              </h3>
              <button
                onClick={() => setLayers((ls) => ls.filter((_, j) => j !== i))}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-muted transition-colors duration-150 hover:text-foreground"
              >
                Remove
              </button>
            </div>
            <DialRow label="Ring" value={l.t} min={0} max={80} step={1} onChange={(v) => set(i, { t: v })} />
            <DialRow label="Blur" value={l.b} min={0} max={160} step={1} onChange={(v) => set(i, { b: v })} />
            <DialRow
              label="Opacity"
              value={l.o}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set(i, { o: v })}
            />
            <SegmentedRow label="Breathe" on={l.breathe} onChange={(v) => set(i, { breathe: v })} />
            {l.breathe && (
              <DialRow
                label="Delay"
                value={parseFloat(l.delay) || 0}
                min={0}
                max={2}
                step={0.1}
                format={(v) => `${v.toFixed(1)}s`}
                onChange={(v) => set(i, { delay: `${v}s` })}
              />
            )}
          </section>
        ))}

        <button
          onClick={() =>
            setLayers((ls) => [
              ...ls,
              { ...(ls[ls.length - 1] ?? GLOW_LAYERS[0]) },
            ])
          }
          className="flex h-10 w-full items-center justify-center rounded-lg bg-black/[0.04] text-sm font-semibold transition-colors duration-150 hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"
        >
          + Add layer
        </button>

        <div className="pb-12">
          <code className="block overflow-x-auto whitespace-pre break-normal rounded-xl border border-hairline bg-background p-4 font-mono text-[12px] leading-relaxed">
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
    </div>
  );
}
