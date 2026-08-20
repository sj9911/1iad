"use client";

/**
 * Logo intro: each character slot flickers through its style variants
 * in random order, one slot at a time, then locks onto the final glyph
 * (the -4 variant), which sits exactly where it lives in Final.svg.
 */

import * as React from "react";

export type Glyph = { viewBox: string; inner: string };
export type Box = { x: number; y: number; w: number; h: number };
export type Slot = Box & {
  variants: Glyph[]; // [v1, v2, v3, v4(final)]
  flick?: Box; // where variants 1-3 render, when the final glyph's box is misleading (curved A)
};

const FINAL_W = 247;
const FINAL_H = 92;
const FLICKS = 5; // random variants shown before settling
const FLICK_MS = 220;

function GlyphSvg({ glyph, fit }: { glyph: Glyph; fit?: boolean }) {
  return (
    <svg
      viewBox={glyph.viewBox}
      preserveAspectRatio={fit ? "xMidYMid meet" : "none"}
      className="h-full w-full"
      dangerouslySetInnerHTML={{ __html: glyph.inner }}
    />
  );
}

export function LogoIntro({
  slots,
  className = "w-full max-w-[500px]",
}: {
  slots: Slot[];
  className?: string;
}) {
  // state per slot: -1 hidden, 0..2 flicking (variant index), 3 settled
  const [shown, setShown] = React.useState<number[]>(slots.map(() => -1));
  const [run, setRun] = React.useState(0);
  // hovering the settled logo loops all characters through their variants in sync
  // (keeps A-4 and I-4 on screen together — they are matching pieces)
  const [hovering, setHovering] = React.useState(false);
  const [hoverV, setHoverV] = React.useState(0);

  React.useEffect(() => {
    if (!hovering) return;
    let v = 0;
    setHoverV(0);
    const id = setInterval(() => {
      v = (v + 1) % 4;
      setHoverV(v);
    }, FLICK_MS);
    return () => clearInterval(id);
  }, [hovering]);

  React.useEffect(() => {
    setShown(slots.map(() => -1));
    const timers: ReturnType<typeof setTimeout>[] = [];
    // all slots flicker together, each picking its own random variants
    for (let f = 0; f < FLICKS; f++) {
      timers.push(
        setTimeout(
          () => setShown(slots.map(() => Math.floor(Math.random() * 3))),
          200 + f * FLICK_MS,
        ),
      );
    }
    timers.push(
      setTimeout(
        () => setShown(slots.map(() => 3)),
        200 + FLICKS * FLICK_MS,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [slots, run]);

  return (
    <button
      onClick={() => setRun((r) => r + 1)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-label="Replay logo animation"
      className={`relative cursor-pointer outline-none ${className}`}
      style={{ aspectRatio: `${FINAL_W} / ${FINAL_H}` }}
    >
      {slots.map((slot, i) => {
        const allSettled = shown.every((s) => s === 3);
        const v = allSettled && hovering ? hoverV : shown[i];
        const box = v >= 0 && v < 3 ? (slot.flick ?? slot) : slot;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(box.x / FINAL_W) * 100}%`,
              top: `${(box.y / FINAL_H) * 100}%`,
              width: `${(box.w / FINAL_W) * 100}%`,
              height: `${(box.h / FINAL_H) * 100}%`,
            }}
          >
            {v >= 0 && v < 3 && <GlyphSvg glyph={slot.variants[v]} fit />}
            {v === 3 && <GlyphSvg glyph={slot.variants[3]} />}
          </div>
        );
      })}
    </button>
  );
}
