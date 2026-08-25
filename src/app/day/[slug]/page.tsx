// 0.5s: one live component floating alone on the dotted stage — this IS the
// recording frame. Chrome matches the v2 home: bricolage captions, floating dock.
import { existsSync } from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { interactions } from "@/interactions/registry";
import { GlassLayers } from "@/components/floating-nav";
import { DayShell } from "@/components/day-shell";
import { GlowTunerPanel, GlowTunerProvider } from "@/components/glow-tuner";
import {
  ProximityTunerPanel,
  ProximityTunerProvider,
} from "@/components/proximity-tuner";
import { VinylTunerPanel, VinylTunerProvider } from "@/components/vinyl-tuner";
import { TunerPromptProvider } from "@/components/tuner-prompt";
import { getStars } from "@/lib/stars";
import { getNavBadges } from "@/lib/badges";
import { SITE_URL } from "@/interactions/meta";

export function generateStaticParams() {
  return interactions.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = interactions.find((i) => i.slug === slug);
  if (!item) return {};
  // per-day card from scripts/og.mjs when it exists, else the site hero
  const og = existsSync(path.join(process.cwd(), "public/og", `${slug}.png`))
    ? `/og/${slug}.png`
    : "/opengraph-image.png";
  return {
    title: `${item.title} — Free React Component`,
    description: `${item.description} Day ${item.day} of One Interaction A Day — free, MIT licensed, one shadcn CLI command to install.`,
    alternates: { canonical: `/day/${item.slug}` },
    openGraph: {
      type: "article",
      url: `/day/${item.slug}`,
      title: `${item.title} — Free React Component`,
      description: item.description,
      images: og,
    },
    twitter: {
      card: "summary_large_image",
      images: og,
    },
  };
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = interactions.find((i) => i.slug === slug);
  if (!item) notFound();
  const stars = await getStars();
  const badges = await getNavBadges();
  const install = `npx shadcn@latest add ${SITE_URL}/r/${item.slug}`;
  const prompt = `Add the "${item.title}" interaction from 1IAD to my React + Tailwind project by running: ${install}`;

  // days with a live tuning panel behind the sliders icon in the dock
  const tuners: Record<
    string,
    { Provider: React.ComponentType<{ children: React.ReactNode }>; panel: React.ReactNode }
  > = {
    "intelligence-glow": { Provider: GlowTunerProvider, panel: <GlowTunerPanel /> },
    "proximity-grid": { Provider: ProximityTunerProvider, panel: <ProximityTunerPanel /> },
    "vinyl-player": { Provider: VinylTunerProvider, panel: <VinylTunerPanel /> },
  };
  const tuner = tuners[slug];

  const codeLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: item.title,
    description: item.description,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React 19",
    codeRepository: "https://github.com/sj9911/1iad",
    license: "https://opensource.org/license/mit",
    url: `${SITE_URL}/day/${item.slug}`,
    dateCreated: item.date,
    author: {
      "@type": "Person",
      name: "Sunny Joshi",
      url: "https://x.com/sunnyxdesign",
    },
  };

  const shell = (
      <DayShell
        stars={stars}
        badges={badges}
        tuner={tuner?.panel}
        day={{
          title: item.title,
          day: item.day,
          description: item.description,
          prompt,
          install,
          tags: item.tags,
          dependencies: item.dependencies,
        }}
      >
      {/* The stage — record this section as-is */}
      <section
        className="relative flex min-h-svh flex-col items-center justify-center px-6"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)",
          backgroundSize: "18px 18px",
        }}
      >
        <Link
          href="/"
          // fixed, not absolute: stays put when the sidebar squeezes the stage
          className="fixed left-8 top-8 z-[60] rounded-2xl border border-hairline p-1.5"
        >
          <GlassLayers />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-linear-to-t from-surface/20 to-surface/75"
          />
          <span className="font-bricolage relative flex h-[42px] items-center gap-2 rounded-xl px-3.5 text-base font-semibold transition-colors duration-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.09]">
            <svg
              viewBox="0 0 9 9"
              className="h-[0.72em] w-auto rotate-180 fill-current"
              aria-hidden="true"
            >
              <path d="M4.63636 8.267L3.75852 7.39768L6.38778 4.76842H0V3.49854H6.38778L3.75852 0.873535L4.63636 -4.45843e-05L8.76989 4.13348L4.63636 8.267Z" />
            </svg>
            Back
          </span>
        </Link>
        <h1 className="sr-only">{item.title}</h1>
        {/* the full write-up only exists inside the (aria-hidden when closed)
            sidebar drawer — duplicate the answer here, sr-only, so screen
            readers and non-JS crawlers get it without opening the drawer */}
        <p className="sr-only">
          {item.description} Install: {install}
        </p>

        {item.StageComponent ? <item.StageComponent /> : <item.Component />}
      </section>
      </DayShell>
  );

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(codeLd) }}
      />
      {tuner ? <TunerPromptProvider><tuner.Provider>{shell}</tuner.Provider></TunerPromptProvider> : shell}
    </main>
  );
}
