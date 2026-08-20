// Homepage redesign in progress. Current home stays at / until this replaces it.
import { promises as fs } from "fs";
import path from "path";
import { HeroFlicker, type HeroArt } from "@/components/hero-flicker";

async function readArt(file: string): Promise<HeroArt> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "src", "v3", file),
    "utf-8",
  );
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 738 386";
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .replaceAll('"black"', '"currentColor"');
  return { viewBox, inner };
}

export default async function V2() {
  const art = (await Promise.all([readArt("1.svg"), readArt("2.svg")])) as [
    HeroArt,
    HeroArt,
  ];

  return (
    <main className="min-h-svh">
      <header className="mx-auto max-w-3xl px-6 pt-14">
        <HeroFlicker art={art} />
      </header>
    </main>
  );
}
