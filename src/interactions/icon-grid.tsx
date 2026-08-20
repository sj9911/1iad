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

const CELL = 88; // px per grid cell
const MAX_DELAY = 500; // ms of random wait before a fully visible icon pops in
const FRICTION = 0.94;
const DRIFT = { x: 0.18, y: 0.12 }; // idle auto-pan, px per frame
const COLS = 9;
const ROWS = 7;

const DEFAULT_ICONS = Array.from(
  { length: 50 },
  (_, i) => `/icons/grid/${i + 1}.png`,
);

export function IconGrid({ icons = DEFAULT_ICONS }: { icons?: string[] }) {
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
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);

    const totalW = COLS * CELL;
    const totalH = ROWS * CELL;
    // per-slot pop state, reset whenever the slot wraps to a new world cell
    const pops = Array.from({ length: COLS * ROWS }, () => ({
      wc: NaN,
      wr: NaN,
      scale: 0,
      showAt: -1,
    }));
    let raf = 0;

    const loop = (now: number) => {
      if (!s.dragging) {
        s.vx *= FRICTION;
        s.vy *= FRICTION;
        // ease back into the idle drift once the throw settles
        s.vx += (DRIFT.x - s.vx) * 0.015;
        s.vy += (DRIFT.y - s.vy) * 0.015;
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
            pop.scale = 0;
            pop.showAt = -1;
          }
          const inside =
            px >= 0 && py >= 0 && px + CELL <= s.w && py + CELL <= s.h;
          let target = 0;
          if (inside) {
            if (pop.showAt < 0) pop.showAt = now + Math.random() * MAX_DELAY;
            if (now >= pop.showAt) target = 1;
          } else {
            pop.showAt = -1;
          }
          pop.scale += (target - pop.scale) * (target > pop.scale ? 0.22 : 0.35);
          if (Math.abs(target - pop.scale) < 0.01) pop.scale = target;
          node.style.transform = `translate(${px}px, ${py}px) scale(${pop.scale})`;
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
  }, [icons]);

  return (
    <div
      ref={viewRef}
      aria-label="Infinite icon grid. Drag to explore."
      className="relative h-[340px] w-full max-w-[520px] cursor-grab touch-none select-none overflow-hidden rounded-3xl border border-black/10 active:cursor-grabbing dark:border-white/15"
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
          style={{ width: CELL, height: CELL, transform: "scale(0)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" draggable={false} className="pointer-events-none size-11" />
        </div>
      ))}
    </div>
  );
}
