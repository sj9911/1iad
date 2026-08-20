// Homepage redesign in progress. Current home stays at / until this replaces it.
// Piece offsets were derived by matching path coordinates against the full
// compositions (1.svg / 2.svg, 738x386).
import { promises as fs } from "fs";
import path from "path";
import { HeroFlicker, type Piece } from "@/components/hero-flicker";

const PIECES: Record<string, { x: number; y: number; w: number; h: number }> = {
  corners: { x: 0, y: 61.2, w: 738, h: 325 },
  globe: { x: 461.45, y: 0, w: 271, h: 271 },
  "top-icon": { x: 318.17, y: 115.73, w: 119, h: 34 },
  interaction: { x: 47.08, y: 185.47, w: 646, h: 76 },
  copy: { x: 47, y: 285.51, w: 256, h: 30 },
  steal: { x: 47.9, y: 336.51, w: 115, h: 11 },
  one: { x: 43.58, y: 97.47, w: 202, h: 76 },
  "one-hand": { x: 40.32, y: 94.23, w: 216, h: 83 },
  "a-day": { x: 410.88, y: 275, w: 282, h: 73 },
  "a-hand": { x: 409.16, y: 265.97, w: 68, h: 89 },
  "day-hand": { x: 502.4, y: 262.46, w: 199, h: 119 },
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
  return { viewBox, inner, ...PIECES[name] };
}

export default async function V2() {
  const p = Object.fromEntries(
    await Promise.all(
      Object.keys(PIECES).map(async (n) => [n, await readPiece(n)]),
    ),
  ) as Record<string, Piece>;

  return (
    <main className="min-h-svh">
      <header className="mx-auto max-w-3xl px-6 pt-14">
        <HeroFlicker
          statics={[
            p.corners,
            p.globe,
            p["top-icon"],
            p.interaction,
            p.copy,
            p.steal,
          ]}
          slots={[
            { print: [p.one], hand: [p["one-hand"]] },
            { print: [p["a-day"]], hand: [p["a-hand"], p["day-hand"]] },
          ]}
        />
      </header>
    </main>
  );
}
