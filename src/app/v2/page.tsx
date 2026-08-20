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
              viewBox="0 0 9 11"
              className="h-[0.72em] w-auto fill-current"
              aria-hidden="true"
            >
              <path d="M-0.00178717 6.53646C0.409076 6.63606 0.832389 6.77302 1.26815 6.94732C1.71637 7.12163 2.12723 7.33951 2.50074 7.60097C2.87425 7.87488 3.16061 8.19859 3.35982 8.5721L3.43452 8.5721L3.22909 -2.33472e-07L5.35811 -1.4041e-07L5.15268 8.5721L5.22738 8.5721C5.48884 8.18614 5.8001 7.84998 6.16116 7.56362C6.53467 7.28971 6.92686 7.05938 7.33772 6.87262C7.76104 6.69831 8.1719 6.54891 8.57031 6.42441L8.57031 8.83356C8.05985 8.93316 7.56805 9.07634 7.09494 9.2631C6.62182 9.4623 6.19851 9.69886 5.825 9.97277C5.46394 10.2591 5.17758 10.6015 4.96592 10.9999L3.63995 10.9999C3.31624 10.4272 2.8369 9.96032 2.20193 9.59926C1.56696 9.25065 0.83239 8.99541 -0.00178727 8.83356L-0.00178717 6.53646Z" />
            </svg>
          </p>
        </HeroFlicker>
      </header>
    </main>
  );
}
