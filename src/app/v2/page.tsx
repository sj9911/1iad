// Homepage redesign in progress. Current home stays at / until this replaces it.
// Layout lives in the poster's 738x386 coordinate space; text sizes use cqw so
// everything scales with the container. Offsets derived from the original comps.
import { promises as fs } from "fs";
import path from "path";
import { HeroFlicker, type Piece } from "@/components/hero-flicker";

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
    .replaceAll('"black"', '"currentColor"');
  return { viewBox, inner, ...ART[name] };
}

const HEADLINE =
  "font-bricolage absolute uppercase leading-none tracking-[-0.01em]";
// variable axes maxed out: full width, heaviest weight, largest optical size
const HEADLINE_STYLE = {
  fontVariationSettings: '"wght" 800, "wdth" 100, "opsz" 96',
} as const;

export default async function V2() {
  const p = Object.fromEntries(
    await Promise.all(
      Object.keys(ART).map(async (n) => [n, await readPiece(n)]),
    ),
  ) as Record<string, Piece>;

  return (
    <main className="min-h-svh">
      <header className="mx-auto max-w-3xl px-6 pt-14">
        <h1 className="sr-only">One Interaction A Day</h1>
        <HeroFlicker
          statics={[p.corners, p.globe, p["top-icon"]]}
          slots={[
            {
              print: (
                <span
                  aria-hidden="true"
                  className={HEADLINE}
                  style={{ ...HEADLINE_STYLE, left: "5.9%", top: "23.0%", fontSize: "15.1cqw" }}
                >
                  One
                </span>
              ),
              hand: [p["one-hand"]],
            },
            {
              print: (
                <span
                  aria-hidden="true"
                  className={`${HEADLINE} text-right`}
                  style={{ ...HEADLINE_STYLE, right: "5.4%", top: "69.0%", fontSize: "15.1cqw" }}
                >
                  A&nbsp;Day
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
            Interaction
          </span>
          <p
            className="font-bricolage absolute font-bold uppercase leading-[1.3]"
            style={{ left: "6.4%", top: "73.5%", fontSize: "2.2cqw" }}
          >
            A growing collection of
            <br />
            animated React components.
          </p>
          <p
            className="font-bricolage absolute flex items-center gap-[0.8cqw] font-bold uppercase text-[#002FFF]"
            style={{ left: "6.5%", top: "86.6%", fontSize: "2.2cqw" }}
          >
            Free to steal
            <svg
              viewBox="0 0 11 12"
              className="h-[0.72em] w-auto fill-current"
              aria-hidden="true"
            >
              <path d="M6.27246 7.5957L9.10645 4.76172L10.4639 6.08691L5.23633 11.3066L0 6.08691L1.35742 4.76172L4.19238 7.59668V0H6.27246V7.5957Z" />
            </svg>
          </p>
        </HeroFlicker>
      </header>
    </main>
  );
}
