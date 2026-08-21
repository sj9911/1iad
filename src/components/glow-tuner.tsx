"use client";

// Live tuning panel for the Apple Intelligence Glow day page, built on the
// shared tuner-controls. The provider owns the layer table; the stage reads
// it through context, so gallery cards and installed copies keep defaults.

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
} from "@tabler/icons-react";
import {
  DialRow,
  EASE,
  rise,
  SegmentedRow,
  TunerHeader,
} from "./tuner-controls";
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
      <TunerHeader
        title="Glow"
        blurb="Reshape the bloom in real time. Yours to play with."
      />

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
