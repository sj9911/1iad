"use client";

// Floating elastic dock: each icon lives in its own container; the hover
// highlight springs between cells and stretches while traveling.

import * as React from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  GithubIcon,
  InformationCircleIcon,
  Moon02Icon,
  SidebarRightIcon,
  SlidersHorizontalIcon,
  StarIcon,
  Sun03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

let audioCtx: AudioContext | null = null;
export function thump() {
  try {
    audioCtx ??= new AudioContext();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch {}
}
export function tick() {
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

// gradual blur without mask-image (masked backdrop-filter is broken in
// Chromium): stacked top-anchored strips whose blurs compound upward,
// ~8px at the bottom edge rising to ~17px at the top
export function GlassLayers() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden rounded-2xl"
    >
      <span className="absolute inset-x-0 top-0 h-full backdrop-blur-[8px]" />
      <span className="absolute inset-x-0 top-0 h-4/5 backdrop-blur-[4px]" />
      <span className="absolute inset-x-0 top-0 h-3/5 backdrop-blur-[6px]" />
      <span className="absolute inset-x-0 top-0 h-2/5 backdrop-blur-[8px]" />
      <span className="absolute inset-x-0 top-0 h-1/5 backdrop-blur-[10px]" />
    </span>
  );
}
function BadgeButton({
  badges,
  onClick,
}: {
  badges: { viewBox: string; inner: string };
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="1IAD badges"
      className="relative flex h-[50px] items-center rounded-xl px-3.5 transition-colors duration-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.09] [&_.oiad-gear]:cursor-pointer [&_.oiad-heartbtn]:cursor-pointer"
    >
      <svg
        viewBox={badges.viewBox}
        className="h-[25px] w-auto"
        dangerouslySetInnerHTML={{ __html: badges.inner }}
      />
    </button>
  );
}

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
  tip,
  ...rest
}: {
  children: React.ReactNode;
  hovered: boolean;
  onHover: () => void;
  // hover tooltip naming the action; shows after a beat, above the dock
  tip?: string;
} & React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.88 }}
      transition={SPRING}
      onMouseEnter={onHover}
      className="relative flex h-[50px] items-center gap-2 rounded-xl px-3.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
      {...rest}
    >
      <AnimatePresence>
        {hovered && tip && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 5, x: "-50%", scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              x: "-50%",
              scale: 1,
              transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 },
            }}
            exit={{
              opacity: 0,
              y: 4,
              x: "-50%",
              scale: 0.97,
              transition: { duration: 0.12, ease: "easeIn" },
            }}
            className="font-bricolage pointer-events-none absolute -top-9 left-1/2 z-20 whitespace-nowrap rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
          >
            {tip}
          </motion.span>
        )}
      </AnimatePresence>
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

export type NavBadges = { viewBox: string; inner: string };
export type NavDay = {
  title: string;
  day: number;
  description: string;
  prompt: string;
  install: string;
  tags: string[];
  dependencies: string[];
};

// shared glass shell for every container in the nav row
function GlassPill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative rounded-2xl border border-hairline p-1.5 ${className}`}>
      <GlassLayers />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl bg-linear-to-t from-surface/20 to-surface/75"
      />
      <div className="relative flex items-center gap-1">{children}</div>
    </div>
  );
}

export function FloatingNav({
  stars,
  badges,
  alwaysBadges = false,
  day,
  dayOpen = false,
  onDayOpenChange,
  tuneOpen = false,
  onTuneOpenChange,
}: {
  stars: number | null;
  badges?: NavBadges;
  // day pages have no scroll, so the badge pill shows from the start
  alwaysBadges?: boolean;
  day?: NavDay;
  // sidebar state is owned by DayShell, which renders the sidebar in-flow
  dayOpen?: boolean;
  onDayOpenChange?: (open: boolean) => void;
  // days with a live tuning panel (owned by DayShell, like the sidebar)
  tuneOpen?: boolean;
  onTuneOpenChange?: (open: boolean) => void;
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [info, setInfo] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [dark, setDark] = React.useState<boolean | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const gearAngle = React.useRef(0);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduced = useReducedMotion();
  // zero-bounce spring: the dock re-centers without overshoot
  const MORPH = reduced
    ? ({ duration: 0 } as const)
    : ({ type: "spring", duration: 0.5, bounce: 0 } as const);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const onScroll = () => setScrolled(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function badgesClick(e: React.MouseEvent) {
    const t = e.target as Element;
    const root = e.currentTarget as HTMLElement;
    if (t.closest(".oiad-heartbtn")) {
      thump();
      const heart = root.querySelector<SVGPathElement>(".oiad-heartbeat");
      if (heart) {
        heart.classList.remove("oiad-heart-pop");
        void heart.getBoundingClientRect();
        heart.classList.add("oiad-heart-pop");
        heart.addEventListener(
          "animationend",
          () => heart.classList.remove("oiad-heart-pop"),
          { once: true },
        );
      }
    } else if (t.closest(".oiad-gear")) {
      gearAngle.current += 60;
      root
        .querySelector<SVGGElement>(".oiad-gear")
        ?.style.setProperty("transform", `rotate(${gearAngle.current}deg)`);
      toggleTheme();
    }
  }

  function toggleTheme() {
    tick();
    const next = !document.documentElement.classList.contains("dark");
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  }

  function copyPrompt() {
    if (!day) return;
    navigator.clipboard.writeText(day.prompt).catch(() => {});
    tick();
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <nav
      // flexbox centering, not translate: a CSS transform on this ancestor
      // corrupts the dock's FLIP layout measurements (dock jumps to center
      // instead of gliding when the pill unmounts)
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      onMouseLeave={() => setHovered(null)}
    >
      {/* on narrow phones the day-page dock (badges + controls + title +
          actions) is wider than the viewport; this becomes a horizontally
          scrollable safety net so every control stays reachable rather than
          clipping off both edges. Inert (no scroll) whenever content fits. */}
      <div className="pointer-events-auto relative max-w-full overflow-x-auto overscroll-x-contain sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

      <div className="relative">
        {/* LayoutGroup: the dock is a sibling of the pill's AnimatePresence and
            doesn't re-render when the pill is finally removed — without the
            group its FLIP never measures and it snaps to center */}
        <LayoutGroup>
        <div className="relative flex items-center gap-2 sm:gap-3.5">
        {/* badge pill: blurs in from behind the dock on scroll, dissolves in
            place on the way up. Sync mode (not popLayout): the pill must keep
            its flex slot while exiting — popping it to absolute made it ride
            the wrapper's instant re-center and visibly jump. The dock glides
            back to center via its layout spring after the dissolve finishes. */}
        <AnimatePresence initial={false}>
          {(scrolled || alwaysBadges) && badges && (
            <motion.div
              key="badge-pill"
              initial={{ opacity: 0, x: 48, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)", transition: MORPH }}
              exit={{
                opacity: 0,
                filter: "blur(10px)",
                transition: reduced
                  ? { duration: 0 }
                  : { duration: 0.8, ease: "easeInOut" },
              }}
              className="relative z-0 rounded-2xl border border-hairline p-1.5"
            >
              <GlassLayers />
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-linear-to-t from-surface/20 to-surface/75"
              />
              <BadgeButton badges={badges} onClick={badgesClick} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* day pages: sidebar trigger + copy the AI install prompt */}
        {day && (
          <GlassPill>
            <Cell
              hovered={hovered === 3}
              onHover={() => setHovered(3)}
              aria-label="Interaction details"
              tip="Interaction details"
              aria-expanded={dayOpen}
              onClick={() => onDayOpenChange?.(!dayOpen)}
            >
              <HugeiconsIcon icon={SidebarRightIcon} size={21} strokeWidth={2} aria-hidden="true" />
            </Cell>
            {onTuneOpenChange && (
              <Cell
                hovered={hovered === 5}
                onHover={() => setHovered(5)}
                aria-label="Tune the interaction"
              tip="Live tuner"
                aria-expanded={tuneOpen}
                onClick={() => onTuneOpenChange(!tuneOpen)}
              >
                <HugeiconsIcon icon={SlidersHorizontalIcon} size={21} strokeWidth={2} aria-hidden="true" />
              </Cell>
            )}
            <Cell
              hovered={hovered === 4}
              onHover={() => setHovered(4)}
              aria-label="Copy AI prompt"
              tip="Copy AI install prompt"
              onClick={copyPrompt}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? "tick" : "copy"}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="flex"
                >
                  {copied ? (
                    <HugeiconsIcon icon={Tick02Icon} size={21} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <HugeiconsIcon icon={Copy01Icon} size={21} strokeWidth={2} aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
            </Cell>
          </GlassPill>
        )}

        {/* day pages: interaction name + padded day number — decorative
            (the title lives in the sidebar/h1 too), so it drops on narrow
            phones where the dock has no room to spare */}
        {day && (
          <GlassPill className="hidden sm:block">
            <span className="font-bricolage flex h-[50px] items-center px-3.5 text-base font-semibold">
              {day.title}
            </span>
            <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-hairline" />
            <span className="font-bricolage flex h-[50px] items-center px-3.5 text-base font-semibold tabular-nums text-muted">
              {String(day.day).padStart(3, "0")}
            </span>
          </GlassPill>
        )}

        <motion.div
          layout
          transition={MORPH}
          className="relative z-10 flex items-center gap-1 rounded-2xl border border-hairline p-1.5"
        >
          <GlassLayers />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-linear-to-t from-surface/20 to-surface/75"
          />
          {/* about panel: anchored to this pill so it rises above the ⓘ */}
          <AnimatePresence>
            {info && (
              <motion.div
                initial={{ opacity: 0, y: 8, x: "-50%", scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                exit={{ opacity: 0, y: 8, x: "-50%", scale: 0.95 }}
                transition={SPRING}
                className="font-bricolage absolute bottom-full left-1/2 mb-3 w-64 rounded-2xl border border-hairline bg-surface p-4 text-sm leading-relaxed shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
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
        <Cell
          hovered={hovered === 0}
          onHover={() => setHovered(0)}
          aria-label="1IAD on GitHub"
              tip="Star on GitHub"
          onClick={() => window.open("https://github.com/sj9911/1iad", "_blank")}
        >
          <span className="relative flex size-[21px] items-center justify-center">
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
              <HugeiconsIcon icon={GithubIcon} size={21} strokeWidth={2} aria-hidden="true" />
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
                <HugeiconsIcon icon={StarIcon} size={20} strokeWidth={1.5} className="[&_path]:fill-current" aria-hidden="true" />
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
          {/* 0 stars reads worse than no number at all — show it once it's real */}
          {stars !== null && stars > 0 && (
            <span
              className={`font-bricolage text-sm font-bold tabular-nums transition-colors duration-200 ${
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
          aria-label="About 1IAD"
              tip="About 1IAD"
          aria-expanded={info}
          onClick={() => setInfo((v) => !v)}
        >
          <HugeiconsIcon icon={InformationCircleIcon} size={21} strokeWidth={2} aria-hidden="true" />
        </Cell>

        <Cell
          hovered={hovered === 2}
          onHover={() => setHovered(2)}
          aria-label="Toggle dark mode"
              tip="Switch theme"
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
                <HugeiconsIcon icon={Moon02Icon} size={21} strokeWidth={2} aria-hidden="true" />
              ) : (
                <HugeiconsIcon icon={Sun03Icon} size={21} strokeWidth={2} aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
        </Cell>
        </motion.div>
        </div>
        </LayoutGroup>
      </div>
      </div>
    </nav>
  );
}
