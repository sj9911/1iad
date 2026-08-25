// llms.txt — slim index for AI agents. Full inlined source lives at /llms-full.txt
// (kept separate so this index doesn't grow ~12.5KB/day as new interactions ship).
import { interactionsMeta, SITE_URL } from "@/interactions/meta";

export async function GET() {
  const sections = interactionsMeta.map((item) =>
    [
      `## Day ${item.day} — ${item.title}`,
      item.description,
      `Page: ${SITE_URL}/day/${item.slug}`,
      `Install: \`npx shadcn@latest add ${SITE_URL}/r/${item.slug}\``,
    ].join("\n"),
  );

  const body = [
    "# 1IAD — One Interaction A Day",
    "One tiny, Apple-grade React UI interaction per day. Each is a single self-contained .tsx file (React + Tailwind + motion). MIT licensed — copy freely, or install via the shadcn command shown per component.",
    `Full inlined source for every component: ${SITE_URL}/llms-full.txt`,
    ...sections,
  ].join("\n\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
