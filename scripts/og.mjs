// Per-day OG cards: screenshots each day page at 1200x630 with the page
// chrome hidden and the interaction woken up, into public/og/<slug>.png.
//
//   node scripts/og.mjs [slug ...]     (no args = every slug in meta.ts)
//
// Needs a running dev server (PORT env or 3000) and a local Chrome — uses
// the Playwright browser cache if present, otherwise the installed Chrome.

import { chromium } from "playwright-core";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import os from "os";

const PORT = process.env.PORT ?? "3000";
const BASE = `http://localhost:${PORT}`;

const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [...readFileSync("src/interactions/meta.ts", "utf8").matchAll(/slug: "([^"]+)"/g)].map(
      (m) => m[1],
    );

function findChromium() {
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) {
    const dirs = readdirSync(cache)
      .filter((d) => d.startsWith("chromium-"))
      .sort()
      .reverse();
    for (const d of dirs) {
      const exe = path.join(
        cache,
        d,
        "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      );
      if (existsSync(exe)) return { executablePath: exe };
    }
  }
  return { channel: "chrome" }; // fall back to installed Chrome
}

const browser = await chromium.launch(findChromium());
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});

for (const slug of slugs) {
  await page.goto(`${BASE}/day/${slug}`, { waitUntil: "networkidle" });
  // hide the back pill and the dev indicator
  await page.addStyleTag({
    content: `a[href="/"][class*="fixed"], nextjs-portal { display: none !important; }`,
  });
  // wake interactions that idle until tapped or hovered
  await page.mouse.move(600, 300, { steps: 12 });
  const summon = page.locator('button[aria-label="Summon intelligence"]');
  if (await summon.count()) {
    await summon.click();
    await page.waitForTimeout(1100); // fade-in, near peak of the breath
  } else {
    await page.waitForTimeout(800);
  }
  const out = `public/og/${slug}.png`;
  await page.screenshot({ path: out });
  console.log("wrote", out);
}

await browser.close();
