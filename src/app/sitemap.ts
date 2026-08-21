import type { MetadataRoute } from "next";
import { interactionsMeta, SITE_URL } from "@/interactions/meta";

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = interactionsMeta[interactionsMeta.length - 1];
  return [
    {
      url: SITE_URL,
      lastModified: new Date(latest.date),
      changeFrequency: "daily",
      priority: 1,
    },
    ...interactionsMeta.map((i) => ({
      url: `${SITE_URL}/day/${i.slug}`,
      lastModified: new Date(i.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
