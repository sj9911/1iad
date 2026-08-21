"use client";

// Live tuning for the Intelligence Glow day page, powered by DialKit
// (joshpuckett.me/dialkit). The stage registers one folder of dials per glow
// layer; the panel is an inline DialRoot mounted in DayShell's sliding aside.
// Gallery cards and installed copies never touch this — they render the
// interaction file's shipped GLOW_LAYERS defaults.

import * as React from "react";
import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import {
  IntelligenceGlow,
  GLOW_LAYERS,
  type GlowLayer,
} from "@/interactions/intelligence-glow";

const tuple = (v: number, max: number, step: number) =>
  [v, 0, max, step] as [number, number, number, number];

const folder = (l: GlowLayer) => ({
  ring: tuple(l.t, 80, 1),
  blur: tuple(l.b, 160, 1),
  opacity: tuple(l.o, 1, 0.05),
  breathe: l.breathe,
  delay: tuple(parseFloat(l.delay) || 0, 2, 0.1),
});

export function GlowStageTuned() {
  const p = useDialKit("Glow", {
    layer1: folder(GLOW_LAYERS[0]),
    layer2: folder(GLOW_LAYERS[1]),
    layer3: folder(GLOW_LAYERS[2]),
    layer4: folder(GLOW_LAYERS[3]),
  });
  const layers: GlowLayer[] = [p.layer1, p.layer2, p.layer3, p.layer4].map(
    (l) => ({
      t: l.ring,
      b: l.blur,
      o: l.opacity,
      breathe: l.breathe,
      delay: `${l.delay}s`,
    }),
  );
  return <IntelligenceGlow className="absolute inset-0" layers={layers} />;
}

export function GlowTunerPanel() {
  return (
    <div>
      {/* slim header in the sidebar's voice, DialKit below */}
      <header className="pb-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--oiad-blue)]">
          Live tuner
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Reshape the bloom in real time. Yours to play with.
        </p>
      </header>
      <DialRoot mode="inline" defaultOpen productionEnabled />
    </div>
  );
}
