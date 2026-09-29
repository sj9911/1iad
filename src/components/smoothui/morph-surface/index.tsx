"use client";

import SmoothButton from "@/components/smoothui/smooth-button";
import { cx } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React from "react";
import SiriOrb from "../siri-orb";
import { useClickOutside } from "./use-click-outside";

const SPEED = 1;
const SUCCESS_DURATION = 1500;
const DOCK_HEIGHT = 44;
const FEEDBACK_BORDER_RADIUS = 14;
const DOCK_BORDER_RADIUS = 20;
const SPRING_STIFFNESS = 550;
const SPRING_DAMPING = 45;
const SPRING_MASS = 0.7;
const CLOSE_DELAY = 0.08;

interface FooterContext {
  closeFeedback: () => void;
  openFeedback: () => void;
  showFeedback: boolean;
  success: boolean;
}

const FooterContext = React.createContext({} as FooterContext);
const useFooter = () => React.useContext(FooterContext);

export function MorphSurface() {
  const rootRef = React.useRef<HTMLDivElement>(null);

  const feedbackRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const closeFeedback = React.useCallback(() => {
    setShowFeedback(false);
    feedbackRef.current?.blur();
  }, []);

  const openFeedback = React.useCallback(() => {
    setShowFeedback(true);
    setTimeout(() => {
      feedbackRef.current?.focus();
    });
  }, []);

  const onFeedbackSuccess = React.useCallback(() => {
    closeFeedback();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, SUCCESS_DURATION);
  }, [closeFeedback]);

  useClickOutside(rootRef, closeFeedback);

  const context = React.useMemo(
    () => ({
      closeFeedback,
      openFeedback,
      showFeedback,
      success,
    }),
    [showFeedback, success, openFeedback, closeFeedback]
  );

  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: FEEDBACK_HEIGHT,
        width: FEEDBACK_WIDTH,
      }}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                borderRadius: showFeedback
                  ? FEEDBACK_BORDER_RADIUS
                  : DOCK_BORDER_RADIUS,
                height: showFeedback ? FEEDBACK_HEIGHT : DOCK_HEIGHT,
                width: showFeedback ? FEEDBACK_WIDTH : "auto",
              }
        }
        className={cx(
          "relative bottom-8 z-3 flex flex-col items-center overflow-hidden border border-hairline bg-surface/95 shadow-[0_24px_80px_rgba(0,0,0,.16)] backdrop-blur-2xl max-sm:bottom-5"
        )}
        data-footer
        initial={false}
        ref={rootRef}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                damping: SPRING_DAMPING,
                delay: showFeedback ? 0 : CLOSE_DELAY,
                duration: 0.25,
                mass: SPRING_MASS,
                stiffness: SPRING_STIFFNESS / SPEED,
                type: "spring" as const,
              }
        }
      >
        <FooterContext.Provider value={context}>
          <Dock />
          <Feedback onSuccess={onFeedbackSuccess} ref={feedbackRef} />
        </FooterContext.Provider>
      </motion.div>
    </div>
  );
}

function Dock() {
  const { showFeedback, openFeedback } = useFooter();
  const shouldReduceMotion = useReducedMotion();
  return (
    <footer className={`relative z-10 mt-auto flex h-[44px] w-full select-none items-center justify-center whitespace-nowrap ${showFeedback ? "border-t border-hairline bg-surface/90" : ""}`}>
      <div className="relative flex w-full items-center justify-center gap-2 px-3 max-sm:h-10 max-sm:px-2">
        <div className="flex w-fit items-center gap-2">
          <AnimatePresence mode="wait">
            {!showFeedback ? (
              <motion.div
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0 }
                }
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                key="siri-orb"
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }
                }
              >
                <SiriOrb
                  colors={{
                    bg: "oklch(22.64% 0 0)",
                  }}
                  size="24px"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <SmoothButton
          className={`flex h-fit justify-center rounded-full px-2 py-0.5! ${showFeedback ? "pointer-events-none absolute left-1/2 -translate-x-1/2" : ""}`}
          onClick={openFeedback}
          type="button"
          variant="ghost"
        >
          <span className="truncate">Leave a spark</span>
        </SmoothButton>
      </div>
    </footer>
  );
}

const FEEDBACK_WIDTH = 360;
const FEEDBACK_HEIGHT = 200;

function Feedback({
  ref,
  onSuccess,
}: {
  ref: React.Ref<HTMLTextAreaElement>;
  onSuccess: () => void;
}) {
  const { closeFeedback, showFeedback } = useFooter();
  const shouldReduceMotion = useReducedMotion();
  const submitRef = React.useRef<HTMLButtonElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSuccess();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      closeFeedback();
    }
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      submitRef.current?.click();
    }
  }

  return (
    <form
      className="absolute inset-0"
      onSubmit={onSubmit}
      style={{
        height: FEEDBACK_HEIGHT,
        pointerEvents: showFeedback ? "all" : "none",
        width: FEEDBACK_WIDTH,
      }}
    >
      <AnimatePresence>
        {showFeedback ? (
          <motion.div
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            className="flex h-full flex-col"
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0 }
            }
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    damping: SPRING_DAMPING,
                    duration: 0.25,
                    mass: SPRING_MASS,
                    stiffness: SPRING_STIFFNESS / SPEED,
                    type: "spring" as const,
                  }
            }
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2">
              <SiriOrb colors={{ bg: "oklch(22.64% 0 0)" }} size="24px" />
              <p className="select-none text-sm font-medium text-foreground">Spark note</p>
              <button
                className="flex cursor-pointer select-none items-center justify-center gap-1 justify-self-end rounded-lg bg-transparent text-center text-foreground transition-transform duration-150 ease-out active:scale-[.97]"
                ref={submitRef}
                type="submit"
              >
                <Kbd>⌘</Kbd>
                <Kbd className="w-fit">Enter</Kbd>
              </button>
            </div>
            <textarea
              className="mx-2 mb-11 min-h-0 w-[calc(100%-1rem)] flex-1 resize-none scroll-py-2 rounded-xl border border-hairline bg-black/[.035] p-4 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/20 dark:bg-white/[.055]"
              name="message"
              onKeyDown={onKeyDown}
              placeholder="What should tomorrow’s interaction feel like?"
              ref={ref}
              required
              spellCheck={false}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

function Kbd({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <kbd
      className={cx(
        "flex h-6 w-fit items-center justify-center rounded-sm border bg-secondary px-[6px] font-sans text-foreground",
        className
      )}
    >
      {children}
    </kbd>
  );
}

// Add default export for lazy loading
export default MorphSurface;
