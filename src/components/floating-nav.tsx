"use client";

// Floating elastic dock: each icon lives in its own container; the hover
// highlight springs between cells and stretches while traveling.

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

let audioCtx: AudioContext | null = null;
function tick() {
  try {
    audioCtx ??= new AudioContext();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch {}
}

const SPRING = { type: "spring", stiffness: 400, damping: 26 } as const;

function Cell({
  children,
  hovered,
  onHover,
  ...rest
}: {
  children: React.ReactNode;
  hovered: boolean;
  onHover: () => void;
} & React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      transition={SPRING}
      onMouseEnter={onHover}
      className="relative flex h-11 items-center gap-1.5 rounded-xl px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
      {...rest}
    >
      {hovered && (
        <motion.span
          layoutId="nav-glow"
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="absolute inset-0 rounded-xl bg-black/[0.06] dark:bg-white/[0.09]"
        />
      )}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
}

export function FloatingNav({ stars }: { stars: number | null }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [info, setInfo] = React.useState(false);
  const [dark, setDark] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    tick();
    const next = !document.documentElement.classList.contains("dark");
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  }

  return (
    <nav
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      onMouseLeave={() => setHovered(null)}
    >
      <AnimatePresence>
        {info && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={SPRING}
            className="font-bricolage absolute bottom-full left-1/2 mb-3 w-64 -translate-x-1/2 rounded-2xl border border-hairline bg-surface p-4 text-sm leading-relaxed shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
          >
            <p className="font-semibold">One Interaction A Day</p>
            <p className="mt-1 text-muted">
              A daily interaction design practice. Every component is live,
              open source, and free to steal.
            </p>
            <p className="mt-2 text-muted">
              by{" "}
              <a
                href="https://x.com/sunnyxdesign"
                target="_blank"
                rel="noreferrer"
                className="text-[#002FFF] hover:underline"
              >
                Sunny Joshi
              </a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1 rounded-2xl border border-hairline bg-surface/80 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <Cell
          hovered={hovered === 0}
          onHover={() => setHovered(0)}
          aria-label="OIAD on GitHub"
          onClick={() => window.open("https://github.com/sj9911/oiad", "_blank")}
        >
          <svg viewBox="0 0 16 16" className="size-[18px] fill-current" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          {stars !== null && (
            <span className="font-bricolage flex items-center gap-1 text-xs font-bold tabular-nums">
              <svg viewBox="0 0 24 24" className="size-3 fill-current" aria-hidden="true">
                <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.65 1.13 6.58L12 17.57l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5Z" />
              </svg>
              {stars}
            </span>
          )}
        </Cell>

        <Cell
          hovered={hovered === 1}
          onHover={() => setHovered(1)}
          aria-label="About OIAD"
          aria-expanded={info}
          onClick={() => setInfo((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="size-[18px] fill-none stroke-current stroke-[1.8]" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 11v5" />
            <circle cx="12" cy="8" r="0.5" className="fill-current" />
          </svg>
        </Cell>

        <Cell
          hovered={hovered === 2}
          onHover={() => setHovered(2)}
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={dark ? "moon" : "sun"}
              initial={{ rotate: -60, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 60, scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="flex"
            >
              <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden="true">
                {dark ? (
                  <path d="M21.53 15.93a.75.75 0 0 0-.87-.36 8 8 0 0 1-9.98-9.98.75.75 0 0 0-.93-.93A9.5 9.5 0 1 0 21.9 16.8a.75.75 0 0 0-.37-.87Z" />
                ) : (
                  <path d="M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 2Zm0 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 20Zm10-8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 22 12ZM4.25 12a.75.75 0 0 1-.75.75H2a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm14.7-6.95a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM7.17 16.83a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm11.78 2.12a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06ZM7.17 7.17a.75.75 0 0 1-1.06 0L5.05 6.11a.75.75 0 0 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Z" />
                )}
              </svg>
            </motion.span>
          </AnimatePresence>
        </Cell>
      </div>
    </nav>
  );
}
