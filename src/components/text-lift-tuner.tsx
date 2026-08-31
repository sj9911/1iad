"use client";

import * as React from "react";
import { motion } from "motion/react";
import { IconAdjustments, IconCursorText, IconLetterSpacing, IconPalette, IconRefresh, IconTextSize, IconTypography } from "@tabler/icons-react";
import { TextLift } from "@/interactions/text-lift";
import { DialRow, rise, SegmentedRow, TunerHeader } from "./tuner-controls";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";

type Settings = {
  text: string;
  fontSize: number;
  restWeight: number;
  peakWeight: number;
  restWidth: number;
  peakWidth: number;
  lift: number;
  focus: number;
  letterSpacing: number;
  color: string;
  interactive: boolean;
};

const DEFAULTS: Settings = { text: "TOUCH", fontSize: 116, restWeight: 470, peakWeight: 820, restWidth: 108, peakWidth: 122, lift: 18, focus: 4.4, letterSpacing: 0, color: "#002fff", interactive: true };
const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function TextLiftTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function TextLiftStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? DEFAULTS;
  return <TextLift {...settings} className="!rounded-none !border-0 !bg-none !shadow-none" />;
}

function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="flex h-11 items-center justify-between rounded-xl bg-black/[0.04] px-3.5 dark:bg-white/[0.07]"><span className="flex items-center gap-2.5 text-sm font-medium"><IconPalette size={16} stroke={1.75} className="text-muted" />Text colour</span><span className="flex items-center gap-2"><input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="w-20 bg-transparent text-right font-mono text-[12px] uppercase outline-none" aria-label="Text colour hex value" /><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Choose text colour" /></span></label>;
}

export function TextLiftTunerPanel() {
  const ctx = React.useContext(Ctx);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;

  React.useEffect(() => {
    tunerPrompt?.setPrompt(`You are editing my React 19 + Tailwind v4 app. Add the 1IAD "Text Lift" interaction and use these exact selections.\n\n1. Install it:\n\nnpx shadcn@latest add https://1iad.com/r/text-lift\n\n2. Render:\n\n<TextLift\n  text="${settings.text}"\n  fontSize={${settings.fontSize}}\n  restWeight={${settings.restWeight}}\n  peakWeight={${settings.peakWeight}}\n  restWidth={${settings.restWidth}}\n  peakWidth={${settings.peakWidth}}\n  lift={${settings.lift}}\n  focus={${settings.focus}}\n  letterSpacing={${settings.letterSpacing}}\n  color="${settings.color}"\n  interactive={${settings.interactive}}\n/>\n\nKeep every letter on one baseline at rest. When the cursor passes through the word, nearby letters should lift, become heavier and wider, then settle with a soft spring. Keep it responsive and respect reduced-motion preferences. Make the code changes directly and list the files you changed.`);
  }, [settings, tunerPrompt]);

  if (!ctx) return null;
  const { setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  return <div>
    <TunerHeader title="Text Lift" blurb="Make the word your own. The baseline stays calm; your cursor does the lifting." />
    <motion.section variants={rise} className="mt-5 border-t border-hairline pt-5">
      <label className="block"><span className="mb-2 flex items-center gap-2 px-1 text-sm font-medium"><IconTypography size={16} stroke={1.75} className="text-muted" />Word</span><input value={settings.text} maxLength={14} onChange={(event) => set("text", event.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 14))} className="h-12 w-full rounded-xl border border-hairline bg-black/[0.04] px-3.5 font-mono text-lg tracking-[.08em] outline-none focus:border-[var(--oiad-blue)] focus:ring-2 focus:ring-[var(--oiad-blue)]/20 dark:bg-white/[0.07]" aria-label="Word" /></label><p className="mt-2 px-1 text-xs leading-relaxed text-muted">Up to 14 letters, numbers, or spaces.</p>
    </motion.section>
    <motion.section variants={rise} className="mt-6 space-y-1.5 border-t border-hairline pt-5">
      <DialRow icon={IconTextSize} label="Type scale" value={settings.fontSize} min={56} max={150} step={2} format={(value) => `${value}px`} onChange={(value) => set("fontSize", value)} />
      <DialRow icon={IconTypography} label="Rest weight" value={settings.restWeight} min={300} max={650} step={10} onChange={(value) => set("restWeight", value)} />
      <DialRow icon={IconAdjustments} label="Peak weight" value={settings.peakWeight} min={500} max={900} step={10} onChange={(value) => set("peakWeight", value)} />
      <DialRow icon={IconLetterSpacing} label="Rest width" value={settings.restWidth} min={75} max={130} step={1} format={(value) => `${value}%`} onChange={(value) => set("restWidth", value)} />
      <DialRow icon={IconLetterSpacing} label="Peak width" value={settings.peakWidth} min={80} max={151} step={1} format={(value) => `${value}%`} onChange={(value) => set("peakWidth", value)} />
      <DialRow icon={IconCursorText} label="Lift" value={settings.lift} min={0} max={42} step={1} format={(value) => `${value}px`} onChange={(value) => set("lift", value)} />
      <DialRow icon={IconAdjustments} label="Focus" value={settings.focus} min={2} max={7} step={0.1} format={(value) => `${value.toFixed(1)}×`} onChange={(value) => set("focus", value)} />
      <DialRow icon={IconLetterSpacing} label="Tracking" value={settings.letterSpacing} min={-0.05} max={0.14} step={0.01} format={(value) => `${value.toFixed(2)}em`} onChange={(value) => set("letterSpacing", value)} />
      <ColorField value={settings.color} onChange={(value) => set("color", value)} />
      <SegmentedRow icon={IconCursorText} label="Cursor response" id="text-lift-cursor" on={settings.interactive} onChange={(value) => set("interactive", value)} />
    </motion.section>
    <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5"><TunerCopyPromptButton /><button onClick={() => setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"><IconRefresh size={16} stroke={1.9} className="text-[var(--oiad-blue)]" />Reset defaults</button></motion.div>
  </div>;
}
