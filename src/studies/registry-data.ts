// Server-safe study data (no client directive): slugs, copy, metadata.
// Component wiring lives in registry.tsx.

export type StudyData = {
  slug: string;
  title: string;
  kicker: string;
  blurb: string;
  hint: string;
};

export const studiesData: StudyData[] = [
  {
    slug: "petal-garden",
    title: "Petal Garden",
    kicker: "Ambient · wander",
    blurb: "Wander slowly and flowers sprout in your wake. Click to plant instantly. Petals detach, ride the breeze, and scatter away from your cursor like a passing hand through a meadow.",
    hint: "wander to plant · click to bloom",
  },
  {
    slug: "ink-pond",
    title: "Ink Pond",
    kicker: "Ambient · paint",
    blurb: "A dark pond of luminous ink. Move slowly and it blooms where you linger, diffusing along one shared gradient — aurora, ocean, sunset, or the full iridescent sweep.",
    hint: "move slowly · the ink blooms",
  },
  {
    slug: "murmuration",
    title: "Murmuration",
    kicker: "Ambient · flock",
    blurb: "A calm flock that orbits your cursor instead of chasing it. Lead them around the stage, click to scatter, and watch them regroup into a slow, breathing cloud.",
    hint: "move to lead · click to scatter",
  },
  {
    slug: "xray-lens",
    title: "X-Ray Lens",
    kicker: "Reveal · cursor",
    blurb: "Your cursor becomes a porthole into the layer beneath the surface: a blueprint build with neon type, hidden stats, and a slow scanning line. Lag is tunable from instant to heavy lantern.",
    hint: "move to see through",
  },
  {
    slug: "bullet-time",
    title: "Bullet Time",
    kicker: "Cinematic · hold",
    blurb: "Press and hold anywhere to sink into slow motion — time lerps down to a crawl, the camera pushes in, and the vignette closes. Release and the system snaps back to full speed.",
    hint: "press and hold to slow time",
  },
  {
    slug: "jelly-card",
    title: "Jelly Card",
    kicker: "Physics · flick",
    blurb: "A body you can grab anywhere, stretch along the pull, and fling. The release keeps your hand's velocity, so the card carries the flick before jiggling back home on a bouncy spring.",
    hint: "grab · stretch · fling",
  },
];
