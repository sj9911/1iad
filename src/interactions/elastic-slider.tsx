"use client";

/**
 * OIAD Day 1 — Elastic Slider
 * An iOS-style slider that stretches past its ends and springs back,
 * with a soft tick sound (and a haptic buzz on Android) every 10 steps.
 *
 * Self-contained: needs only `motion` and Tailwind.
 * https://github.com/thesunnyjoshi — built in public, one interaction a day.
 */

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/* --- feedback: tiny Web Audio tick + Android haptic --- */
let audioCtx: AudioContext | null = null;
function tick(freq = 880) {
  try {
    audioCtx ??= new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch {
    /* audio blocked — stay silent */
  }
}
function buzz() {
  if (typeof navigator !== "undefined") navigator.vibrate?.(8);
}

/* --- the slider --- */
export function ElasticSlider() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [value, setValue] = React.useState(60);
  const [dragging, setDragging] = React.useState(false);
  const lastStep = React.useRef(6);

  // signed px past the track's ends, dampened, sprung back on release
  const overflow = useMotionValue(0);
  const smooth = useSpring(overflow, { stiffness: 400, damping: 24 });

  const scaleX = useTransform(smooth, (o) => 1 + Math.abs(o) / 420);
  const scaleY = useTransform(smooth, (o) => 1 - Math.abs(o) / 260);
  const originX = useTransform(smooth, (o) => (o < 0 ? 1 : 0));
  const leftNudge = useTransform(smooth, (o) => (o < 0 ? o * 0.4 : 0));
  const rightNudge = useTransform(smooth, (o) => (o > 0 ? o * 0.4 : 0));

  function stepFeedback(next: number) {
    const step = Math.floor(next / 10);
    if (step !== lastStep.current) {
      lastStep.current = step;
      tick(700 + step * 40); // pitch rises with volume
      buzz();
    }
  }

  function readPointer(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const next = Math.round(Math.min(1, Math.max(0, x / rect.width)) * 100);
    setValue(next);
    stepFeedback(next);
    const raw = x < 0 ? x : x > rect.width ? x - rect.width : 0;
    overflow.set(Math.tanh(raw / 120) * 48); // ponytail: tanh dampening, tune 120/48 to taste
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 5
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -5
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = Math.min(100, Math.max(0, value + delta));
    setValue(next);
    stepFeedback(next);
  }

  return (
    <div className="flex w-full max-w-xs select-none flex-col items-center gap-5 touch-none">
      <div className="flex w-full items-center gap-4">
        <motion.svg
          style={{ x: leftNudge }}
          viewBox="0 0 24 24"
          className="size-5 shrink-0 fill-neutral-400"
          aria-hidden="true"
        >
          <path d="M13 5.5v13a.75.75 0 0 1-1.24.57L7.6 15.5H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2.6l4.16-3.57A.75.75 0 0 1 13 5.5Z" />
        </motion.svg>

        <motion.div
          role="slider"
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          tabIndex={0}
          onKeyDown={onKeyDown}
          style={{ scaleX, scaleY, originX }}
          className="relative grow cursor-grab py-3 outline-none active:cursor-grabbing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            readPointer(e.clientX);
          }}
          onPointerMove={(e) => dragging && readPointer(e.clientX)}
          onPointerUp={() => {
            setDragging(false);
            overflow.set(0);
          }}
          onPointerCancel={() => {
            setDragging(false);
            overflow.set(0);
          }}
        >
          <motion.div
            ref={trackRef}
            animate={{ height: dragging ? 14 : 8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="relative w-full overflow-hidden rounded-full bg-black/10"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-neutral-900"
              style={{ width: `${value}%` }}
            />
          </motion.div>
        </motion.div>

        <motion.svg
          style={{ x: rightNudge }}
          viewBox="0 0 24 24"
          className="size-5 shrink-0 fill-neutral-400"
          aria-hidden="true"
        >
          <path d="M11 5.5v13a.75.75 0 0 1-1.24.57L5.6 15.5H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2.6l4.16-3.57A.75.75 0 0 1 11 5.5Z" />
          <path d="M15.54 8.46a.75.75 0 0 1 1.06 0 5 5 0 0 1 0 7.08.75.75 0 1 1-1.06-1.07 3.5 3.5 0 0 0 0-4.94.75.75 0 0 1 0-1.07Z" />
          <path d="M18.07 5.93a.75.75 0 0 1 1.06 0 8.5 8.5 0 0 1 0 12.02.75.75 0 1 1-1.06-1.06 7 7 0 0 0 0-9.9.75.75 0 0 1 0-1.06Z" />
        </motion.svg>
      </div>

      <p className="text-sm tabular-nums text-neutral-400">{value}</p>
    </div>
  );
}
