"use client";

// Day-page layout: a details sidebar slides in from the left and takes 40% of
// the width, squeezing the interactive stage into the remaining 60%.
// The sidebar reads like a swiss spec sheet for the day: a giant blue day
// number, poster-set title, then label/value rows separated by hairlines.

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import {
  IconBounceRight,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
  IconCheck,
  IconCopy,
  IconHandClick,
  IconHandMove,
  IconInfinity,
  IconNorthStar,
  IconSparkles,
  IconVolume,
  type Icon,
} from "@tabler/icons-react";
import {
  FloatingNav,
  GlassLayers,
  tick,
  type NavBadges,
  type NavDay,
} from "./floating-nav";

const TAG_ICONS: Record<string, Icon> = {
  Drag: IconHandMove,
  Tap: IconHandClick,
  Sound: IconVolume,
  Spring: IconBounceRight,
  Particles: IconSparkles,
  Infinite: IconInfinity,
  Glow: IconNorthStar,
};

const DEP_NAMES: Record<string, string> = { motion: "Motion" };

// emil rules: transform/opacity only, strong ease-out, small travel
const EASE = [0.23, 1, 0.32, 1] as const;

// same maxed variable axes as the home hero headline
const POSTER = {
  fontVariationSettings: '"wght" 800, "wdth" 100, "opsz" 96',
} as const;

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[104px_1fr] gap-x-8 border-t border-hairline py-7">
      <dt className="pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export function DayShell({
  stars,
  badges,
  day,
  tuner,
  children,
}: {
  stars: number | null;
  badges: NavBadges;
  day: NavDay;
  // optional live tuning panel; slides in from the right like the sidebar
  tuner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [tuneOpen, setTuneOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduced = useReducedMotion();
  const MORPH = reduced
    ? ({ duration: 0 } as const)
    : ({ type: "spring", duration: 0.5, bounce: 0 } as const);

  const list = {
    hidden: {},
    show: {
      transition: reduced ? {} : { staggerChildren: 0.06, delayChildren: 0.15 },
    },
  };
  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: reduced
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };

  function copyPrompt() {
    navigator.clipboard.writeText(day.prompt).catch(() => {});
    tick();
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }

  const stack = [
    "React 19",
    "Tailwind v4",
    ...day.dependencies.map((d) => DEP_NAMES[d] ?? d),
  ];

  return (
    <div className="flex min-h-svh">
      <motion.aside
        initial={false}
        animate={{ width: open ? "40vw" : "0vw" }}
        transition={MORPH}
        className={`sticky top-0 h-svh shrink-0 overflow-hidden bg-surface ${
          open ? "border-r border-hairline" : ""
        }`}
        aria-hidden={!open}
      >
        {/* glass close pill, aligned with the fixed Back pill */}
        <button
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-8 top-8 z-10 rounded-2xl border border-hairline p-1.5"
        >
          <GlassLayers />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-linear-to-t from-surface/20 to-surface/75"
          />
          <span className="relative flex h-[42px] w-[46px] items-center justify-center rounded-xl transition-colors duration-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.09]">
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        </button>

        {/* frosted strip behind the button row: stepped blur compounding
            toward the top, fading fill downward (same recipe as the dock) */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 z-[5] h-[104px] overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-full backdrop-blur-[8px]" />
          <span className="absolute inset-x-0 top-0 h-4/5 backdrop-blur-[4px]" />
          <span className="absolute inset-x-0 top-0 h-3/5 backdrop-blur-[6px]" />
          <span className="absolute inset-x-0 top-0 h-2/5 backdrop-blur-[8px]" />
          <span className="absolute inset-x-0 top-0 h-1/5 backdrop-blur-[10px]" />
          <span className="absolute inset-0 bg-linear-to-b from-surface/75 to-surface/20" />
        </span>

        {/* full-width rule under the button row */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-[104px] z-[5] border-t border-hairline"
        />

        {/* fixed-width inner so text doesn't reflow while the panel animates */}
        <motion.div
          variants={list}
          initial="hidden"
          animate={open ? "show" : "hidden"}
          className="font-bricolage h-full w-[40vw] overflow-y-auto px-8 pt-[104px]"
        >
          {/* the poster block: giant blue day number, headline-set title */}
          <motion.header variants={rise} className="pt-10">
            <p
              aria-hidden="true"
              className="text-[clamp(26px,2.5vw,34px)] leading-none tracking-tight tabular-nums text-[var(--oiad-blue)]"
              style={POSTER}
            >
              {String(day.day).padStart(3, "0")}
            </p>
            <h2
              className="mt-5 max-w-[10ch] text-[clamp(44px,4.6vw,62px)] uppercase leading-[1.0] tracking-[-0.01em]"
              style={POSTER}
            >
              {day.title}
            </h2>
            <p className="mb-10 mt-6 max-w-md text-lg leading-relaxed text-muted">
              {day.description}
            </p>
          </motion.header>

          <dl>
            <motion.div variants={rise}>
              <Row label="Feels like">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {day.tags.map((t, i) => {
                    const TagIcon = TAG_ICONS[t];
                    return (
                      <React.Fragment key={t}>
                        {i > 0 && (
                          <span aria-hidden="true" className="text-lg font-semibold text-[var(--oiad-blue)]">
                            /
                          </span>
                        )}
                        <span className="flex items-center gap-2 text-lg font-semibold uppercase tracking-tight">
                          {TagIcon && <TagIcon size={19} stroke={2} aria-hidden="true" />}
                          {t}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </Row>
            </motion.div>

            <motion.div variants={rise}>
              <Row label="Built with">
                <p className="text-lg font-semibold tracking-tight">
                  {stack.map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && (
                        <span aria-hidden="true" className="mx-3 text-[var(--oiad-blue)]">
                          /
                        </span>
                      )}
                      {s}
                    </React.Fragment>
                  ))}
                </p>
              </Row>
            </motion.div>

            <motion.div variants={rise}>
              <Row label="Steal it">
                <code className="block max-w-md break-all rounded-xl border border-hairline bg-background p-4 font-mono text-[13px] leading-relaxed">
                  {day.install}
                </code>
                <button
                  onClick={copyPrompt}
                  className="mt-3 flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-foreground text-base font-semibold text-background transition-opacity duration-150 hover:opacity-85"
                >
                  {copied ? (
                    <IconCheck size={18} stroke={2.5} aria-hidden="true" />
                  ) : (
                    <IconCopy size={18} stroke={2} aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy AI prompt"}
                </button>
                <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                  One self-contained file. Paste the prompt into your AI agent
                  and it does the rest.
                </p>
              </Row>
            </motion.div>

            <motion.div variants={rise}>
              <Row label="Good to know">
                <ul className="max-w-md space-y-3 text-base leading-relaxed">
                  {[
                    "No config. Nothing to set up beyond Tailwind.",
                    "Respects prefers-reduced-motion out of the box.",
                    "Sound and haptics only fire after a user gesture.",
                  ].map((point) => (
                    <li key={point} className="flex gap-3">
                      <span aria-hidden="true" className="font-semibold text-[var(--oiad-blue)]">
                        /
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Row>
            </motion.div>

            <motion.div variants={rise} className="pb-32">
              <Row label="Credits">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-base leading-relaxed">
                    Built in public by{" "}
                    <span className="font-semibold">Sunny Joshi</span>
                    <span className="block text-muted">
                      MIT licensed. Free to steal.
                    </span>
                  </p>
                  <div className="flex items-center gap-1">
                    {[
                      { href: "http://x.com/sunnyxdesign", label: "X", Ic: IconBrandX },
                      { href: "https://www.linkedin.com/in/thesunnyjoshi/", label: "LinkedIn", Ic: IconBrandLinkedin },
                      { href: "https://github.com/sj9911/1iad", label: "GitHub", Ic: IconBrandGithub },
                    ].map(({ href, label, Ic }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="flex size-10 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-black/[0.06] hover:text-foreground dark:hover:bg-white/[0.09]"
                      >
                        <Ic size={20} stroke={1.75} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </Row>
            </motion.div>
          </dl>
        </motion.div>
      </motion.aside>

      <div className="relative min-w-0 flex-1">{children}</div>

      {tuner && (
        <motion.aside
          initial={false}
          animate={{ width: tuneOpen ? 380 : 0 }}
          transition={MORPH}
          className={`sticky top-0 h-svh shrink-0 overflow-hidden bg-surface ${
            tuneOpen ? "border-l border-hairline" : ""
          }`}
          aria-hidden={!tuneOpen}
        >
          {/* fixed-width inner so controls don't reflow while animating;
              same staggered rise choreography as the sidebar */}
          <motion.div
            variants={list}
            initial="hidden"
            animate={tuneOpen ? "show" : "hidden"}
            className="h-full w-[380px] overflow-y-auto px-6 py-8"
          >
            {tuner}
          </motion.div>
        </motion.aside>
      )}

      <FloatingNav
        stars={stars}
        badges={badges}
        alwaysBadges
        day={day}
        dayOpen={open}
        onDayOpenChange={setOpen}
        tuneOpen={tuneOpen}
        onTuneOpenChange={tuner ? setTuneOpen : undefined}
      />
    </div>
  );
}
