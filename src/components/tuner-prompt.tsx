"use client";

import * as React from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { motion } from "motion/react";

type TunerPromptContext = {
  prompt: string | null;
  setPrompt: React.Dispatch<React.SetStateAction<string | null>>;
};

const TunerPromptContext = React.createContext<TunerPromptContext | null>(null);

export function TunerPromptProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = React.useState<string | null>(null);
  return <TunerPromptContext.Provider value={{ prompt, setPrompt }}>{children}</TunerPromptContext.Provider>;
}

export function useTunerPrompt() {
  return React.useContext(TunerPromptContext);
}

export function TunerCopyPromptButton() {
  const tunerPrompt = useTunerPrompt();
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  if (!tunerPrompt?.prompt) return null;
  const prompt = tunerPrompt.prompt;

  function copy() {
    navigator.clipboard.writeText(prompt).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      onClick={copy}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-base font-semibold text-background transition-opacity duration-150 hover:opacity-85"
    >
      <motion.span
        key={copied ? "check" : "copy"}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="flex"
      >
        {copied ? <IconCheck size={18} stroke={2.5} aria-hidden="true" /> : <IconCopy size={18} stroke={2} aria-hidden="true" />}
      </motion.span>
      {copied ? "Copied" : "Copy AI prompt"}
    </button>
  );
}
