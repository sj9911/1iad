"use client";

// Promoted studies: slug → provider, tuned stage, and tuner panel.
// StudyRuntime is the client entry the /study/[slug] server page renders;
// the copy/params data lives in registry-data.ts (server-safe).

import type { ComponentType } from "react";
import { StudyTunerDock } from "@/components/study-dock";
import {
  BulletTimeStageTuned,
  BulletTimeTunerPanel,
  BulletTimeTunerProvider,
} from "./bullet-time";
import {
  InkPondStageTuned,
  InkPondTunerPanel,
  InkPondTunerProvider,
} from "./ink-pond";
import {
  JellyCardStageTuned,
  JellyCardTunerPanel,
  JellyCardTunerProvider,
} from "./jelly-card";
import {
  MurmurationStageTuned,
  MurmurationTunerPanel,
  MurmurationTunerProvider,
} from "./murmuration";
import {
  PetalGardenStageTuned,
  PetalGardenTunerPanel,
  PetalGardenTunerProvider,
} from "./petal-garden";
import {
  XRayStageTuned,
  XRayTunerPanel,
  XRayTunerProvider,
} from "./xray-lens";

type StudyEntry = {
  Provider: ComponentType<{ children: React.ReactNode }>;
  Stage: ComponentType;
  TunerPanel: ComponentType;
};

const studyComponents: Record<string, StudyEntry> = {
  "petal-garden": {
    Provider: PetalGardenTunerProvider,
    Stage: PetalGardenStageTuned,
    TunerPanel: PetalGardenTunerPanel,
  },
  "ink-pond": {
    Provider: InkPondTunerProvider,
    Stage: InkPondStageTuned,
    TunerPanel: InkPondTunerPanel,
  },
  murmuration: {
    Provider: MurmurationTunerProvider,
    Stage: MurmurationStageTuned,
    TunerPanel: MurmurationTunerPanel,
  },
  "xray-lens": {
    Provider: XRayTunerProvider,
    Stage: XRayStageTuned,
    TunerPanel: XRayTunerPanel,
  },
  "bullet-time": {
    Provider: BulletTimeTunerProvider,
    Stage: BulletTimeStageTuned,
    TunerPanel: BulletTimeTunerPanel,
  },
  "jelly-card": {
    Provider: JellyCardTunerProvider,
    Stage: JellyCardStageTuned,
    TunerPanel: JellyCardTunerPanel,
  },
};

export function StudyRuntime({ slug }: { slug: string }) {
  const entry = studyComponents[slug];
  if (!entry) return null;
  const { Provider, Stage, TunerPanel } = entry;
  return (
    <Provider>
      <div className="relative mt-8 overflow-hidden rounded-[28px] border border-hairline shadow-[0_18px_52px_rgba(0,0,0,.08)]">
        <Stage />
      </div>
      <StudyTunerDock>
        <TunerPanel />
      </StudyTunerDock>
    </Provider>
  );
}
