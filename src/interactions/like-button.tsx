"use client";

/**
 * OIAD Day 2 — Like Button
 * A heart that pops with a spring, a ring flash, a burst of particles,
 * and a satisfying "pop" sound (plus a haptic buzz on Android).
 *
 * Standalone it keeps a local count. Pass `api` to back it with a real
 * shared count — the endpoint contract is GET → { count } and
 * POST { delta: 1 | -1 } → { count }; "you liked this" is remembered
 * per-browser in localStorage.
 *
 * Self-contained: needs only `motion` and Tailwind.
 * https://x.com/sunnyxdesign — built in public, one interaction a day.
 */

import * as React from "react";
import { motion } from "motion/react";

/* --- feedback: tiny Web Audio pop + Android haptic --- */
let audioCtx: AudioContext | null = null;
function pop(like: boolean) {
  try {
    audioCtx ??= new AudioContext();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    // like: juicy downward pop; unlike: quieter, lower blip
    osc.frequency.setValueAtTime(like ? 520 : 260, t);
    osc.frequency.exponentialRampToValueAtTime(like ? 130 : 90, t + 0.09);
    gain.gain.setValueAtTime(like ? 0.2 : 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  } catch {
    /* audio blocked — stay silent */
  }
}
function buzz() {
  if (typeof navigator !== "undefined") navigator.vibrate?.(12);
}

const PARTICLES = [
  { angle: 20, dist: 34, size: 5, color: "#ff2d55" },
  { angle: 65, dist: 40, size: 4, color: "#ff9500" },
  { angle: 110, dist: 33, size: 6, color: "#ff2d55" },
  { angle: 155, dist: 42, size: 4, color: "#af52de" },
  { angle: 200, dist: 36, size: 5, color: "#ff9500" },
  { angle: 245, dist: 41, size: 4, color: "#ff2d55" },
  { angle: 290, dist: 34, size: 6, color: "#af52de" },
  { angle: 335, dist: 39, size: 4, color: "#ff9500" },
];

export function LikeButton({
  api,
  storageKey = "oiad-liked",
}: {
  api?: string;
  storageKey?: string;
}) {
  const [liked, setLiked] = React.useState(false);
  const [count, setCount] = React.useState<number | null>(api ? null : 2347);

  React.useEffect(() => {
    if (!api) return;
    const stored = localStorage.getItem(storageKey) === "1";
    fetch(api)
      .then((r) => r.json())
      .then((d) => setCount(typeof d.count === "number" ? d.count : 2347))
      .catch(() => setCount(2347))
      .finally(() => setLiked(stored));
  }, [api, storageKey]);
  const [burst, setBurst] = React.useState(0);

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((c) => (c ?? 0) + (next ? 1 : -1));
    pop(next);
    buzz();
    if (next) setBurst((b) => b + 1);
    if (api) {
      localStorage.setItem(storageKey, next ? "1" : "0");
      fetch(api, {
        method: "POST",
        body: JSON.stringify({ delta: next ? 1 : -1 }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (typeof d.count === "number") setCount(d.count);
        })
        .catch(() => {}); // optimistic count stands if the network flakes
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className="group flex select-none items-center gap-3 rounded-full px-5 py-3 outline-none transition-colors duration-150 hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#ff2d55]/40 dark:hover:bg-white/[0.06]"
    >
      <span className="relative flex items-center justify-center">
        {/* ring flash */}
        {burst > 0 && (
          <motion.span
            key={`ring-${burst}`}
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute size-8 rounded-full border-2 border-[#ff2d55]"
            aria-hidden="true"
          />
        )}
        {/* particle burst */}
        {burst > 0 &&
          PARTICLES.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.span
                key={`${burst}-${i}`}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(rad) * p.dist,
                  y: Math.sin(rad) * p.dist,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
                aria-hidden="true"
              />
            );
          })}
        {/* the heart */}
        <motion.svg
          key={liked ? `on-${burst}` : "off"}
          initial={liked ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          viewBox="0 0 24 24"
          className={`relative size-8 transition-colors duration-150 ${
            liked ? "fill-[#ff2d55]" : "fill-none stroke-neutral-400 stroke-[1.8]"
          } group-active:scale-90`}
          aria-hidden="true"
        >
          <path d="M12 21.35c-.4 0-.8-.14-1.11-.42C7.14 17.62 2 13.2 2 8.9 2 5.9 4.42 3.5 7.4 3.5c1.74 0 3.41.84 4.6 2.26A5.93 5.93 0 0 1 16.6 3.5c2.98 0 5.4 2.4 5.4 5.4 0 4.3-5.14 8.72-8.89 12.03-.31.28-.71.42-1.11.42Z" />
        </motion.svg>
      </span>
      <span className="w-14 text-left text-lg font-medium tabular-nums text-neutral-500">
        {count === null ? "…" : count.toLocaleString()}
      </span>
    </button>
  );
}
