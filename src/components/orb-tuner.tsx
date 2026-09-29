"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  IconColorSwatch,
  IconDroplet,
  IconResize,
  IconSparkles,
  IconWind,
} from "@tabler/icons-react";
import {
  DEFAULT_ORB_CONTROLS,
  ORB_PALETTES,
  OrbScene,
  type OrbColorway,
  type OrbControls,
  type OrbKind,
  type OrbSize,
  type OrbState,
  type OrbTheme,
} from "@/interactions/orb-scene";
import { DialRow, rise, TunerHeader } from "./tuner-controls";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";

const ORBS: Array<{ id: OrbKind; name: string; description: string }> = [
  { id: "aurora", name: "Pearl", description: "Dense folded pearl with iridescent edges" },
  { id: "flux", name: "Diffusion", description: "Soft liquid volumes moving through frosted glass" },
  { id: "veil", name: "Spectral", description: "Thin interference membranes splitting light" },
  { id: "iris", name: "Iris", description: "Orbiting spectral lobes around a luminous core" },
];
const STATES: OrbState[] = ["resting", "listening", "speaking"];
const SIZES: OrbSize[] = ["main", "compact", "widget"];
const COLORWAYS: OrbColorway[] = [0, 1, 2];

type Settings = {
  kind: OrbKind;
  state: OrbState;
  size: OrbSize;
  controls: OrbControls;
  colorways: Record<OrbKind, OrbColorway>;
};

const DEFAULTS: Settings = {
  kind: "aurora",
  state: "resting",
  size: "main",
  controls: DEFAULT_ORB_CONTROLS,
  colorways: { aurora: 0, flux: 0, veil: 0, iris: 0 },
};

const Ctx = React.createContext<{
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
} | null>(null);

export function OrbTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

function useSiteTheme(): OrbTheme {
  const [theme, setTheme] = React.useState<OrbTheme>("light");
  React.useEffect(() => {
    const root = document.documentElement;
    const update = () => setTheme(root.classList.contains("dark") ? "dark" : "light");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export function OrbStageTuned({ compact = false }: { compact?: boolean } = {}) {
  const settings = React.useContext(Ctx)?.settings ?? DEFAULTS;
  const theme = useSiteTheme();
  const size = compact ? "compact" : settings.size;
  const selected = ORBS.find((orb) => orb.id === settings.kind) ?? ORBS[0];
  const colorway = settings.colorways[settings.kind];
  const cycleState = () =>
    updateSettings((current) => ({
      ...current,
      state: STATES[(STATES.indexOf(current.state) + 1) % STATES.length],
    }));
  const ctx = React.useContext(Ctx);
  function updateSettings(update: React.SetStateAction<Settings>) {
    ctx?.setSettings(update);
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-6">
      <button
        className={`orb-button orb-button--${size}`}
        type="button"
        onClick={cycleState}
        aria-label={`The ${selected.name} orb is ${settings.state}. Click to change state.`}
      >
        <span className="orb-fallback" aria-hidden="true" />
        <OrbScene
          kind={settings.kind}
          state={settings.state}
          controls={settings.controls}
          size={size}
          theme={theme}
          colorway={colorway}
        />
      </button>
    </div>
  );
}

export function OrbCardPreview() {
  return <OrbStageTuned compact />;
}

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-medium text-muted">{label}</p>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.07]" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`rounded-lg px-2 py-2 font-mono text-[10px] uppercase transition-colors duration-150 ${value === option ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OrbTunerPanel() {
  const ctx = React.useContext(Ctx);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;
  const colorway = settings.colorways[settings.kind];
  const selected = ORBS.find((orb) => orb.id === settings.kind) ?? ORBS[0];

  React.useEffect(() => {
    tunerPrompt?.setPrompt(`Add the 1IAD \"Presence Orb\" interaction and render the ${selected.name} material in its ${settings.state} state, ${settings.size} size, and ${ORB_PALETTES[settings.kind].colorways[colorway].name} colorway. Preserve its Three.js shader, pointer response, reduced-motion behavior, and these controls: ${JSON.stringify(settings.controls)}.`);
  }, [colorway, selected.name, settings, tunerPrompt]);

  if (!ctx) return null;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    ctx.setSettings((current) => ({ ...current, [key]: value }));
  const setControl = (key: keyof OrbControls, value: number) =>
    ctx.setSettings((current) => ({
      ...current,
      controls: { ...current.controls, [key]: value },
    }));

  return (
    <div>
      <TunerHeader title="Presence Orb" blurb="Choose the material, state, colour, and the shader's physical character." />

      <motion.section variants={rise} className="mt-5 space-y-4 border-t border-hairline pt-5">
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted">Material</p>
          <div className="grid grid-cols-2 gap-1" role="group" aria-label="Orb material">
            {ORBS.map((orb) => (
              <button
                key={orb.id}
                onClick={() => set("kind", orb.id)}
                aria-pressed={settings.kind === orb.id}
                title={orb.description}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 ${settings.kind === orb.id ? "bg-foreground text-background" : "bg-black/[0.04] text-muted hover:text-foreground dark:bg-white/[0.07]"}`}
              >
                <span className={`orb-picker__swatch orb-picker__swatch--${orb.id}`} aria-hidden="true" />
                {orb.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-muted"><IconColorSwatch size={15} stroke={1.75} />Colourway</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label={`${selected.name} colourway`}>
            {COLORWAYS.map((option) => {
              const palette = ORB_PALETTES[settings.kind].colorways[option];
              return (
                <button
                  key={palette.name}
                  onClick={() => ctx.setSettings((current) => ({ ...current, colorways: { ...current.colorways, [current.kind]: option } }))}
                  aria-pressed={colorway === option}
                  className={`rounded-xl p-1 transition-colors duration-150 ${colorway === option ? "bg-foreground" : "bg-black/[0.04] dark:bg-white/[0.07]"}`}
                >
                  <span className="block h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${palette.secondary}, ${palette.accent})` }} />
                  <span className={`mt-1.5 block pb-0.5 font-mono text-[9px] uppercase ${colorway === option ? "text-background" : "text-muted"}`}>{palette.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <ChoiceRow label="State" value={settings.state} options={STATES} onChange={(value) => set("state", value)} />
        <ChoiceRow label="Preview size" value={settings.size} options={SIZES} onChange={(value) => set("size", value)} />
      </motion.section>

      <motion.section variants={rise} className="mt-5 space-y-1.5 border-t border-hairline pt-5">
        <DialRow icon={IconWind} label="Flow speed" value={settings.controls.speed} min={0.2} max={2.5} step={0.05} format={(value) => `${value.toFixed(2)}×`} onChange={(value) => setControl("speed", value)} />
        <DialRow icon={IconSparkles} label="State motion" value={settings.controls.motion} min={0} max={2} step={0.05} format={(value) => value.toFixed(2)} onChange={(value) => setControl("motion", value)} />
        <DialRow icon={IconSparkles} label="Reflection" value={settings.controls.reflection} min={0} max={2} step={0.05} format={(value) => value.toFixed(2)} onChange={(value) => setControl("reflection", value)} />
        <DialRow icon={IconDroplet} label="Glass depth" value={settings.controls.refraction} min={0} max={2} step={0.05} format={(value) => value.toFixed(2)} onChange={(value) => setControl("refraction", value)} />
        <DialRow icon={IconColorSwatch} label="Diffraction" value={settings.controls.diffraction} min={0} max={2} step={0.05} format={(value) => value.toFixed(2)} onChange={(value) => setControl("diffraction", value)} />
        <DialRow icon={IconResize} label="Inner blur" value={settings.controls.softness} min={0} max={1.5} step={0.05} format={(value) => value.toFixed(2)} onChange={(value) => setControl("softness", value)} />
      </motion.section>

      <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5">
        <TunerCopyPromptButton />
        <button onClick={() => ctx.setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors duration-150 hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button>
      </motion.div>
    </div>
  );
}
