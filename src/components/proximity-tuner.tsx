"use client";

// Live tuning panel for the Proximity Grid day page, on the shared
// tuner-controls. Provider owns the knobs; the stage reads them through
// context, so cards and installed copies keep the shipped defaults.

import * as React from "react";
import { motion } from "motion/react";
import {
  IconArrowsMove,
  IconCircleHalf2,
  IconMagnet,
  IconRadar2,
  IconResize,
  IconSquareRounded,
} from "@tabler/icons-react";
import { DialRow, rise, TunerHeader } from "./tuner-controls";
import { ProximityGrid } from "@/interactions/proximity-grid";

type Knobs = {
  influence: number;
  magnet: number;
  scale: number;
  radius: number;
  dimmed: number;
  spacing: number;
};
const DEFAULTS: Knobs = {
  influence: 170,
  magnet: 12,
  scale: 5,
  radius: 30,
  dimmed: 0.5,
  spacing: 36,
};

type TunerCtx = {
  knobs: Knobs;
  setKnobs: React.Dispatch<React.SetStateAction<Knobs>>;
};
const Ctx = React.createContext<TunerCtx | null>(null);

export function ProximityTunerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [knobs, setKnobs] = React.useState<Knobs>(DEFAULTS);
  return <Ctx.Provider value={{ knobs, setKnobs }}>{children}</Ctx.Provider>;
}

export function ProximityStageTuned() {
  const knobs = React.useContext(Ctx)?.knobs ?? DEFAULTS;
  // solid background: the grid replaces the stage's static dot pattern
  return <ProximityGrid className="absolute inset-0 bg-background" {...knobs} />;
}

const ROWS = [
  { key: "influence", icon: IconRadar2, label: "Influence", min: 60, max: 420, step: 5, unit: "px" },
  { key: "magnet", icon: IconMagnet, label: "Magnet", min: -40, max: 40, step: 1, unit: "px" },
  { key: "scale", icon: IconResize, label: "Scale", min: 1, max: 9, step: 0.25, unit: "×" },
  { key: "radius", icon: IconSquareRounded, label: "Radius", min: 0, max: 50, step: 1, unit: "%" },
  { key: "dimmed", icon: IconCircleHalf2, label: "Resting", min: 0.05, max: 1, step: 0.05, unit: "" },
  { key: "spacing", icon: IconArrowsMove, label: "Spacing", min: 24, max: 72, step: 2, unit: "px" },
] as const;

export function ProximityTunerPanel() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const { knobs, setKnobs } = ctx;

  return (
    <div>
      <TunerHeader
        title="Proximity"
        blurb="How the grid feels the cursor. Flip Magnet negative to repel."
      />
      <motion.div
        variants={rise}
        className="mt-4 space-y-1.5 border-t border-hairline pt-5 pb-12"
      >
        {ROWS.map(({ key, icon, label, min, max, step, unit }) => (
          <DialRow
            key={key}
            icon={icon}
            label={label}
            value={knobs[key]}
            min={min}
            max={max}
            step={step}
            format={(v) => `${v}${unit}`}
            onChange={(v) => setKnobs((k) => ({ ...k, [key]: v }))}
          />
        ))}
      </motion.div>
    </div>
  );
}
