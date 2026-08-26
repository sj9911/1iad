// shadcn-compatible registry: `npx shadcn add <site>/r/<slug>` installs the component.
import { promises as fs } from "fs";
import path from "path";
import { interactionsMeta } from "@/interactions/meta";

export function generateStaticParams() {
  return interactionsMeta.map(({ slug }) => ({ slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const item = interactionsMeta.find((i) => i.slug === slug);
  if (!item) return new Response("Not found", { status: 404 });

  const content = await fs.readFile(
    path.join(process.cwd(), "src/interactions", item.file),
    "utf-8",
  );
  const assetFiles = await Promise.all(
    (item.assets ?? []).map(async (asset) => ({
      path: `public/${asset}`,
      type: "registry:file",
      target: `~/public/${asset}`,
      content: await fs.readFile(path.join(process.cwd(), "public", asset), "utf-8"),
    })),
  );

  return Response.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.slug,
    type: "registry:component",
    title: `1IAD Day ${item.day} — ${item.title}`,
    description: item.description,
    dependencies: item.dependencies,
    files: [
      {
        path: `components/1iad/${item.file}`,
        type: "registry:component",
        content,
      },
      ...assetFiles,
    ],
  });
}
