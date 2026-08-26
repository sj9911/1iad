import type { ComponentType } from "react";
import { interactionsMeta, type InteractionMeta } from "./meta";
import { ElasticSlider } from "./elastic-slider";
import { LikeButton } from "./like-button";
import { IconGrid } from "./icon-grid";
import { IntelligenceGlow } from "./intelligence-glow";
import { ProximityGrid } from "./proximity-grid";
import { ShaderButton } from "./shader-button";
import { VinylPlayer } from "./vinyl-player";
import { TransformFlow } from "./transform-flow";
import { GlowStageTuned } from "@/components/glow-tuner";
import { ProximityStageTuned } from "@/components/proximity-tuner";
import { VinylStageTuned } from "@/components/vinyl-tuner";
import { TransformFlowStageTuned } from "@/components/transform-flow-tuner";

const components: Record<string, ComponentType> = {
  "elastic-slider": ElasticSlider,
  // on the site the button is live: count shared across visitors via redis
  "like-button": function LiveLikeButton() {
    return <LikeButton api="/api/likes" />;
  },
  "infinite-icon-grid": IconGrid,
  "intelligence-glow": IntelligenceGlow,
  "proximity-grid": ProximityGrid,
  "shader-button": ShaderButton,
  "vinyl-player": VinylPlayer,
  "transform-flow": TransformFlow,
};

// day-page stage overrides: components that take over the whole dotted stage
const stageComponents: Record<string, ComponentType> = {
  "infinite-icon-grid": function IconGridStage() {
    return <IconGrid className="absolute inset-0" />;
  },
  // reads tuned layers from GlowTunerProvider when the day page mounts one
  "intelligence-glow": GlowStageTuned,
  "proximity-grid": ProximityStageTuned,
  "vinyl-player": VinylStageTuned,
  "transform-flow": TransformFlowStageTuned,
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
  "proximity-grid": function ProximityGridCard() {
    return (
      <ProximityGrid className="absolute inset-0 bg-background" cols={11} rows={7} spacing={26} dot={4} influence={120} magnet={9} />
    );
  },
  "vinyl-player": function VinylPlayerCard() {
    return <VinylPlayer className="w-[62%] max-w-[288px]" />;
  },
  "transform-flow": function TransformFlowCard() {
    return <TransformFlow className="absolute inset-x-0 top-1/2 rounded-none border-0 shadow-none" aspectRatio="32 / 14.3" centered duration={15} particleCount={0} sound={false} interactive />;
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
