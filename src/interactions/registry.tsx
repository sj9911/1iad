import type { ComponentType } from "react";
import { interactionsMeta, type InteractionMeta } from "./meta";
import { ElasticSlider } from "./elastic-slider";
import { LikeButton } from "./like-button";
import { IconGrid } from "./icon-grid";

const components: Record<string, ComponentType> = {
  "elastic-slider": ElasticSlider,
  "like-button": LikeButton,
  "infinite-icon-grid": IconGrid,
};

// day-page stage overrides: components that take over the whole dotted stage
const stageComponents: Record<string, ComponentType> = {
  "infinite-icon-grid": function IconGridStage() {
    return <IconGrid className="absolute inset-0" />;
  },
};

export type Interaction = InteractionMeta & {
  Component: ComponentType;
  StageComponent?: ComponentType;
};

export const interactions: Interaction[] = interactionsMeta.map((m) => ({
  ...m,
  Component: components[m.slug],
  StageComponent: stageComponents[m.slug],
}));
