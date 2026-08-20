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

export type Interaction = InteractionMeta & { Component: ComponentType };

export const interactions: Interaction[] = interactionsMeta.map((m) => ({
  ...m,
  Component: components[m.slug],
}));
