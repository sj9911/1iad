"use client";

import * as React from "react";
import { motion } from "motion/react";
import { IconBolt, IconImageInPicture, IconRoute2, IconSparkles, IconVolume, IconWand } from "@tabler/icons-react";
import { DialRow, rise, SegmentedRow, TunerHeader } from "./tuner-controls";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";
import { DEFAULT_INPUT_ASSETS, DEFAULT_OUTPUT_ASSETS, TransformFlow, type TransformPathStyle } from "@/interactions/transform-flow";

type Settings = {
  inputAssets: string[];
  outputAssets: string[];
  pathStyle: TransformPathStyle;
  duration: number;
  particleCount: number;
  chargeDuration: number;
  maxSpeed: number;
  showGuides: boolean;
  sound: boolean;
};

const DEFAULTS: Settings = {
  inputAssets: DEFAULT_INPUT_ASSETS,
  outputAssets: DEFAULT_OUTPUT_ASSETS,
  pathStyle: "curved",
  duration: 11.4,
  particleCount: 24,
  chargeDuration: 10,
  maxSpeed: 33,
  showGuides: true,
  sound: true,
};

const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function TransformFlowTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<Settings>(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function TransformFlowStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? DEFAULTS;
  return <TransformFlow className="w-[min(92vw,1040px)]" {...settings} />;
}

function AssetField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-muted">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-hairline bg-black/[0.04] px-2.5 text-center font-mono text-sm outline-none focus:border-[var(--oiad-blue)] dark:bg-white/[0.07]" /></label>;
}

export function TransformFlowTunerPanel() {
  const ctx = React.useContext(Ctx);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;

  React.useEffect(() => {
    tunerPrompt?.setPrompt(`You are editing my React 19 + Tailwind v4 app. Add the 1IAD "Transform Flow" interaction, then apply the exact settings I chose.\n\n1. Install it:\nnpx shadcn@latest add https://1iad.com/r/transform-flow\n\n2. Render it like this:\n\n<TransformFlow\n  inputAssets={${JSON.stringify(settings.inputAssets)}}\n  outputAssets={${JSON.stringify(settings.outputAssets)}}\n  pathStyle="${settings.pathStyle}"\n  duration={${settings.duration}}\n  particleCount={${settings.particleCount}}\n  chargeDuration={${settings.chargeDuration}}\n  maxSpeed={${settings.maxSpeed}}\n  showGuides={${settings.showGuides}}\n  sound={${settings.sound}}\n/>\n\nImage URLs can replace any mark. Keep it responsive, accessible, and compatible with the existing project. Make the code changes directly and tell me which files changed.`);
  }, [settings, tunerPrompt]);

  if (!ctx) return null;
  const { setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const setAsset = (side: "inputAssets" | "outputAssets", index: number, value: string) => setSettings((current) => ({ ...current, [side]: current[side].map((asset, slot) => slot === index ? value : asset) }));

  return <div>
    <TunerHeader title="Transform" blurb="Pair six signals, shape the handoff, then hold anywhere on the stage to push time forward." />
    <motion.section variants={rise} className="mt-5 border-t border-hairline pt-5">
      <div className="mb-3 flex items-center gap-2 px-1 text-sm font-medium"><IconRoute2 size={16} stroke={1.75} className="text-muted" /> Route</div>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.07]" role="group" aria-label="Route style">
        {(["curved", "linear"] as const).map((style) => <button key={style} onClick={() => set("pathStyle", style)} aria-pressed={settings.pathStyle === style} className={`rounded-lg py-2 font-mono text-[11px] uppercase transition-colors ${settings.pathStyle === style ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}>{style}</button>)}
      </div>
    </motion.section>
    <motion.section variants={rise} className="mt-5 space-y-1.5 border-t border-hairline pt-5">
      <DialRow icon={IconBolt} label="Base speed" value={settings.duration} min={5} max={24} step={0.2} format={(value) => `${value.toFixed(1)}s`} onChange={(value) => set("duration", value)} />
      <DialRow icon={IconSparkles} label="Particle field" value={settings.particleCount} min={0} max={52} step={1} onChange={(value) => set("particleCount", value)} />
      <DialRow icon={IconWand} label="Screen bloom" value={settings.chargeDuration} min={3} max={16} step={0.5} format={(value) => `${value.toFixed(1)}s`} onChange={(value) => set("chargeDuration", value)} />
      <DialRow icon={IconBolt} label="Max speed" value={settings.maxSpeed} min={4} max={48} step={1} format={(value) => `${value}×`} onChange={(value) => set("maxSpeed", value)} />
      <SegmentedRow icon={IconImageInPicture} label="Route guides" id="transform-guides" on={settings.showGuides} onChange={(value) => set("showGuides", value)} />
      <SegmentedRow icon={IconVolume} label="Sound" id="transform-sound" on={settings.sound} onChange={(value) => set("sound", value)} />
    </motion.section>
    <motion.section variants={rise} className="mt-6 border-t border-hairline pt-5">
      <div className="mb-3 flex items-center gap-2 px-1 text-sm font-medium"><IconImageInPicture size={16} stroke={1.75} className="text-muted" /> Paired marks</div>
      <p className="mb-3 px-1 text-xs leading-relaxed text-muted">Use a glyph or paste an image URL. Each row stays paired from input to output.</p>
      <div className="space-y-2">{settings.inputAssets.map((input, index) => <div key={index} className="grid grid-cols-[1fr_14px_1fr] items-end gap-1.5 rounded-xl bg-black/[0.04] p-2 dark:bg-white/[0.07]"><AssetField label={`IN ${String(index + 1).padStart(2, "0")}`} value={input} onChange={(value) => setAsset("inputAssets", index, value)} /><span className="pb-2 text-center text-[var(--oiad-blue)]">→</span><AssetField label={`OUT ${String(index + 1).padStart(2, "0")}`} value={settings.outputAssets[index]} onChange={(value) => setAsset("outputAssets", index, value)} /></div>)}</div>
    </motion.section>
    <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5"><TunerCopyPromptButton /><button onClick={() => setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button></motion.div>
  </div>;
}
