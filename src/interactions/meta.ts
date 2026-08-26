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
  tags: string[]; // interaction verbs shown in the day sidebar
};

export const interactionsMeta: InteractionMeta[] = [
  {
    slug: "elastic-slider",
    day: 1,
    date: "2026-08-18",
    title: "Elastic Slider",
    description:
      "An iOS-style slider that stretches past its ends and springs back, with a rising tick sound every 10 steps.",
    hint: "Drag it, then keep dragging past the end. Sound on.",
    dependencies: ["motion"],
    file: "elastic-slider.tsx",
    tags: ["Drag", "Spring", "Sound"],
  },
  {
    slug: "like-button",
    day: 2,
    date: "2026-08-19",
    title: "Like Button",
    description:
      "A heart that pops with a spring, a ring flash, a burst of particles, and a satisfying pop sound.",
    hint: "Tap the heart. Sound on.",
    dependencies: ["motion"],
    file: "like-button.tsx",
    tags: ["Tap", "Particles", "Sound"],
  },
  {
    slug: "infinite-icon-grid",
    day: 3,
    date: "2026-08-20",
    title: "Infinite Icon Grid",
    description:
      "A window onto an endless grid of icons. Drag in any direction forever; icons pop in at random moments once fully on screen and pop away at the edges, with soft inertia and a slow idle drift. Bring your own images via the icons prop.",
    hint: "Drag anywhere. It never ends.",
    dependencies: [],
    file: "icon-grid.tsx",
    tags: ["Drag", "Infinite", "Spring"],
  },
  {
    slug: "intelligence-glow",
    day: 4,
    date: "2026-08-21",
    title: "Apple Intelligence Glow",
    description:
      "The Apple Intelligence summon effect for React: a flowing multicolor glow that sweeps around the edge of the screen, blooms inward, and breathes while it listens — the Siri-style edge light. Tap to summon, tap again to dismiss.",
    hint: "Tap to summon. Sound on.",
    dependencies: [],
    file: "intelligence-glow.tsx",
    tags: ["Tap", "Glow", "Sound"],
  },
  {
    slug: "proximity-grid",
    day: 5,
    date: "2026-08-22",
    title: "Proximity Grid",
    description:
      "A block of dots that feels your cursor: inside the influence radius they bloom into rounded squares, brighten, and get magnetically pulled toward the pointer with a smooth eased falloff. Flip the magnet negative and the grid repels instead.",
    hint: "Move your cursor. The grid feels it.",
    dependencies: [],
    file: "proximity-grid.tsx",
    tags: ["Hover", "Magnet", "Spring"],
  },
  {
    slug: "shader-button",
    day: 6,
    date: "2026-08-24",
    title: "Shader Button",
    description:
      "A pill button with a thermal shader border: a heatmap ring of blue, gold, and red flows around the machined icon well. Hovering doubles the heat, shifts in a hot magenta, and blooms a halo; pressing compresses the button. Built on Paper Shaders.",
    hint: "Hover it. Press it.",
    dependencies: ["@paper-design/shaders-react"],
    file: "shader-button.tsx",
    tags: ["Hover", "Tap", "Glow"],
  },
  {
    slug: "vinyl-player",
    day: 7,
    date: "2026-08-25",
    title: "Vinyl Player",
    description:
      "A tactile record player for React: tap to bring the motor up to speed, watch the needle drop and follow the groove, then grab the vinyl to scratch it forwards or backwards with matching audio.",
    hint: "Tap to play. Grab the vinyl and scratch it.",
    dependencies: [],
    file: "vinyl-player.tsx",
    tags: ["Tap", "Drag", "Sound"],
  },
  {
    slug: "transform-flow",
    day: 8,
    date: "2026-08-26",
    title: "Transform Flow",
    description:
      "Six inputs cross a shared seam and emerge as their paired outputs. Hold anywhere to speed up the flow, wake the particle field, and build a full-screen bloom.",
    hint: "Hold anywhere to accelerate the handoff. Keep holding to charge the bloom.",
    dependencies: [],
    file: "transform-flow.tsx",
    tags: ["Hold", "Transform", "Sound"],
  },
  {
    slug: "balloon-numbers",
    day: 9,
    date: "2026-08-27",
    title: "Balloon Numbers",
    description:
      "A number made of floating gold balloons. Move your cursor to part the group, then watch the digits bump, drift, and catch the occasional change in wind.",
    hint: "Move your cursor through the balloons. They make room.",
    dependencies: [],
    file: "balloon-numbers.tsx",
    tags: ["Hover", "Physics", "Wind"],
  },
];

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://1iad.com";
