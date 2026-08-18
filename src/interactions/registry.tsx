import type { ComponentType } from "react";
import { interactionsMeta, type InteractionMeta } from "./meta";
import { ElasticSlider } from "./elastic-slider";
import { LikeButton } from "./like-button";

const components: Record<string, ComponentType> = {
  "elastic-slider": ElasticSlider,
  "like-button": LikeButton,
};

export type Interaction = InteractionMeta & { Component: ComponentType };

export const interactions: Interaction[] = interactionsMeta.map((m) => ({
  ...m,
  Component: components[m.slug],
}));
