"use client";

import * as React from "react";
import { motion } from "motion/react";
import { IconArrowsHorizontal, IconBalloon, IconColorSwatch, IconCursorText, IconFeather, IconHandMove, IconRefresh, IconWind } from "@tabler/icons-react";
import { BalloonNumbers } from "@/interactions/balloon-numbers";
import { DialRow, rise, SegmentedRow, TunerHeader } from "./tuner-controls";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";

type Settings = {
  value: string;
  balloonSize: number;
  windStrength: number;
  repelRadius: number;
  threadLength: number;
  clusterSpacing: number;
  floatiness: number;
  stringColor: string;
  interactive: boolean;
};

const DEFAULTS: Settings = { value: "2026", balloonSize: 74, windStrength: 1, repelRadius: 170, threadLength: 160, clusterSpacing: 1.14, floatiness: 1, stringColor: "#69501f", interactive: true };
const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function BalloonNumbersTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function BalloonNumbersStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? DEFAULTS;
  return <BalloonNumbers {...settings} />;
}

function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="flex h-11 items-center justify-between rounded-xl bg-black/[0.04] px-3.5 dark:bg-white/[0.07]"><span className="flex items-center gap-2.5 text-sm font-medium"><IconColorSwatch size={16} stroke={1.75} className="text-muted" />String colour</span><span className="flex items-center gap-2"><input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="w-20 bg-transparent text-right font-mono text-[12px] uppercase outline-none" aria-label="String colour hex value" /><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Choose string colour" /></span></label>;
}

export function BalloonNumbersTunerPanel() {
  const ctx = React.useContext(Ctx);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;

  React.useEffect(() => {
    tunerPrompt?.setPrompt(`You are editing my React 19 + Tailwind v4 app. Add the 1IAD "Balloon Numbers" interaction and use these exact selections.\n\n1. Install it:\n\nnpx shadcn@latest add https://1iad.com/r/balloon-numbers\n\n2. Render:\n\n<BalloonNumbers\n  value="${settings.value}"\n  maxDigits={12}\n  balloonSize={${settings.balloonSize}}\n  windStrength={${settings.windStrength}}\n  repelRadius={${settings.repelRadius}}\n  threadLength={${settings.threadLength}}\n  clusterSpacing={${settings.clusterSpacing}}\n  floatiness={${settings.floatiness}}\n  stringColor="${settings.stringColor}"\n  interactive={${settings.interactive}}\n/>\n\nKeep each digit as a separate balloon, preserve the fixed-length floor tethers, centred evenly spaced anchors, soft foil-balloon collisions, calm intervals between sub-second gusts, responsive layout, and reduced-motion support. Make the code changes directly and list the files you changed.`);
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
      <DialRow icon={IconFeather} label="Floatiness" value={settings.floatiness} min={0.2} max={2.2} step={0.1} format={(value) => `${value.toFixed(1)}×`} onChange={(value) => set("floatiness", value)} />
      <DialRow icon={IconCursorText} label="Repel radius" value={settings.repelRadius} min={80} max={320} step={5} format={(value) => `${value}px`} onChange={(value) => set("repelRadius", value)} />
      <DialRow icon={IconBalloon} label="Thread length" value={settings.threadLength} min={80} max={240} step={2} format={(value) => `${value}px`} onChange={(value) => set("threadLength", value)} />
      <DialRow icon={IconArrowsHorizontal} label="Bouquet spread" value={settings.clusterSpacing} min={0.75} max={1.8} step={0.05} format={(value) => `${value.toFixed(2)}×`} onChange={(value) => set("clusterSpacing", value)} />
      <ColorField value={settings.stringColor} onChange={(value) => set("stringColor", value)} />
      <SegmentedRow icon={IconHandMove} label="Cursor repel" id="balloon-cursor-repel" on={settings.interactive} onChange={(value) => set("interactive", value)} />
    </motion.section>
    <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5"><TunerCopyPromptButton /><button onClick={() => setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"><IconRefresh size={16} stroke={1.9} className="text-[var(--oiad-blue)]" />Reset defaults</button></motion.div>
  </div>;
}
