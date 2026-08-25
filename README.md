<div align="center">

# 1IAD — One Interaction A Day

**A free, open-source collection of Apple-grade animated React interactions — one new component every day.**

[1iad.com](https://1iad.com) · MIT licensed · installable in one command

![1IAD](https://1iad.com/opengraph-image.png)

</div>

## What this is

Every day, a new interaction ships as a single self-contained `.tsx` file — React + Tailwind CSS, at most one dependency (usually [Motion](https://motion.dev)). No config, no build step of its own, nothing to wire up. Grab the file or install it with the [shadcn](https://ui.shadcn.com) CLI, and it just works in your project.

## Install any component

Every day page on [1iad.com](https://1iad.com) has a copy-pasteable install command. The general form:

```bash
npx shadcn@latest add https://1iad.com/r/<slug>
```

For example, to grab the like button:

```bash
npx shadcn@latest add https://1iad.com/r/like-button
```

This drops one file into `components/1iad/` and installs whatever it depends on. That's it.

## The days so far

| # | Interaction | Try it | Install |
|---|---|---|---|
| 01 | Elastic Slider | [1iad.com/day/elastic-slider](https://1iad.com/day/elastic-slider) | `npx shadcn@latest add https://1iad.com/r/elastic-slider` |
| 02 | Like Button | [1iad.com/day/like-button](https://1iad.com/day/like-button) | `npx shadcn@latest add https://1iad.com/r/like-button` |
| 03 | Infinite Icon Grid | [1iad.com/day/infinite-icon-grid](https://1iad.com/day/infinite-icon-grid) | `npx shadcn@latest add https://1iad.com/r/infinite-icon-grid` |
| 04 | Apple Intelligence Glow | [1iad.com/day/intelligence-glow](https://1iad.com/day/intelligence-glow) | `npx shadcn@latest add https://1iad.com/r/intelligence-glow` |
| 05 | Proximity Grid | [1iad.com/day/proximity-grid](https://1iad.com/day/proximity-grid) | `npx shadcn@latest add https://1iad.com/r/proximity-grid` |
| 06 | Shader Button | [1iad.com/day/shader-button](https://1iad.com/day/shader-button) | `npx shadcn@latest add https://1iad.com/r/shader-button` |
| 07 | Vinyl Player | [1iad.com/day/vinyl-player](https://1iad.com/day/vinyl-player) | `npx shadcn@latest add https://1iad.com/r/vinyl-player` |

The full, always-current list is also machine-readable at [1iad.com/llms.txt](https://1iad.com/llms.txt) (source included at [1iad.com/llms-full.txt](https://1iad.com/llms-full.txt)).

## Running the site locally

```bash
npm install && npm run dev
```

## Adding a day

1. Create `src/interactions/<slug>.tsx` — self-contained: React + Tailwind (+ Motion if it needs springs).
2. Add its entry to `src/interactions/meta.ts`.
3. Map the slug to the component in `src/interactions/registry.tsx`.
4. `npm run dev`, open `/day/<slug>`, record the hero, post.

## License

MIT — see [LICENSE](LICENSE). Free to steal, no attribution required (though it's always appreciated).

Built in public by [Sunny Joshi](https://x.com/sunnyxdesign).
