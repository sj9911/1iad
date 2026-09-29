"use client";

// Study tuner dock: a floating sliders button (bottom-right) that opens a
// 380px slide-over from the right — same mental model as DayShell's tuner,
// trimmed to what a study page needs.

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconAdjustmentsHorizontal, IconX } from "@tabler/icons-react";

export function StudyTunerDock({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open live tuner"
        className="fixed bottom-6 right-6 z-50 flex size-13 items-center justify-center rounded-2xl border border-hairline bg-surface text-foreground shadow-[0_14px_34px_rgba(0,0,0,.14)] transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <IconAdjustmentsHorizontal size={20} stroke={1.8} className="text-[var(--oiad-blue)]" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              aria-label="Close tuner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[55] cursor-default bg-black/20"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", duration: 0.55, bounce: 0 }}
              className="fixed right-0 top-0 z-[60] h-svh w-[380px] max-w-[92vw] overflow-y-auto border-l border-hairline bg-surface px-6 pb-10 shadow-[-24px_0_60px_rgba(0,0,0,.12)]"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close tuner"
                className="absolute right-5 top-5 grid size-9 place-items-center rounded-xl border border-hairline text-muted transition-colors hover:text-foreground"
              >
                <IconX size={16} stroke={1.8} />
              </button>
              {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
