"use client";

import * as React from "react";
import { motion } from "motion/react";
import { IconBrush, IconColorSwatch, IconTiltShift } from "@tabler/icons-react";
import { ScratchReveal, type ScratchRevealProps } from "@/interactions/scratch-reveal";
import { DialRow, rise, SegmentedRow, TunerHeader } from "./tuner-controls";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";

type Settings = Pick<ScratchRevealProps, "reward" | "label" | "code" | "accent" | "brushSize" | "coating" | "tilt">;
const DEFAULTS: Required<Settings> = { reward: "$299", label: "FOR YOU", code: "MAKE299", accent: "#00b7ae", brushSize: 52, coating: "silver", tilt: true };
const Ctx = React.createContext<{ settings: Required<Settings>; setSettings: React.Dispatch<React.SetStateAction<Required<Settings>>> } | null>(null);

export function ScratchRevealTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function ScratchRevealStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? DEFAULTS;
  return <ScratchReveal {...settings} className="aspect-[1.9/1] w-[min(92vw,760px)]" />;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block px-1 font-mono text-[9px] uppercase tracking-[.14em] text-muted">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} maxLength={label === "Reward" ? 10 : 18} className="h-10 w-full rounded-xl border border-hairline bg-black/[0.04] px-3 text-sm font-medium outline-none focus:border-[var(--oiad-blue)] focus:ring-2 focus:ring-[var(--oiad-blue)]/20 dark:bg-white/[0.07]" /></label>;
}

export function ScratchRevealTunerPanel() {
  const ctx = React.useContext(Ctx);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;
  React.useEffect(() => {
    tunerPrompt?.setPrompt(`You are editing my React 19 + Tailwind v4 app. Add the 1IAD "Scratch Reveal" interaction and use these exact selections.\n\n1. Install it:\n\nnpx shadcn@latest add https://1iad.com/r/scratch-reveal\n\n2. Render:\n\n<ScratchReveal\n  reward="${settings.reward}"\n  label="${settings.label}"\n  code="${settings.code}"\n  accent="${settings.accent}"\n  brushSize={${settings.brushSize}}\n  coating="${settings.coating}"\n  tilt={${settings.tilt}}\n/>\n\nPreserve the genuine canvas scratch surface, accessible pointer input, responsive layout, and reduced-motion fallback. Make the code changes directly and list the files you changed.`);
  }, [settings, tunerPrompt]);
  if (!ctx) return null;
  const set = <K extends keyof Required<Settings>>(key: K, value: Required<Settings>[K]) => ctx.setSettings((current) => ({ ...current, [key]: value }));
  return <div>
    <TunerHeader title="Scratch" blurb="Make the hidden thing feel worth uncovering." />
    <motion.section variants={rise} className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-5"><TextField label="Reward" value={settings.reward} onChange={(value) => set("reward", value)} /><TextField label="Label" value={settings.label} onChange={(value) => set("label", value.toUpperCase())} /><div className="col-span-2"><TextField label="Code" value={settings.code} onChange={(value) => set("code", value.toUpperCase())} /></div></motion.section>
    <motion.section variants={rise} className="mt-5 space-y-1.5 border-t border-hairline pt-5">
      <label className="flex h-11 items-center justify-between rounded-xl bg-black/[0.04] px-3.5 dark:bg-white/[0.07]"><span className="flex items-center gap-2.5 text-sm font-medium"><IconColorSwatch size={16} stroke={1.75} className="text-muted" />Accent colour</span><span className="flex items-center gap-2"><input type="text" value={settings.accent} onChange={(event) => set("accent", event.target.value)} className="w-20 bg-transparent text-right font-mono text-[12px] uppercase outline-none" aria-label="Accent colour hex value" /><input type="color" value={settings.accent} onChange={(event) => set("accent", event.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Choose accent colour" /></span></label>
      <DialRow icon={IconBrush} label="Scratch width" value={settings.brushSize} min={16} max={64} step={2} format={(value) => `${value}px`} onChange={(value) => set("brushSize", value)} />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.07]" role="group" aria-label="Scratch coating">{(["silver", "dark"] as const).map((coating) => <button key={coating} onClick={() => set("coating", coating)} aria-pressed={settings.coating === coating} className={`rounded-lg py-2 font-mono text-[11px] uppercase transition-colors ${settings.coating === coating ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}>{coating}</button>)}</div>
      <SegmentedRow icon={IconTiltShift} label="Hover tilt" id="scratch-tilt" on={settings.tilt} onChange={(value) => set("tilt", value)} />
    </motion.section>
    <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5"><TunerCopyPromptButton /><button onClick={() => ctx.setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button></motion.div>
  </div>;
}
