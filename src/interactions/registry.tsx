import type { ComponentType } from "react";
import { interactionsMeta, type InteractionMeta } from "./meta";
import { ElasticSlider } from "./elastic-slider";

const components: Record<string, ComponentType> = {
  "elastic-slider": ElasticSlider,
};

export type Interaction = InteractionMeta & { Component: ComponentType };

export const interactions: Interaction[] = interactionsMeta.map((m) => ({
  ...m,
  Component: components[m.slug],
}));
