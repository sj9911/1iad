"use client";

import * as React from "react";
import { motion } from "motion/react";
import { IconBalloon, IconCursorText, IconRefresh, IconWind } from "@tabler/icons-react";
import { BalloonNumbers } from "@/interactions/balloon-numbers";
import { DialRow, rise, TunerHeader } from "./tuner-controls";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";

type Settings = {
  value: string;
  balloonSize: number;
  windStrength: number;
  repelRadius: number;
  threadLength: number;
};

const DEFAULTS: Settings = { value: "2026", balloonSize: 74, windStrength: 1, repelRadius: 170, threadLength: 74 };
const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function BalloonNumbersTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function BalloonNumbersStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? DEFAULTS;
  return <BalloonNumbers {...settings} />;
}

export function BalloonNumbersTunerPanel() {
  const ctx = React.useContext(Ctx);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;

  React.useEffect(() => {
    tunerPrompt?.setPrompt(`You are editing my React 19 + Tailwind v4 app. Add the 1IAD "Balloon Numbers" interaction and use these exact selections.\n\n1. Install it:\n\nnpx shadcn@latest add https://1iad.com/r/balloon-numbers\n\n2. Render:\n\n<BalloonNumbers\n  value="${settings.value}"\n  maxDigits={12}\n  balloonSize={${settings.balloonSize}}\n  windStrength={${settings.windStrength}}\n  repelRadius={${settings.repelRadius}}\n  threadLength={${settings.threadLength}}\n/>\n\nKeep each digit as a balloon, its string attached to the balloon, cursor repulsion, soft collisions, changing wind bursts, and responsive layout. Make the code changes directly and list the files you changed.`);
  }, [settings, tunerPrompt]);

  if (!ctx) return null;
  const { setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  return <div>
    <TunerHeader title="Balloons" blurb="Type a number. Each digit gets its own balloon, string, and a little room to drift." />
    <motion.section variants={rise} className="mt-5 border-t border-hairline pt-5">
      <label className="block"><span className="mb-2 flex items-center gap-2 px-1 text-sm font-medium"><IconCursorText size={16} stroke={1.75} className="text-muted" />Number</span><input inputMode="numeric" value={settings.value} maxLength={12} onChange={(event) => set("value", event.target.value.replace(/\D/g, "").slice(0, 12))} className="h-12 w-full rounded-xl border border-hairline bg-black/[0.04] px-3.5 font-mono text-lg tracking-[0.16em] outline-none focus:border-[var(--oiad-blue)] focus:ring-2 focus:ring-[var(--oiad-blue)]/20 dark:bg-white/[0.07]" /></label>
      <p className="mt-2 px-1 text-xs leading-relaxed text-muted">Up to 12 digits. Each one becomes a balloon.</p>
    </motion.section>
    <motion.section variants={rise} className="mt-6 space-y-1.5 border-t border-hairline pt-5">
      <DialRow icon={IconBalloon} label="Balloon size" value={settings.balloonSize} min={48} max={112} step={2} format={(value) => `${value}px`} onChange={(value) => set("balloonSize", value)} />
      <DialRow icon={IconWind} label="Wind" value={settings.windStrength} min={0.2} max={2.4} step={0.1} format={(value) => `${value.toFixed(1)}×`} onChange={(value) => set("windStrength", value)} />
      <DialRow icon={IconCursorText} label="Repel radius" value={settings.repelRadius} min={80} max={320} step={5} format={(value) => `${value}px`} onChange={(value) => set("repelRadius", value)} />
      <DialRow icon={IconBalloon} label="Thread length" value={settings.threadLength} min={36} max={132} step={2} format={(value) => `${value}px`} onChange={(value) => set("threadLength", value)} />
    </motion.section>
    <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5"><TunerCopyPromptButton /><button onClick={() => setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"><IconRefresh size={16} stroke={1.9} className="text-[var(--oiad-blue)]" />Reset defaults</button></motion.div>
  </div>;
}
