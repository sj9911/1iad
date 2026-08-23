"use client";

/**
 * 1IAD Day 5 — Proximity Grid
 * A block of tiny dots that feels the cursor: inside the influence radius
 * they bloom into rounded squares, brighten, and get magnetically pulled
 * toward (or pushed away from) the pointer, with a smooth eased falloff.
 *
 * Self-contained: React + Tailwind only, no animation library.
 * https://x.com/sunnyxdesign — built in public, one interaction a day.
 */

import * as React from "react";

export function ProximityGrid({
  className = "relative h-[340px] w-full max-w-[520px] rounded-3xl border border-black/10 dark:border-white/15",
  cols = 13, // grid size, centered in the container
  rows = 9,
  influence = 170, // px radius the cursor reaches
  magnet = 12, // px of pull at full proximity; negative pushes away
  scale = 5, // near size, as a multiple of the resting dot
  radius = 30, // near border-radius in % (50 = stays a circle)
  dimmed = 0.5, // resting opacity far from the cursor
  spacing = 36, // px per grid cell
  dot = 5, // resting dot size in px
}: {
  className?: string;
  cols?: number;
  rows?: number;
  influence?: number;
  magnet?: number;
  scale?: number;
  radius?: number;
  dimmed?: number;
  spacing?: number;
  dot?: number;
}) {
  const viewRef = React.useRef<HTMLDivElement>(null);
  const cellRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const grid = { cols, rows };
  // latest prop values for the rAF loop without re-subscribing it
  const cfg = React.useRef({ influence, magnet, scale, radius, dimmed });
  React.useEffect(() => {
    cfg.current = { influence, magnet, scale, radius, dimmed };
  }, [influence, magnet, scale, radius, dimmed]);

  React.useEffect(() => {
    const view = viewRef.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const grid = { cols, rows };
    const n = grid.cols * grid.rows;
    // per-cell eased proximity, smoothed per frame for a springy feel
    const cur = new Float32Array(n);
    const pointer = { x: -1e5, y: -1e5 };

    const onMove = (e: PointerEvent) => {
      const r = view.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = -1e5;
      pointer.y = -1e5;
    };
    view.addEventListener("pointermove", onMove);
    view.addEventListener("pointerdown", onMove);
    view.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const loop = () => {
      const { influence, magnet, scale, radius, dimmed } = cfg.current;
      const r = view.getBoundingClientRect();
      // grid centered in the view
      const ox = (r.width - grid.cols * spacing) / 2 + spacing / 2;
      const oy = (r.height - grid.rows * spacing) / 2 + spacing / 2;

      for (let i = 0; i < n; i++) {
        const el = cellRefs.current[i];
        if (!el) continue;
        const cx = ox + (i % grid.cols) * spacing;
        const cy = oy + Math.floor(i / grid.cols) * spacing;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const d = Math.hypot(dx, dy);
        // smoothstep falloff: 1 at the cursor, 0 at the influence edge
        const lin = Math.max(0, 1 - d / influence);
        const target = lin * lin * (3 - 2 * lin);
        const t = reduced
          ? target
          : (cur[i] += (target - cur[i]) * 0.16);
        if (Math.abs(t) < 0.001 && el.dataset.rest === "1") continue;
        el.dataset.rest = t < 0.001 ? "1" : "0";

        const pull = d > 0.5 ? (magnet * t) / d : 0;
        const s = 1 + (scale - 1) * t;
        el.style.transform = `translate(${dx * pull}px, ${dy * pull}px) scale(${s})`;
        el.style.opacity = String(dimmed + (1 - dimmed) * t);
        el.style.borderRadius = `${50 - (50 - radius) * t}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      view.removeEventListener("pointermove", onMove);
      view.removeEventListener("pointerdown", onMove);
      view.removeEventListener("pointerleave", onLeave);
    };
  }, [cols, rows, spacing]);

  return (
    <div ref={viewRef} className={`${className} touch-none overflow-hidden`}>
      {(
        <div
          aria-hidden="true"
          className="absolute grid"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            gridTemplateColumns: `repeat(${grid.cols}, ${spacing}px)`,
            gridAutoRows: `${spacing}px`,
          }}
        >
          {Array.from({ length: grid.cols * grid.rows }, (_, i) => (
            <span key={i} className="flex items-center justify-center">
              <span
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                className="rounded-full bg-current"
                style={{ width: dot, height: dot, opacity: dimmed }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
