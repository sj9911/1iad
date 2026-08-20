// Loads the logo-intro glyph set from src/intro/ (server-side only).
// Glyph offsets were derived by matching path coordinates between each
// X-4.svg and Final.svg (247x92).
import { promises as fs } from "fs";
import path from "path";
import type { Glyph, Slot } from "@/components/logo-intro";

const INTRO_DIR = path.join(process.cwd(), "src", "intro");

const SLOTS = [
  { char: "1", x: 0, y: 3.399, w: 51, h: 78 },
  { char: "I", x: 54.055, y: 4.222, w: 53, h: 77 },
  {
    char: "A",
    x: 57.352,
    y: 0,
    w: 129,
    h: 92,
    // plain A variants render over the script A's core, not its full swoosh box
    flick: { x: 112, y: 4, w: 70, h: 79 },
  },
  { char: "D", x: 177.188, y: 4.222, w: 68, h: 77 },
];

async function readGlyph(file: string): Promise<Glyph> {
  const raw = await fs.readFile(path.join(INTRO_DIR, file), "utf-8");
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100";
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .replaceAll('"black"', '"currentColor"');
  return { viewBox, inner };
}

export async function getLogoSlots(): Promise<Slot[]> {
  return Promise.all(
    SLOTS.map(async ({ char, ...pos }) => ({
      ...pos,
      variants: await Promise.all(
        [1, 2, 3, 4].map((n) => readGlyph(`${char}-${n}.svg`)),
      ),
    })),
  );
}
