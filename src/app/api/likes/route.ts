// Global like counter backed by Upstash Redis (Vercel marketplace integration).
// GET → { count } · POST { delta: 1 | -1 } → { count }
// Without the env vars (local dev) both return { count: null } and the button
// falls back to its seeded local count.

const URL_ =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const KEY = "oiad:likes";

async function redis(cmd: string): Promise<unknown> {
  const r = await fetch(`${URL_}/${cmd}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

export async function GET() {
  if (!URL_) return Response.json({ count: null });
  try {
    return Response.json({ count: Number(await redis(`get/${KEY}`)) || 0 });
  } catch {
    return Response.json({ count: null });
  }
}

export async function POST(req: Request) {
  if (!URL_) return Response.json({ count: null });
  try {
    const delta = (await req.json().catch(() => ({})))?.delta === -1 ? -1 : 1;
    // ponytail: no per-user dedupe server-side (localStorage only) — a demo
    // counter isn't worth auth/fingerprinting; add IP rate limits if abused
    let count = Number(await redis(`incrby/${KEY}/${delta}`));
    if (count < 0) {
      count = 0;
      await redis(`set/${KEY}/0`);
    }
    return Response.json({ count });
  } catch {
    return Response.json({ count: null });
  }
}
