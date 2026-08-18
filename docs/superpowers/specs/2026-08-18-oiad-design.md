# OIAD — One Interaction A Day (design)

2026-08-18 · approved by Sunny in chat

## What

A build-in-public project: one tiny UI interaction per day, screen-recorded from the live site and posted on social media. Visitors interact with every component live; devs and AI agents can take the code.

## Decisions

- **Stack**: Next.js + Tailwind v4 + Motion, deployed on Vercel.
- **One self-contained `.tsx` file per day** in `src/interactions/`. Adding a day = component file + one entry in `meta.ts` + one line in `registry.tsx`.
- **Distribution**: shadcn-compatible registry at `/r/<slug>` (`npx shadcn add <url>`), plus `/llms.txt` with full source for AI agents. No npm package (maybe later).
- **Audio** via Web Audio API inside each component (differentiator; "sound on" posts). **Haptics** via `navigator.vibrate` — Android-only bonus.
- **Style**: STIX Two Text serif (display/editorial) meets Apple HIG — apple.com palette (`#f5f5f7`, `#1d1d1f`, `#6e6e73`, `#0071e3`), white rounded-[28px] tiles, springs, light-only.
- **Recording**: each day page's full-height hero is the stage — OIAD wordmark + day number in the corners brand every clip. No separate recording mode.

## Day 1

Elastic slider: iOS-style, stretches past its ends (tanh-dampened overflow → scaleX/scaleY from opposite end), rising tick pitch every 10 steps, Android buzz.

## Deferred (future "days" = content)

Custom domain · dark mode · syntax highlighting · npm package · Claude skill · tags/search · About page.
