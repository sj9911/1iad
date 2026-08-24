"use client";

/**
 * 1IAD Day 6 — Shader Button
 * A pill button whose icon well runs Paper Shaders' Heatmap: the icon is
 * the heat source, glowing waves of thermal color flow through the glyph
 * inside a machined circular well. Hovering accelerates the heat and blooms
 * a halo; pressing compresses the button.
 *
 * Needs `@paper-design/shaders-react` (installed automatically by the
 * shadcn CLI) and Tailwind. https://x.com/sunnyxdesign — built in public.
 */

import * as React from "react";
import { Heatmap } from "@paper-design/shaders-react";

// the heatmap palette (paper.design default), also used for halo + fallback
const HEAT_COLORS = [
  "#112069",
  "#1f3ca3",
  "#3265e7",
  "#6bd8ff",
  "#ffe77a",
  "#ff9a1f",
  "#ff4d00",
];
const CONIC = `${HEAT_COLORS.join(", ")}, ${HEAT_COLORS[0]}`;

// the heat source: a DARK glyph — the preprocessor flattens onto white
// and reads luminance, so dark pixels are the shape
const HOME_ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="272" height="272" viewBox="-5 -5 34 34"><path fill="#000" d="M11.3 3.3a1 1 0 0 1 1.4 0l7.6 7.2a.7.7 0 0 1-.48 1.2H18.4v7.05a1.25 1.25 0 0 1-1.25 1.25H14.2v-4.9a.9.9 0 0 0-.9-.9h-2.6a.9.9 0 0 0-.9.9v4.9H6.85A1.25 1.25 0 0 1 5.6 18.75V11.7H4.18a.7.7 0 0 1-.48-1.2Z"/></svg>`,
  );

const CSS = `
@property --sb-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
@keyframes sb-spin { to { --sb-angle: 360deg; } }
.sb-root { animation: sb-spin 4s linear infinite; }
.sb-paint {
  background: conic-gradient(from var(--sb-angle), ${CONIC});
}
@media (prefers-reduced-motion: reduce) {
  .sb-root { animation: none; }
}
`;

export function ShaderButton({
  children = "Home",
  iconSrc = HOME_ICON,
  onClick,
}: {
  children?: React.ReactNode;
  // dark-on-transparent/white image whose shape becomes the heat source
  iconSrc?: string;
  onClick?: () => void;
}) {
  // 0 = frozen (reduced motion), 1 = rest, 1.6 = hover
  const [speed, setSpeed] = React.useState(() =>
    typeof window !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 1,
  );

  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setSpeed((s) => (s === 0 ? 0 : 1.6))}
      onPointerLeave={() => setSpeed((s) => (s === 0 ? 0 : 1))}
      className="sb-root group relative flex select-none items-center gap-5 rounded-full border border-black/10 bg-gradient-to-b from-white to-neutral-200 p-2 pr-9 text-neutral-900 shadow-[0_2px_6px_rgba(0,0,0,0.08),0_12px_28px_rgba(0,0,0,0.10)] outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-[#3265e7] focus-visible:ring-offset-4 active:scale-[0.97] dark:border-white/10 dark:from-[#2e2e30] dark:to-[#151517] dark:text-neutral-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <style>{CSS}</style>
      {/* the icon well: a black porthole running the heatmap */}
      <span aria-hidden="true" className="relative size-14 shrink-0 rounded-full">
        {/* halo: hidden at rest, blooms on hover */}
        <span className="sb-paint absolute -inset-1.5 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-90" />
        {/* base + fallback: black well with a faint conic ember if WebGL is out */}
        <span className="sb-paint absolute inset-0 rounded-full opacity-60" />
        <span className="absolute inset-[2px] rounded-full bg-black" />
        {/* the heatmap: the icon glyph is the heat source */}
        <Heatmap
          image={iconSrc}
          colors={HEAT_COLORS}
          colorBack="#000000"
          contour={0.5}
          angle={0}
          noise={0}
          innerGlow={0.5}
          outerGlow={0.5}
          speed={speed}
          scale={0.75}
          className="absolute inset-[2px] overflow-hidden rounded-full"
          style={{ width: "calc(100% - 4px)", height: "calc(100% - 4px)" }}
        />
        {/* machined rim: light edge + top inner shadow */}
        <span className="pointer-events-none absolute inset-0 rounded-full border border-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.35),inset_0_-1px_1px_rgba(255,255,255,0.25)] dark:border-white/10 dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.65),inset_0_-1px_1px_rgba(255,255,255,0.06)]" />
      </span>
      <span className="relative text-xl font-semibold tracking-tight">
        {children}
      </span>
    </button>
  );
}
