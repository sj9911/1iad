"use client";

// Live tuning panel for the Intelligence Glow day page. DialKit-inspired
// controls (drag anywhere on a row) set in the sidebar's spec-sheet voice:
// kicker → poster title → hairline sections, icons per control, Departure
// Mono for every value. Emil rules throughout: transform/opacity only,
// strong ease-out, small travel, staggered rise-in.
// The provider owns the layer table; the stage reads it through context, so
// gallery cards and installed copies keep the shipped defaults.

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconBlur,
  IconCheck,
  IconCircleDashed,
  IconCircleHalf2,
  IconCopy,
  IconPlus,
  IconStopwatch,
  IconWaveSine,
  IconX,
  type Icon,
} from "@tabler/icons-react";
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

// emil rules: transform/opacity only, strong ease-out, small travel
const EASE = [0.23, 1, 0.32, 1] as const;
// zero-bounce spring for the segmented pill
const SNAP = { type: "spring", duration: 0.35, bounce: 0 } as const;

// same maxed variable axes as the sidebar's poster title
const POSTER = {
  fontVariationSettings: '"wght" 800, "wdth" 100, "opsz" 96',
} as const;

// staggered rise-in, matching DayShell's sidebar choreography.
// DayShell drives "show"/"hidden" from its aside; these inherit.
export const tunerList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* --- DialKit-style row: the whole row is the track — drag anywhere on it --- */
function DialRow({
  icon: RowIcon,
  label,
  value,
  min,
  max,
  step,
  format = (v: number) => String(v),
  onChange,
}: {
  icon: Icon;
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
      className="group relative h-11 cursor-ew-resize touch-none select-none overflow-hidden rounded-xl bg-black/[0.04] outline-none transition-colors duration-150 hover:bg-black/[0.06] focus-visible:ring-2 focus-visible:ring-[var(--oiad-blue)]/60 dark:bg-white/[0.07] dark:hover:bg-white/[0.09]"
    >
      {/* value fill */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-black/[0.07] dark:bg-white/[0.10]"
        style={{ width: `${pct}%` }}
      />
      <span className="relative flex h-full items-center justify-between px-3.5">
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <RowIcon
            size={16}
            stroke={1.75}
            aria-hidden="true"
            className="text-muted transition-colors duration-150 group-hover:text-foreground"
          />
          {label}
        </span>
        <span className="font-mono text-[13px] tabular-nums">
          {format(value)}
        </span>
      </span>
    </div>
  );
}

/* --- segmented Off/On row; the active pill glides between segments --- */
function SegmentedRow({
  icon: RowIcon,
  label,
  id,
  on,
  onChange,
}: {
  icon: Icon;
  label: string;
  id: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex h-11 items-center justify-between rounded-xl bg-black/[0.04] px-3.5 dark:bg-white/[0.07]">
      <span className="flex items-center gap-2.5 text-sm font-medium">
        <RowIcon size={16} stroke={1.75} aria-hidden="true" className="text-muted" />
        {label}
      </span>
      <div className="flex gap-0.5" role="group" aria-label={label}>
        {([false, true] as const).map((v) => (
          <button
            key={String(v)}
            aria-pressed={on === v}
            onClick={() => onChange(v)}
            className={`relative rounded-lg px-3 py-1 font-mono text-[12px] transition-colors duration-150 ${
              on === v ? "text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {on === v && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={SNAP}
                className="absolute inset-0 rounded-lg bg-foreground"
              />
            )}
            <span className="relative">{v ? "ON" : "OFF"}</span>
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
      {/* poster header, sidebar recipe: kicker → title → description */}
      <motion.header variants={rise} className="pb-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--oiad-blue)]">
          Live tuner
        </p>
        <h2
          className="mt-4 uppercase leading-none tracking-[-0.01em] text-[30px]"
          style={POSTER}
        >
          Glow
        </h2>
        <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-muted">
          Reshape the bloom in real time. Yours to play with.
        </p>
      </motion.header>

      {layers.map((l, i) => (
        <motion.section
          key={i}
          variants={rise}
          className="mt-6 border-t border-hairline pt-5"
        >
          <div className="flex items-baseline justify-between px-1 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span aria-hidden="true" className="mr-2 font-semibold text-[var(--oiad-blue)]">
                /
              </span>
              Layer {String(i + 1).padStart(2, "0")}
            </h3>
            <button
              onClick={() => setLayers((ls) => ls.filter((_, j) => j !== i))}
              aria-label={`Remove layer ${i + 1}`}
              className="flex size-6 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-black/[0.06] hover:text-foreground dark:hover:bg-white/[0.09]"
            >
              <IconX size={14} stroke={2} aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-1.5">
            <DialRow icon={IconCircleDashed} label="Ring" value={l.t} min={0} max={80} step={1} onChange={(v) => set(i, { t: v })} />
            <DialRow icon={IconBlur} label="Blur" value={l.b} min={0} max={160} step={1} onChange={(v) => set(i, { b: v })} />
            <DialRow
              icon={IconCircleHalf2}
              label="Opacity"
              value={l.o}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set(i, { o: v })}
            />
            <SegmentedRow icon={IconWaveSine} label="Breathe" id={`breathe-${i}`} on={l.breathe} onChange={(v) => set(i, { breathe: v })} />
            <AnimatePresence initial={false}>
              {l.breathe && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <DialRow
                    icon={IconStopwatch}
                    label="Delay"
                    value={parseFloat(l.delay) || 0}
                    min={0}
                    max={2}
                    step={0.1}
                    format={(v) => `${v.toFixed(1)}s`}
                    onChange={(v) => set(i, { delay: `${v}s` })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      ))}

      <motion.div variants={rise} className="mt-6 border-t border-hairline pt-5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            setLayers((ls) => [
              ...ls,
              { ...(ls[ls.length - 1] ?? GLOW_LAYERS[0]) },
            ])
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black/[0.04] text-sm font-medium transition-colors duration-150 hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"
        >
          <IconPlus size={16} stroke={2} aria-hidden="true" className="text-[var(--oiad-blue)]" />
          Add layer
        </motion.button>
      </motion.div>

      {/* the values, sidebar "Steal it" recipe: code block + solid button */}
      <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5">
        <code className="block overflow-x-auto whitespace-pre rounded-xl border border-hairline bg-background p-4 font-mono text-[12px] leading-relaxed">
          {code}
        </code>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={copy}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-base font-semibold text-background transition-opacity duration-150 hover:opacity-85"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? "tick" : "copy"}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="flex"
            >
              {copied ? (
                <IconCheck size={18} stroke={2.5} aria-hidden="true" />
              ) : (
                <IconCopy size={18} stroke={2} aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
          {copied ? "Copied" : "Copy values"}
        </motion.button>
      </motion.div>
    </div>
  );
}
