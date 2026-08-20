"use client";

// Day-page layout: a details sidebar slides in from the left and takes 40% of
// the width, squeezing the interactive stage into the remaining 60%.
// Sidebar content follows the home header's swiss language: hairline rules,
// node squares at intersections, numbered uppercase section labels, ample air.

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
};

const DEP_NAMES: Record<string, string> = { motion: "Motion" };

// emil rules: transform/opacity only, strong ease-out, small travel
const EASE = [0.23, 1, 0.32, 1] as const;

function Label({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
      <span className="tabular-nums">{String(n).padStart(2, "0")}</span>
      <span aria-hidden="true" className="mx-2">—</span>
      {children}
    </p>
  );
}

function Rule() {
  return (
    <span aria-hidden="true" className="-mx-8 my-8 block border-t border-hairline" />
  );
}

export function DayShell({
  stars,
  badges,
  day,
  children,
}: {
  stars: number | null;
  badges: NavBadges;
  day: NavDay;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduced = useReducedMotion();
  const MORPH = reduced
    ? ({ duration: 0 } as const)
    : ({ type: "spring", duration: 0.5, bounce: 0 } as const);

  const list = {
    hidden: {},
    show: {
      transition: reduced ? {} : { staggerChildren: 0.05, delayChildren: 0.15 },
    },
  };
  const rise = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: reduced
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
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
    "Tailwind CSS v4",
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

        {/* full-width rule under the button row, node squares at its ends */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-[104px] border-t border-hairline"
        />
        <span aria-hidden="true" className="absolute left-8 top-[98.6px] z-10 size-[11.8px] rounded-[2.5px] border border-[var(--hairline-solid)] bg-background" />
        <span aria-hidden="true" className="absolute right-8 top-[98.6px] z-10 size-[11.8px] rounded-[2.5px] border border-[var(--hairline-solid)] bg-background" />

        {/* fixed-width inner so text doesn't reflow while the panel animates */}
        <motion.div
          variants={list}
          initial="hidden"
          animate={open ? "show" : "hidden"}
          className="font-bricolage h-full w-[40vw] overflow-y-auto p-8 pt-[124px]"
        >
          <motion.header variants={rise} className="flex items-baseline justify-between gap-4">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              {day.title}
            </h2>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-muted">
              {String(day.day).padStart(3, "0")}
            </p>
          </motion.header>

          <motion.p variants={rise} className="mt-4 max-w-md text-base leading-relaxed text-muted">
            {day.description}
          </motion.p>

          <motion.section variants={rise}>
            <Rule />
            <Label n={1}>Interaction</Label>
            <div className="mt-4 flex flex-wrap gap-2">
              {day.tags.map((t) => {
                const TagIcon = TAG_ICONS[t];
                return (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-sm font-semibold"
                  >
                    {TagIcon && <TagIcon size={15} stroke={2} aria-hidden="true" />}
                    {t}
                  </span>
                );
              })}
            </div>
          </motion.section>

          <motion.section variants={rise}>
            <Rule />
            <Label n={2}>Based on</Label>
            <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-sm font-semibold">
              {stack.map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true" className="text-muted">·</span>}
                  {s}
                </span>
              ))}
            </div>
          </motion.section>

          <motion.section variants={rise}>
            <Rule />
            <Label n={3}>Install</Label>
            <code className="mt-4 block max-w-md break-all rounded-xl border border-hairline bg-background p-3.5 font-mono text-xs leading-relaxed">
              {day.install}
            </code>
            <button
              onClick={copyPrompt}
              className="mt-3 flex h-11 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity duration-150 hover:opacity-85"
            >
              {copied ? (
                <IconCheck size={16} stroke={2.5} aria-hidden="true" />
              ) : (
                <IconCopy size={16} stroke={2} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy AI prompt"}
            </button>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Or paste the prompt into your AI agent and let it do the work.
            </p>
          </motion.section>

          <motion.section variants={rise}>
            <Rule />
            <Label n={4}>Good to know</Label>
            <ul className="mt-4 max-w-md space-y-2.5 text-sm leading-relaxed text-muted">
              {[
                "One self-contained file. No config, no setup beyond Tailwind.",
                "Respects prefers-reduced-motion out of the box.",
                "Sound and haptics only fire after a user gesture.",
              ].map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] size-[6px] shrink-0 rounded-[1.5px] border border-[var(--hairline-solid)] bg-background"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </motion.section>

          {/* extra bottom padding keeps credits clear of the fixed dock */}
          <motion.section variants={rise} className="pb-32">
            <Rule />
            <Label n={5}>Credits</Label>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm leading-relaxed text-muted">
                Designed &amp; built in public by{" "}
                <span className="font-semibold text-foreground">Sunny Joshi</span>
                <br />
                MIT licensed. Free to steal.
              </p>
              <div className="flex items-center gap-1">
                {[
                  { href: "http://x.com/sunnyxdesign", label: "X", Ic: IconBrandX },
                  { href: "https://www.linkedin.com/in/thesunnyjoshi/", label: "LinkedIn", Ic: IconBrandLinkedin },
                  { href: "https://github.com/sj9911/oiad", label: "GitHub", Ic: IconBrandGithub },
                ].map(({ href, label, Ic }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-black/[0.06] hover:text-foreground dark:hover:bg-white/[0.09]"
                  >
                    <Ic size={18} stroke={1.75} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </motion.section>
        </motion.div>
      </motion.aside>

      <div className="relative min-w-0 flex-1">{children}</div>

      <FloatingNav
        stars={stars}
        badges={badges}
        alwaysBadges
        day={day}
        dayOpen={open}
        onDayOpenChange={setOpen}
      />
    </div>
  );
}
