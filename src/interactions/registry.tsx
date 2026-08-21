import type { ComponentType } from "react";
import { interactionsMeta, type InteractionMeta } from "./meta";
import { ElasticSlider } from "./elastic-slider";
import { LikeButton } from "./like-button";
import { IconGrid } from "./icon-grid";
import { IntelligenceGlow } from "./intelligence-glow";
import { GlowStageTuned } from "@/components/glow-tuner";

const components: Record<string, ComponentType> = {
  "elastic-slider": ElasticSlider,
  // on the site the button is live: count shared across visitors via redis
  "like-button": function LiveLikeButton() {
    return <LikeButton api="/api/likes" />;
  },
  "infinite-icon-grid": IconGrid,
  "intelligence-glow": IntelligenceGlow,
};

// day-page stage overrides: components that take over the whole dotted stage
const stageComponents: Record<string, ComponentType> = {
  "infinite-icon-grid": function IconGridStage() {
    return <IconGrid className="absolute inset-0" />;
  },
  // reads tuned layers from GlowTunerProvider when the day page mounts one
  "intelligence-glow": GlowStageTuned,
};

// gallery-card overrides: full-bleed like the stage, but scaled for the card
const cardComponents: Record<string, ComponentType> = {
  "infinite-icon-grid": function IconGridCard() {
    return <IconGrid className="absolute inset-0" cell={88} iconSize={60} />;
  },
  // cards start lit so the gallery shimmers without a tap
  "intelligence-glow": function IntelligenceGlowCard() {
    return <IntelligenceGlow className="absolute inset-0" defaultOn scale={0.55} />;
  },
};

export type Interaction = InteractionMeta & {
  Component: ComponentType;
  StageComponent?: ComponentType;
  CardComponent?: ComponentType;
};

export const interactions: Interaction[] = interactionsMeta.map((m) => ({
  ...m,
  Component: components[m.slug],
  StageComponent: stageComponents[m.slug],
  CardComponent: cardComponents[m.slug],
}));
