"use client";

// Day-page layout: a details sidebar slides in from the left and takes 40% of
// the width, squeezing the interactive stage into the remaining 60%.

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  FloatingNav,
  tick,
  type NavBadges,
  type NavDay,
} from "./floating-nav";

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

  function copyPrompt() {
    navigator.clipboard.writeText(day.prompt).catch(() => {});
    tick();
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }

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
        {/* fixed-width inner so text doesn't reflow while the panel animates */}
        <div className="font-bricolage h-full w-[40vw] overflow-y-auto p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold leading-tight">
                {day.title}
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-muted">
                {String(day.day).padStart(3, "0")}
              </p>
            </div>
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-black/[0.06] hover:text-foreground dark:hover:bg-white/[0.09]"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            {day.description}
          </p>
          <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-muted">
            Install
          </p>
          <code className="mt-2 block max-w-md break-all rounded-xl border border-hairline bg-background p-3.5 font-mono text-xs leading-relaxed">
            {day.install}
          </code>
          <button
            onClick={copyPrompt}
            className="mt-3 flex h-11 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity duration-150 hover:opacity-85"
          >
            <HugeiconsIcon
              icon={copied ? Tick02Icon : Copy01Icon}
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            {copied ? "Copied" : "Copy AI prompt"}
          </button>
        </div>
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
