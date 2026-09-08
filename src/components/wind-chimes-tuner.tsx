"use client";

import * as React from "react";
import { motion } from "motion/react";
import { IconColorSwatch, IconMusic, IconSparkles, IconWind, IconResize } from "@tabler/icons-react";
import { WindChimes, type ChimePalette } from "@/interactions/wind-chimes";
import { DialRow, rise, SegmentedRow, TunerHeader } from "./tuner-controls";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";

type Settings = { palette: ChimePalette; breeze: number; windActive: boolean; tubeLength: number; glow: boolean; interactive: boolean; sound: boolean };
const DEFAULTS: Settings = { palette: "aurora", breeze: 1, windActive: true, tubeLength: 1, glow: true, interactive: true, sound: true };
const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function WindChimesTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function WindChimesStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? DEFAULTS;
  return <WindChimes {...settings} className="w-[min(92vw,540px)]" />;
}

export function WindChimesTunerPanel() {
  const ctx = React.useContext(Ctx);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;
  React.useEffect(() => {
    tunerPrompt?.setPrompt(`You are editing my React 19 + Tailwind v4 app. Add the 1IAD "Wind Chimes" interaction and use these exact selections.\n\n1. Install it:\n\nnpx shadcn@latest add https://1iad.com/r/wind-chimes\n\n2. Render:\n\n<WindChimes\n  palette="${settings.palette}"\n  breeze={${settings.breeze}}\n  windActive={${settings.windActive}}\n  tubeLength={${settings.tubeLength}}\n  glow={${settings.glow}}\n  interactive={${settings.interactive}}\n  sound={${settings.sound}}\n/>\n\nKeep the hanging cap, visible wind response, drag-responsive tubes, rich hover glow, responsive sizing, and reduced-motion support. Make the code changes directly and list the files you changed.`);
  }, [settings, tunerPrompt]);
  if (!ctx) return null;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => ctx.setSettings((current) => ({ ...current, [key]: value }));
  return <div>
    <TunerHeader title="Chimes" blurb="Tune the air, the metal, and how much the chimes answer back." />
    <motion.section variants={rise} className="mt-5 border-t border-hairline pt-5"><div className="mb-3 flex items-center gap-2 px-1 text-sm font-medium"><IconColorSwatch size={16} stroke={1.75} className="text-muted" />Colour story</div><div className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.07]" role="group" aria-label="Chime palette">{(["aurora", "coral", "silver"] as const).map((palette) => <button key={palette} onClick={() => set("palette", palette)} aria-pressed={settings.palette === palette} className={`rounded-lg py-2 font-mono text-[10px] uppercase transition-colors ${settings.palette === palette ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}>{palette}</button>)}</div></motion.section>
    <motion.section variants={rise} className="mt-5 space-y-1.5 border-t border-hairline pt-5">
      <SegmentedRow icon={IconWind} label="Wind" id="chime-wind" on={settings.windActive} onChange={(value) => set("windActive", value)} />
      <DialRow icon={IconWind} label="Wind speed" value={settings.breeze} min={0.2} max={2.5} step={0.1} format={(value) => `${value.toFixed(1)}×`} onChange={(value) => set("breeze", value)} />
      <DialRow icon={IconResize} label="Chime scale" value={settings.tubeLength} min={0.65} max={1.35} step={0.05} format={(value) => `${value.toFixed(2)}×`} onChange={(value) => set("tubeLength", value)} />
      <SegmentedRow icon={IconSparkles} label="Inner glow" id="chime-glow" on={settings.glow} onChange={(value) => set("glow", value)} />
      <SegmentedRow icon={IconWind} label="Drag to swing" id="chime-drag" on={settings.interactive} onChange={(value) => set("interactive", value)} />
      <SegmentedRow icon={IconMusic} label="Chime sound" id="chime-sound" on={settings.sound} onChange={(value) => set("sound", value)} />
    </motion.section>
    <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5"><TunerCopyPromptButton /><button onClick={() => ctx.setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button></motion.div>
  </div>;
}
