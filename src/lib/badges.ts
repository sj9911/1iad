import { promises as fs } from "fs";
import path from "path";
import type { NavBadges } from "@/components/floating-nav";

// the 01 / heart / gear badge strip from the poster, prepped for currentColor
export async function getNavBadges(): Promise<NavBadges> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "src", "v3", "pieces", "top-icon.svg"),
    "utf-8",
  );
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100";
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .replaceAll('"black"', '"currentColor"')
    .replaceAll('"#002FFF"', '"var(--oiad-blue)"');
  return { viewBox, inner };
}
