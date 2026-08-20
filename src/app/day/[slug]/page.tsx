// 0.5s: one live component floating alone on the dotted stage — this IS the
// recording frame. Chrome matches the v2 home: bricolage captions, floating dock.
import Link from "next/link";
import { notFound } from "next/navigation";
import { interactions } from "@/interactions/registry";
import { GlassLayers } from "@/components/floating-nav";
import { DayShell } from "@/components/day-shell";
import { getStars } from "@/lib/stars";
import { getNavBadges } from "@/lib/badges";
import { SITE_URL } from "@/interactions/meta";

export function generateStaticParams() {
  return interactions.map(({ slug }) => ({ slug }));
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
  const prompt = `Add the "${item.title}" interaction from OIAD to my React + Tailwind project by running: ${install}`;

  return (
    <main>
      <DayShell
        stars={stars}
        badges={badges}
        day={{
          title: item.title,
          day: item.day,
          description: item.description,
          prompt,
          install,
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
          href="/v2"
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

        {item.StageComponent ? <item.StageComponent /> : <item.Component />}
      </section>
      </DayShell>
    </main>
  );
}
