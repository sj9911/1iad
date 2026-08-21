import type { MetadataRoute } from "next";
import { SITE_URL } from "@/interactions/meta";

// allow-all covers search engines and every AI crawler
// (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
