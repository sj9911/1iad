export async function getStars(): Promise<number | null> {
  try {
    const r = await fetch("https://api.github.com/repos/sj9911/oiad", {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    return (await r.json()).stargazers_count ?? null;
  } catch {
    return null;
  }
}
