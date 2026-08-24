"use client";

/**
 * 1IAD Day 6 — Shader Button
 * A button wrapped in a thick, flowing gradient border: the band rotates
 * slowly, blooms a soft halo behind the button, brightens on hover, and
 * compresses on press. v1 is pure CSS; a real shader border comes next.
 *
 * Self-contained: React + Tailwind only, no animation library.
 * https://x.com/sunnyxdesign — built in public, one interaction a day.
 */

import * as React from "react";

// the Apple Intelligence palette, looped so the conic seam is invisible
const COLORS =
  "#bc82f3, #f5b9ea, #8d9fff, #ff6778, #ffba71, #c686ff, #bc82f3";

const CSS = `
@property --sb-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
@keyframes sb-spin { to { --sb-angle: 360deg; } }
.sb-root { animation: sb-spin 4s linear infinite; }
.sb-paint {
  background: conic-gradient(from var(--sb-angle), ${COLORS});
}
/* the border band: gradient masked to a ring of --t thickness */
.sb-ring {
  padding: var(--t);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
@media (prefers-reduced-motion: reduce) {
  .sb-root { animation: none; }
}
`;

export function ShaderButton({
  children = "Generate",
  thickness = 5,
  onClick,
}: {
  children?: React.ReactNode;
  thickness?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="sb-root group relative select-none rounded-2xl px-9 py-4 text-lg font-semibold text-neutral-900 outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-[#8d9fff] focus-visible:ring-offset-4 active:scale-[0.96] dark:text-neutral-50"
      style={{ "--t": `${thickness}px` } as React.CSSProperties}
    >
      <style>{CSS}</style>
      {/* soft halo behind the button; breathes brighter on hover */}
      <span
        aria-hidden="true"
        className="sb-paint absolute -inset-1 rounded-[20px] opacity-40 blur-lg transition-opacity duration-300 group-hover:opacity-75"
      />
      {/* button face */}
      <span
        aria-hidden="true"
        className="absolute rounded-[11px] bg-white dark:bg-neutral-900"
        style={{ inset: thickness }}
      />
      {/* the flowing border band */}
      <span
        aria-hidden="true"
        className="sb-paint sb-ring absolute inset-0 rounded-[inherit]"
      />
      <span className="relative">{children}</span>
    </button>
  );
}
