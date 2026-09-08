"use client";

import * as React from "react";
import { WindChimes as OriginalWindChimes } from "@/app/playground/resting";
import { SoundContext } from "@/app/playground/shared";

export type ChimePalette = "aurora" | "coral" | "silver";

export type WindChimesProps = {
  className?: string;
  palette?: ChimePalette;
  breeze?: number;
  windActive?: boolean;
  tubeLength?: number;
  glow?: boolean;
  interactive?: boolean;
  sound?: boolean;
  fill?: boolean;
};

// The main site intentionally shares the first playground's exact construction:
// patterned wind catcher, clapper, strings, tube physics, and hover light.
function useWindChimeSound(enabled: boolean) {
  const context = React.useRef<AudioContext | null>(null);
  React.useEffect(() => () => { void context.current?.close(); }, []);
  return React.useCallback((frequency = 440, kind: "bell" | "paper" | "click" | "thud" = "bell", strength = 1) => {
    if (!enabled || kind !== "bell") return;
    const audio = context.current ??= new AudioContext();
    void audio.resume().catch(() => {});
    const start = audio.currentTime;
    [[1, .07, 1.7], [2.76, .038, 1.25], [5.4, .016, .78], [8.93, .008, .44]].forEach(([ratio, level, decay]) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency * ratio, start);
      oscillator.detune.setValueAtTime((Math.random() - .5) * 9, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level * Math.min(1, strength), start + .008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start); oscillator.stop(start + decay + .04);
    });
  }, [enabled]);
}

export function WindChimes({ className = "", palette = "aurora", breeze = 1, windActive = true, tubeLength = 1, glow = true, interactive = true, sound = true, fill = false }: WindChimesProps) {
  const play = useWindChimeSound(sound);
  const tint = palette === "coral" ? "hue-rotate(-24deg) saturate(1.12)" : palette === "silver" ? "saturate(0) contrast(.95)" : "none";
  return <SoundContext.Provider value={play}><div className={`oiad-chimes relative overflow-hidden rounded-2xl border border-hairline bg-[#faf9f5] shadow-[0_24px_72px_rgba(0,0,0,.08)] dark:bg-[#20221f] ${className}`} style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : { width: "min(92vw, 540px)" }}>
      <div className={`mx-auto h-full ${interactive ? "" : "pointer-events-none"}`} style={{ width: `${Math.max(.7, Math.min(1.25, tubeLength)) * 100}%`, filter: tint }}>
        <OriginalWindChimes className={glow ? "" : "oiad-chimes-no-glow"} showControls={false} breezeMultiplier={breeze} windActive={windActive} />
      </div>
    </div></SoundContext.Provider>;
}
