"use client";

// Shared controls for day-page tuner panels. DialKit-inspired rows (drag
// anywhere on the row; label + icon inside the track, mono value right) on
// the site's own theme tokens. Emil rules: transform/opacity only, strong
// ease-out, small travel.

import * as React from "react";
import { motion } from "motion/react";
import type { Icon } from "@tabler/icons-react";

export const EASE = [0.23, 1, 0.32, 1] as const;
// zero-bounce spring for the segmented pill
const SNAP = { type: "spring", duration: 0.35, bounce: 0 } as const;

// same maxed variable axes as the sidebar's poster title
export const POSTER = {
  fontVariationSettings: '"wght" 800, "wdth" 100, "opsz" 96',
} as const;

// staggered rise-in, matching DayShell's sidebar choreography.
// DayShell drives "show"/"hidden" from its aside; these inherit.
export const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* --- DialKit-style row: the whole row is the track — drag anywhere on it --- */
export function DialRow({
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

/* --- DialKit-style segmented Off/On row; the active pill glides between --- */
export function SegmentedRow({
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

/* --- panel header: kicker → poster title → description --- */
export function TunerHeader({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <motion.header variants={rise} className="pb-2 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--oiad-blue)]">
        Live tuner
      </p>
      <h2
        className="mt-4 text-[30px] uppercase leading-none tracking-[-0.01em]"
        style={POSTER}
      >
        {title}
      </h2>
      <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-muted">
        {blurb}
      </p>
    </motion.header>
  );
}
