"use client";

// Floating elastic dock: each icon lives in its own container; the hover
// highlight springs between cells and stretches while traveling.

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GithubIcon,
  InformationCircleIcon,
  Moon02Icon,
  StarIcon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";

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

const SPARKS = [
  { angle: 20, dist: 22, size: 5 },
  { angle: 65, dist: 26, size: 4 },
  { angle: 110, dist: 21, size: 5 },
  { angle: 155, dist: 25, size: 4 },
  { angle: 200, dist: 22, size: 5 },
  { angle: 245, dist: 26, size: 4 },
  { angle: 290, dist: 21, size: 5 },
  { angle: 335, dist: 25, size: 4 },
];

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
      className="fixed bottom-6 left-1/2 z-50 origin-bottom -translate-x-1/2 scale-[1.15]"
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
                className="text-[var(--oiad-blue)] hover:underline"
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
          <span className="relative flex size-[18px] items-center justify-center">
            {/* github mark blurs away on hover */}
            <motion.span
              animate={
                hovered === 0
                  ? { opacity: 0, scale: 0.5, filter: "blur(5px)" }
                  : { opacity: 1, scale: 1, filter: "blur(0px)" }
              }
              transition={SPRING}
              className="flex"
            >
              <HugeiconsIcon icon={GithubIcon} size={18} strokeWidth={2} aria-hidden="true" />
            </motion.span>
            {/* golden star blurs in */}
            <motion.span
              animate={
                hovered === 0
                  ? { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }
                  : { opacity: 0, scale: 0.4, rotate: -40, filter: "blur(5px)" }
              }
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center text-[#CA8A04] dark:text-[#FBBF24]"
            >
              <span className="flex [filter:drop-shadow(0_0_5px_rgba(202,138,4,0.6))] dark:[filter:drop-shadow(0_0_5px_rgba(251,191,36,0.9))]">
                <HugeiconsIcon icon={StarIcon} size={17} strokeWidth={1.5} className="[&_path]:fill-current" aria-hidden="true" />
              </span>
            </motion.span>
            {/* one-shot sparkle burst */}
            <AnimatePresence>
              {hovered === 0 && (
                <span className="pointer-events-none absolute left-1/2 top-1/2">
                  {SPARKS.map((sp, i) => {
                    const rad = (sp.angle * Math.PI) / 180;
                    return (
                      <motion.span
                        key={i}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos(rad) * sp.dist,
                          y: Math.sin(rad) * sp.dist,
                          scale: 1,
                          opacity: 0,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                        className="absolute rounded-full bg-[#CA8A04] shadow-[0_0_6px_rgba(202,138,4,0.8)] dark:bg-[#FBBF24] dark:shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                        style={{ width: sp.size, height: sp.size }}
                      />
                    );
                  })}
                </span>
              )}
            </AnimatePresence>
          </span>
          {stars !== null && (
            <span
              className={`font-bricolage text-xs font-bold tabular-nums transition-colors duration-200 ${
                hovered === 0 ? "text-[#CA8A04] dark:text-[#FBBF24]" : ""
              }`}
            >
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
          <HugeiconsIcon icon={InformationCircleIcon} size={18} strokeWidth={2} aria-hidden="true" />
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
              {dark ? (
                <HugeiconsIcon icon={Moon02Icon} size={18} strokeWidth={2} aria-hidden="true" />
              ) : (
                <HugeiconsIcon icon={Sun03Icon} size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
        </Cell>
      </div>
    </nav>
  );
}
