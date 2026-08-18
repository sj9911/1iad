// llms.txt — full index + source for AI agents and vibe coders.
import { promises as fs } from "fs";
import path from "path";
import { interactionsMeta, SITE_URL } from "@/interactions/meta";

export async function GET() {
  const sections = await Promise.all(
    interactionsMeta.map(async (item) => {
      const content = await fs.readFile(
        path.join(process.cwd(), "src/interactions", item.file),
        "utf-8",
      );
      return [
        `## Day ${item.day} — ${item.title}`,
        item.description,
        `Install: \`npx shadcn@latest add ${SITE_URL}/r/${item.slug}\``,
        `Dependencies: ${item.dependencies.join(", ")} (plus Tailwind CSS)`,
        "```tsx",
        content.trim(),
        "```",
      ].join("\n\n");
    }),
  );

  const body = [
    "# OIAD — One Interaction A Day",
    "One tiny, Apple-grade React UI interaction per day. Each is a single self-contained .tsx file (React + Tailwind + motion). MIT licensed — copy freely, or install via the shadcn command shown per component.",
    ...sections,
  ].join("\n\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
