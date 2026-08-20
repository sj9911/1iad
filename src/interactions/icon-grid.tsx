"use client";

/**
 * OIAD Day 3 — Infinite Icon Grid
 * A window onto an endless grid of icons. Drag in any direction forever;
 * icons bloom in from nothing at the edges and shrink away as they leave.
 * Soft inertia on release, and a slow drift when idle.
 *
 * Self-contained: React + Tailwind only, no animation library.
 * Pass your own image URLs via the `icons` prop.
 */

import * as React from "react";

const MAX_DELAY = 500; // ms of random wait before a fully visible icon pops in
const FRICTION = 0.94;

const DEFAULT_ICONS = Array.from(
  { length: 30 },
  (_, i) => `/icons/grid/${i + 1}.webp`,
);

export function IconGrid({
  icons = DEFAULT_ICONS,
  className = "relative h-[340px] w-full max-w-[520px] rounded-3xl border border-black/10 dark:border-white/15",
  cell: CELL = 230, // px per grid cell
  iconSize = 110, // px per icon image
}: {
  icons?: string[];
  className?: string;
  cell?: number;
  iconSize?: number;
}) {
  const [grid, setGrid] = React.useState({ cols: 9, rows: 7 });
  const COLS = grid.cols;
  const ROWS = grid.rows;
  const viewRef = React.useRef<HTMLDivElement>(null);
  const slotRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const st = React.useRef({
    ox: 0, oy: 0, vx: 0, vy: 0,
    dragging: false, lastX: 0, lastY: 0,
    w: 0, h: 0,
  });

  React.useEffect(() => {
    const view = viewRef.current!;
    const s = st.current;
    const measure = () => {
      const r = view.getBoundingClientRect();
      s.w = r.width;
      s.h = r.height;
      const cols = Math.ceil(r.width / CELL) + 2;
      const rows = Math.ceil(r.height / CELL) + 2;
      setGrid((g) =>
        g.cols === cols && g.rows === rows ? g : { cols, rows },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);

    const totalW = COLS * CELL;
    const totalH = ROWS * CELL;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // per-slot pop state, reset whenever the slot wraps to a new world cell
    const pops = Array.from({ length: COLS * ROWS }, () => ({
      wc: NaN,
      wr: NaN,
      p: 0, // pop progress 0..1 (springs slightly past 1 on entry)
      vel: 0,
      showAt: -1,
    }));
    let raf = 0;
    let firstNow = -1;

    const loop = (now: number) => {
      if (firstNow < 0) firstNow = now;
      // full random stagger for the opening bloom; icons entering later
      // (while panning) show almost immediately
      const maxDelay = now - firstNow < 1000 ? MAX_DELAY : 120;
      if (!s.dragging) {
        s.vx *= FRICTION;
        s.vy *= FRICTION;
        s.ox += s.vx;
        s.oy += s.vy;
      }
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const node = slotRefs.current[j * COLS + i];
          if (!node) continue;
          const px = ((((i * CELL + s.ox) % totalW) + totalW) % totalW) - CELL;
          const py = ((((j * CELL + s.oy) % totalH) + totalH) % totalH) - CELL;
          // icon identity is tied to the world cell, so the field is stable while panning
          const wc = Math.round((px - s.ox) / CELL);
          const wr = Math.round((py - s.oy) / CELL);

          // pop in at a random moment once fully inside; pop out when touching an edge
          const pop = pops[j * COLS + i];
          if (pop.wc !== wc || pop.wr !== wr) {
            pop.wc = wc;
            pop.wr = wr;
            pop.p = 0;
            pop.vel = 0;
            pop.showAt = -1;
          }
          // "inside" once at least 75% of the icon itself (not its cell) is in view
          const pad = (CELL - iconSize) / 2;
          const ix = px + pad;
          const iy = py + pad;
          const visW = Math.min(ix + iconSize, s.w) - Math.max(ix, 0);
          const visH = Math.min(iy + iconSize, s.h) - Math.max(iy, 0);
          const inside =
            visW > 0 && visH > 0 && visW * visH >= 0.75 * iconSize * iconSize;
          let target = 0;
          if (inside) {
            if (pop.showAt < 0) pop.showAt = now + Math.random() * maxDelay;
            if (now >= pop.showAt) target = 1;
          } else {
            pop.showAt = -1;
          }
          if (target === 1) {
            if (reduced) {
              pop.p += (1 - pop.p) * 0.25; // gentle fade, no bounce
            } else {
              // soft spring: settles in ~350ms with a barely-there overshoot
              pop.vel += (1 - pop.p) * 0.12;
              pop.vel *= 0.78;
              pop.p += pop.vel;
            }
          } else {
            pop.vel = 0;
            pop.p += (0 - pop.p) * 0.3; // exit mirrors the entrance, but snappier
            if (pop.p < 0.005) pop.p = 0;
          }
          // never from scale(0): icons rise from 0.6 while fading in
          const scale = 0.6 + 0.4 * pop.p;
          node.style.opacity = String(Math.min(1, pop.p / 0.6));
          node.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
          const idx =
            (((wc * 7 + wr * 13) % icons.length) + icons.length) %
            icons.length;
          const img = node.firstChild as HTMLImageElement;
          if (img.dataset.src !== icons[idx]) {
            img.dataset.src = icons[idx];
            img.src = icons[idx];
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [icons, COLS, ROWS, CELL, iconSize]);

  return (
    <div
      ref={viewRef}
      aria-label="Infinite icon grid. Drag to explore."
      className={`cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const s = st.current;
        s.dragging = true;
        s.lastX = e.clientX;
        s.lastY = e.clientY;
        s.vx = 0;
        s.vy = 0;
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (!s.dragging) return;
        const dx = e.clientX - s.lastX;
        const dy = e.clientY - s.lastY;
        s.ox += dx;
        s.oy += dy;
        s.vx = dx;
        s.vy = dy;
        s.lastX = e.clientX;
        s.lastY = e.clientY;
      }}
      onPointerUp={() => (st.current.dragging = false)}
      onPointerCancel={() => (st.current.dragging = false)}
    >
      {Array.from({ length: COLS * ROWS }, (_, k) => (
        <div
          key={k}
          ref={(el) => {
            slotRefs.current[k] = el;
          }}
          className="absolute left-0 top-0 flex items-center justify-center will-change-transform"
          style={{ width: CELL, height: CELL, opacity: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            draggable={false}
            className="pointer-events-none"
            style={{ width: iconSize, height: iconSize }}
          />
        </div>
      ))}
    </div>
  );
}
