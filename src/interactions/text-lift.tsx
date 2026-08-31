"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

export type TextLiftProps = {
  className?: string;
  text?: string;
  fontSize?: number;
  restWeight?: number;
  peakWeight?: number;
  restWidth?: number;
  peakWidth?: number;
  lift?: number;
  focus?: number;
  letterSpacing?: number;
  color?: string;
  interactive?: boolean;
  aspectRatio?: string;
  fill?: boolean;
};

function cleanText(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 14) || "TOUCH";
}

export function TextLift({
  className = "",
  text = "TOUCH",
  fontSize = 116,
  restWeight = 470,
  peakWeight = 820,
  restWidth = 108,
  peakWidth = 122,
  lift = 18,
  focus = 4.4,
  letterSpacing = 0,
  color = "#002fff",
  interactive = true,
  aspectRatio = "32 / 14.3",
  fill = false,
}: TextLiftProps) {
  const reduced = useReducedMotion();
  const [pointer, setPointer] = React.useState<number | null>(null);
  const word = cleanText(text);
  const letters = [...word];

  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-2xl border border-hairline bg-[radial-gradient(ellipse_at_50%_48%,#eff0f5,transparent_64%)] shadow-[0_24px_72px_rgba(0,0,0,.08)] dark:bg-[radial-gradient(ellipse_at_50%_48%,#242428,transparent_64%)] ${className}`}
      style={fill
        ? { position: "absolute", inset: 0, width: "100%", height: "100%", aspectRatio: "auto" }
        : { width: "min(92%, 900px)", maxWidth: "900px", flexShrink: 0, aspectRatio }}
      onPointerMove={(event) => {
        if (!interactive || reduced) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer((event.clientX - bounds.left) / bounds.width);
      }}
      onPointerLeave={() => setPointer(null)}
      aria-label={`Text lift: ${word}`}
    >
      <div className="relative flex max-w-[92%] select-none items-baseline justify-center whitespace-pre" aria-hidden="true">
        {letters.map((letter, index) => {
          const position = (index + 0.5) / letters.length;
          const proximity = pointer === null ? 0 : Math.max(0, 1 - Math.abs(pointer - position) * focus);
          const amount = interactive && !reduced ? proximity : 0;
          const settling = pointer === null;
          return (
            <motion.span
              key={`${letter}-${index}`}
              animate={{
                y: -amount * lift,
                scaleY: 1 + amount * 0.24,
                fontWeight: restWeight + amount * (peakWeight - restWeight),
                fontStretch: `${restWidth + amount * (peakWidth - restWidth)}%`,
              }}
              transition={{
                y: settling ? { type: "spring", stiffness: 85, damping: 19, mass: 1.05 } : { type: "spring", stiffness: 170, damping: 18, mass: 0.7 },
                scaleY: settling ? { type: "spring", stiffness: 85, damping: 19, mass: 1.05 } : { type: "spring", stiffness: 170, damping: 18, mass: 0.7 },
                fontWeight: { duration: settling ? 0.56 : 0.2, ease: [0.23, 1, 0.32, 1] },
                fontStretch: { duration: settling ? 0.56 : 0.2, ease: [0.23, 1, 0.32, 1] },
              }}
              style={{
                color,
                fontSize: `clamp(2.35rem, ${Math.max(5, fontSize / 10)}vw, ${fontSize}px)`,
                fontWeight: restWeight,
                fontStretch: `${restWidth}%`,
                letterSpacing: `${letterSpacing}em`,
              }}
              className="inline-block leading-none"
            >
              {letter}
            </motion.span>
          );
        })}
      </div>
      <span aria-hidden="true" className="absolute bottom-5 font-mono text-[10px] uppercase tracking-[.2em] text-muted">move across the word</span>
    </div>
  );
}
