// Homepage redesign in progress. Current home stays at / until this replaces it.
// Layout lives in the poster's 738x386 coordinate space; text sizes use cqw so
// everything scales with the container. Offsets derived from the original comps.
import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { interactions } from "@/interactions/registry";
import { HeroFlicker, type Piece } from "@/components/hero-flicker";
import { FloatingNav } from "@/components/floating-nav";
import { interactionsMeta, SITE_URL } from "@/interactions/meta";

async function getStars(): Promise<number | null> {
  try {
    const r = await fetch("https://api.github.com/repos/sj9911/oiad", {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    return (await r.json()).stargazers_count ?? null;
  } catch {
    return null;
  }
}


const latest = interactionsMeta[interactionsMeta.length - 1];
const INSTALL = `npx shadcn@latest add ${SITE_URL}/r/${latest.slug}`;

const ART: Record<string, { x: number; y: number; w: number; h: number }> = {
  corners: { x: 0, y: 61.2, w: 738, h: 325 },
  globe: { x: 461.45, y: 0, w: 271, h: 271 },
  "top-icon": { x: 318.17, y: 115.73, w: 119, h: 34 },
  "one-hand": { x: 40.32, y: 94.23, w: 216, h: 83 },
  "a-hand": { x: 414.2, y: 265.97, w: 68, h: 89 },
  "day-hand": { x: 507.4, y: 262.46, w: 199, h: 119 },
};

async function readPiece(name: string): Promise<Piece> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "src", "v3", "pieces", `${name}.svg`),
    "utf-8",
  );
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100";
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .replaceAll('"black"', '"currentColor"')
    .replaceAll('"#002FFF"', '"var(--oiad-blue)"');
  return { viewBox, inner, ...ART[name] };
}

const HEADLINE =
  "font-bricolage absolute uppercase leading-none tracking-[-0.01em]";
// variable axes maxed out: full width, heaviest weight, largest optical size
const HEADLINE_STYLE = {
  fontVariationSettings: '"wght" 800, "wdth" 100, "opsz" 96',
} as const;

// per-letter inflate with scattered delays; golden-ratio hash keeps the
// "random" stable between server and client renders
function Letters({ text, base }: { text: string; base: number }) {
  return text.split("").map((ch, i) => {
    const delay = base + ((i * 0.618034) % 1) * 0.5;
    return (
      <span
        key={i}
        className="oiad-inflate"
        style={{ animationDelay: `${delay.toFixed(3)}s` }}
      >
        {ch === " " ? "\u00A0" : ch}
      </span>
    );
  });
}

export default async function V2() {
  const stars = await getStars();
  const p = Object.fromEntries(
    await Promise.all(
      Object.keys(ART).map(async (n) => [n, await readPiece(n)]),
    ),
  ) as Record<string, Piece>;

  return (
    <main className="min-h-svh">
      <FloatingNav
        stars={stars}
        badges={{ viewBox: p["top-icon"].viewBox, inner: p["top-icon"].inner }}
      />
      <header className="relative border-b border-hairline px-6 pb-24 pt-16">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)",
            backgroundSize: "18px 18px",
            maskImage:
              "linear-gradient(to bottom, black 55%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 55%, transparent 100%)",
          }}
        />
        <div className="mx-auto max-w-3xl">
        <h1 className="sr-only">One Interaction A Day</h1>
        <HeroFlicker
          statics={[p.corners]}
          globe={p.globe}
          badges={p["top-icon"]}
          copyText={INSTALL}
          slots={[
            {
              print: (
                <span
                  aria-hidden="true"
                  className={HEADLINE}
                  style={{ ...HEADLINE_STYLE, left: "5.9%", top: "23.0%", fontSize: "15.1cqw" }}
                >
                  <Letters text="One" base={0.55} />
                </span>
              ),
              hand: [p["one-hand"]],
            },
            {
              print: (
                <span
                  aria-hidden="true"
                  className={`${HEADLINE} text-right`}
                  style={{
                    ...HEADLINE_STYLE,
                    right: "5.4%",
                    top: "69.0%",
                    fontSize: "15.1cqw",
                    // per-letter spans lose the font's kerning pairs (D-A, A-Y),
                    // so this word gets extra negative tracking to compensate
                    letterSpacing: "-0.035em",
                  }}
                >
                  <Letters text="A Day" base={0.85} />
                </span>
              ),
              hand: [p["a-hand"], p["day-hand"]],
            },
          ]}
        >
          <span
            aria-hidden="true"
            className={HEADLINE}
            style={{ ...HEADLINE_STYLE, left: "6.4%", top: "45.8%", fontSize: "15.1cqw" }}
          >
            <Letters text="Interaction" base={0.7} />
          </span>
          <p
            className="font-bricolage oiad-rise absolute font-bold uppercase leading-[1.3]"
            style={{ left: "6.4%", top: "73.5%", fontSize: "2.2cqw", animationDelay: "1.4s" }}
          >
            A growing collection of
            <br />
            animated React components.
          </p>
        </HeroFlicker>
        </div>
      </header>

      {/* body: the gallery of days inside the rails */}
      <section className="relative mx-auto max-w-6xl border-x border-hairline">
        {/* node markers where the rails meet the header rule */}
        <span aria-hidden="true" className="absolute left-[-5.4px] top-[-5.4px] z-10 size-[11.8px] rounded-[2.5px] border border-[var(--hairline-solid)] bg-background" />
        <span aria-hidden="true" className="absolute right-[-5.4px] top-[-5.4px] z-10 size-[11.8px] rounded-[2.5px] border border-[var(--hairline-solid)] bg-background" />

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {interactions.map(({ slug, day, title, Component, StageComponent }) => (
            <div
              key={slug}
              className="group oiad-card rounded-2xl border border-hairline bg-surface p-2.5"
            >
              {/* interaction window */}
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-background px-10">
                {StageComponent ? <StageComponent /> : <Component />}
              </div>
              {/* text and cta: number for balance, arrow on hover */}
              <div className="font-bricolage flex items-center justify-between px-2 pb-1 pt-3">
                <span className="text-base font-semibold">{title}</span>
                <Link
                  href={`/day/${slug}`}
                  aria-label={`Open ${title}`}
                  className="relative flex items-center"
                >
                  <span className="text-base font-semibold tabular-nums text-muted transition-opacity duration-200 group-hover:opacity-0">
                    {String(day).padStart(3, "0")}
                  </span>
                  <span className="absolute right-0 flex text-[var(--oiad-blue)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <svg
                      viewBox="0 0 9 9"
                      className="h-[0.72em] w-auto fill-current"
                      aria-hidden="true"
                    >
                      <path d="M4.63636 8.267L3.75852 7.39768L6.38778 4.76842H0V3.49854H6.38778L3.75852 0.873535L4.63636 -4.45843e-05L8.76989 4.13348L4.63636 8.267Z" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          ))}
          {/* tomorrow's slot */}
          <div className="rounded-2xl border border-hairline bg-surface p-2.5">
            <div
              className="font-bricolage flex aspect-[4/3] items-center justify-center rounded-xl bg-background"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)",
                backgroundSize: "18px 18px",
              }}
            >
              <p className="text-sm font-semibold text-muted">
                Tomorrow, same place
              </p>
            </div>
            <div className="font-bricolage flex items-center justify-between px-2 pb-1 pt-3">
              <span className="text-base font-semibold text-muted">Tomorrow</span>
              <span className="text-base font-semibold tabular-nums text-muted">
                {String(interactions.length + 1).padStart(3, "0")}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
