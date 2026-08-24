"use client";

/**
 * 1IAD Day 6 — Shader Button
 * A pill button with a thermal shader border: Paper Shaders' Heatmap runs
 * in a ring around the machined icon well (a dark disc is the heat source,
 * its contour heat landing exactly at the border). The heat always flows;
 * hovering doubles the speed, shifts in a hot magenta, and blooms a halo.
 * Pressing compresses the button.
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
const HOT_COLORS = [...HEAT_COLORS, "#ff2ec4"];
const CONIC = `${HEAT_COLORS.join(", ")}, ${HEAT_COLORS[0]}`;

// static conic for the halo and the no-WebGL fallback rim — the shader owns
// all motion, so nothing else on the button animates at rest
const CSS = `
.sb-paint {
  background: conic-gradient(${CONIC});
}
`;

// the ring's heat source: a dark disc — its contour lands at the well's edge
const RING_DISC =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="272" height="272" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15.5" fill="#000"/></svg>`,
  );

export function ShaderButton({
  children = "Home",
  icon,
  thickness = 4,
  onClick,
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  thickness?: number;
  onClick?: () => void;
}) {
  // the heat always flows; hover runs it hotter, faster, with an extra color
  const [hot, setHot] = React.useState(false);
  const reduced =
    typeof window !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      className="group relative flex select-none items-center gap-5 rounded-full border border-black/10 bg-gradient-to-b from-white to-neutral-200 p-2 pr-9 text-neutral-900 shadow-[0_2px_6px_rgba(0,0,0,0.08),0_12px_28px_rgba(0,0,0,0.10)] outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-[#3265e7] focus-visible:ring-offset-4 active:scale-[0.97] dark:border-white/10 dark:from-[#2e2e30] dark:to-[#151517] dark:text-neutral-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <style>{CSS}</style>
      {/* the icon well: heat runs in the border ring only */}
      <span aria-hidden="true" className="relative size-14 shrink-0 rounded-full">
        {/* halo: a second, larger Heatmap instance — same heat source, cranked
            outerGlow, transparent background — so the bloom is the shader's
            own glow output (blurred/faded via CSS), not a fake static gradient */}
        <span className="absolute -inset-3 overflow-hidden rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-90">
          <Heatmap
            image={RING_DISC}
            colors={hot ? HOT_COLORS : HEAT_COLORS}
            colorBack="rgba(0,0,0,0)"
            contour={0.65}
            angle={0}
            noise={0}
            innerGlow={0.2}
            outerGlow={1}
            speed={reduced ? 0 : 2}
            frame={52000}
            scale={0.55}
            style={{ width: "100%", height: "100%" }}
          />
        </span>
        {/* fallback: a faint conic ember ring if WebGL is out */}
        <span className="sb-paint absolute inset-0 rounded-full opacity-60" />
        <span className="absolute inset-[1px] rounded-full bg-black" />
        {/* the heatmap: a dark disc's contour heat = the ring; the face
            occludes everything inside the band */}
        <Heatmap
          image={RING_DISC}
          colors={hot ? HOT_COLORS : HEAT_COLORS}
          colorBack="#000000"
          contour={0.5}
          angle={0}
          noise={0}
          innerGlow={0.5}
          outerGlow={0.5}
          speed={reduced ? 0 : hot ? 2 : 1}
          frame={52000}
          scale={1}
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ width: "100%", height: "100%" }}
        />
        {/* embossed face over the center: light rim + top inner shadow */}
        <span
          className="absolute rounded-full border border-white/70 bg-gradient-to-b from-white to-neutral-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18),inset_0_-1px_1px_rgba(255,255,255,0.55)] dark:border-white/10 dark:from-[#2e2e30] dark:to-[#151517] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.65),inset_0_-1px_1px_rgba(255,255,255,0.06)]"
          style={{ inset: thickness }}
        />
        {/* the icon, softly embossed */}
        <span className="absolute inset-0 flex items-center justify-center text-neutral-600 [filter:drop-shadow(0_1px_1px_rgba(255,255,255,0.6))] dark:text-neutral-100 dark:[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.7))]">
          {icon ?? (
            <svg viewBox="0 0 24 24" className="size-6 fill-current">
              <path d="M11.3 3.3a1 1 0 0 1 1.4 0l7.6 7.2a.7.7 0 0 1-.48 1.2H18.4v7.05a1.25 1.25 0 0 1-1.25 1.25H14.2v-4.9a.9.9 0 0 0-.9-.9h-2.6a.9.9 0 0 0-.9.9v4.9H6.85A1.25 1.25 0 0 1 5.6 18.75V11.7H4.18a.7.7 0 0 1-.48-1.2Z" />
            </svg>
          )}
        </span>
      </span>
      <span className="relative text-xl font-semibold tracking-tight">
        {children}
      </span>
    </button>
  );
}
