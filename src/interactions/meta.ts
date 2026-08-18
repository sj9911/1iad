// Plain data only — safe to import from route handlers (llms.txt, /r/[slug]).
// Adding a day = one entry here + one component file + one line in registry.tsx.

export type InteractionMeta = {
  slug: string;
  day: number;
  date: string; // ISO
  title: string;
  description: string;
  hint: string; // one-line "how to play" shown on the stage
  dependencies: string[];
  file: string; // path under src/interactions/
};

export const interactionsMeta: InteractionMeta[] = [
  {
    slug: "elastic-slider",
    day: 1,
    date: "2026-08-18",
    title: "Elastic Slider",
    description:
      "An iOS-style slider that stretches past its ends and springs back, with a rising tick sound every 10 steps.",
    hint: "Drag it — then keep dragging past the end. Sound on.",
    dependencies: ["motion"],
    file: "elastic-slider.tsx",
  },
];

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://oiad.vercel.app";
