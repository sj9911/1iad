# 1IAD — One Interaction A Day

One tiny, Apple-grade UI interaction every day. Live on the site, open source, copy-pasteable. Built in public.

- Every interaction is a single self-contained file in `src/interactions/`
- Grab any of them: `npx shadcn@latest add <site>/r/<slug>`
- AI agents: read `/llms.txt`

## Adding a day

1. Create `src/interactions/<slug>.tsx` (self-contained: React + Tailwind + motion only)
2. Add its entry to `src/interactions/meta.ts`
3. Map slug → component in `src/interactions/registry.tsx`
4. `npm run dev`, open `/day/<slug>`, record the hero, post

## Run

```bash
npm install && npm run dev
```

MIT.
