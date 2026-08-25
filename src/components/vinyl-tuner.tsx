"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  IconBrandSpotify,
  IconDisc,
  IconLink,
  IconMusic,
  IconPhoto,
  IconRefresh,
} from "@tabler/icons-react";
import { rise, TunerHeader } from "./tuner-controls";
import { VinylPlayer, type VinylVariant } from "@/interactions/vinyl-player";
import { TunerCopyPromptButton, useTunerPrompt } from "./tuner-prompt";

type VinylSettings = {
  variant: VinylVariant;
  spotifyUrl: string;
  artworkUrl: string;
  audioUrl: string;
};

const DEFAULTS: VinylSettings = {
  variant: "full",
  spotifyUrl: "",
  artworkUrl: "",
  audioUrl: "",
};

const VinylTunerContext = React.createContext<{
  settings: VinylSettings;
  setSettings: React.Dispatch<React.SetStateAction<VinylSettings>>;
} | null>(null);

export function VinylTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(DEFAULTS);
  return <VinylTunerContext.Provider value={{ settings, setSettings }}>{children}</VinylTunerContext.Provider>;
}

export function VinylStageTuned() {
  const settings = React.useContext(VinylTunerContext)?.settings ?? DEFAULTS;
  return (
    <VinylPlayer
      variant={settings.variant}
      artworkUrl={settings.artworkUrl || undefined}
      audioUrl={settings.audioUrl || undefined}
      spotifyUrl={settings.spotifyUrl || undefined}
    />
  );
}

function Field({ icon: Icon, label, value, placeholder, onChange }: {
  icon: typeof IconLink;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 px-1 text-sm font-medium">
        <Icon size={16} stroke={1.75} className="text-muted" aria-hidden="true" />
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-hairline bg-black/[0.04] px-3.5 font-mono text-[12px] outline-none placeholder:text-muted/70 focus:border-[var(--oiad-blue)] focus:ring-2 focus:ring-[var(--oiad-blue)]/20 dark:bg-white/[0.07]"
      />
    </label>
  );
}

export function VinylTunerPanel() {
  const ctx = React.useContext(VinylTunerContext);
  const tunerPrompt = useTunerPrompt();
  const settings = ctx?.settings ?? DEFAULTS;

  React.useEffect(() => {
    const props = [
      `  variant=\"${settings.variant}\"`,
      settings.spotifyUrl && `  spotifyUrl=\"${settings.spotifyUrl}\"`,
      settings.artworkUrl && `  artworkUrl=\"${settings.artworkUrl}\"`,
      settings.audioUrl && `  audioUrl=\"${settings.audioUrl}\"`,
    ].filter(Boolean).join("\n");
    tunerPrompt?.setPrompt(`You are editing my React 19 + Tailwind v4 app. Add the 1IAD \"Vinyl Player\" interaction, then apply the exact setup I chose.\n\n1. Install it:\nnpx shadcn@latest add https://1iad.com/r/vinyl-player\n\n2. Render it like this:\n\n<VinylPlayer\n${props}\n/>\n\nKeep tap-to-play, spinning artwork, and scratch interaction intact. Keep the component responsive and accessible. Make the code changes directly and tell me which files changed.`);
  }, [settings, tunerPrompt]);

  if (!ctx) return null;
  const { setSettings } = ctx;
  const set = <K extends keyof VinylSettings>(key: K, value: VinylSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <TunerHeader
        title="Vinyl"
        blurb="Make it your record player. Change its skin, soundtrack, and cover without touching code."
      />
      <motion.section variants={rise} className="mt-5 border-t border-hairline pt-5">
        <div className="flex items-center gap-2 px-1 pb-3 text-sm font-medium">
          <IconDisc size={16} stroke={1.75} className="text-muted" aria-hidden="true" />
          Display mode
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.07]" role="group" aria-label="Vinyl display mode">
          {(["full", "bare", "glass"] as const).map((variant) => (
            <button
              key={variant}
              onClick={() => set("variant", variant)}
              aria-pressed={settings.variant === variant}
              className={`rounded-lg px-2 py-2 font-mono text-[11px] uppercase transition-colors ${settings.variant === variant ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
            >
              {variant}
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={rise} className="mt-6 space-y-4 border-t border-hairline pt-5">
        <Field icon={IconBrandSpotify} label="Spotify link" value={settings.spotifyUrl} onChange={(value) => set("spotifyUrl", value)} placeholder="open.spotify.com/track/..." />
        <p className="-mt-2 px-1 text-xs leading-relaxed text-muted">Paste a Spotify track, album, playlist, or episode. The turntable controls the official Spotify embed.</p>
        <Field icon={IconPhoto} label="Cover image URL" value={settings.artworkUrl} onChange={(value) => set("artworkUrl", value)} placeholder="https://…/cover.jpg" />
        <Field icon={IconMusic} label="Audio file URL" value={settings.audioUrl} onChange={(value) => set("audioUrl", value)} placeholder="https://…/track.mp3" />
      </motion.section>

      <motion.div variants={rise} className="mt-6 border-t border-hairline pb-12 pt-5">
        <TunerCopyPromptButton />
        <button onClick={() => setSettings(DEFAULTS)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">
          <IconRefresh size={16} stroke={1.9} aria-hidden="true" className="text-[var(--oiad-blue)]" />
          Reset defaults
        </button>
      </motion.div>
    </div>
  );
}
