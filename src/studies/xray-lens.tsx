"use client";

// X-Ray Lens — the cursor is a porthole into a hidden blueprint layer.
// The lens follows on a lerped motion value (tunable lag) so it feels
// weighted, not glued to the pointer.

import * as React from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { IconFocus, IconSunHigh, IconResize, IconZoomCode } from "@tabler/icons-react";
import { DialRow, TunerHeader } from "@/components/tuner-controls";
import { SegmentedRow } from "@/components/tuner-controls";

type Settings = {
  lensSize: number;
  smooth: number;
  glow: number;
  ring: boolean;
};

export const XRAY_DEFAULTS: Settings = { lensSize: 96, smooth: 0.6, glow: 1, ring: true };

export function XRayLens({ lensSize = XRAY_DEFAULTS.lensSize, smooth = XRAY_DEFAULTS.smooth, glow = XRAY_DEFAULTS.glow, ring = XRAY_DEFAULTS.ring }: Settings) {
  const [on, setOn] = React.useState(false);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);
  const sizeValue = useMotionValue(lensSize);
  const reduced = useReducedMotion();
  React.useEffect(() => {
    sizeValue.set(lensSize);
  }, [lensSize, sizeValue]);
  useAnimationFrame(() => {
    // smooth 0 = glued to the pointer, 1 = heavy lantern lag
    const factor = 0.5 - smooth * 0.465;
    lensX.set(lensX.get() + (targetX.get() - lensX.get()) * factor);
    lensY.set(lensY.get() + (targetY.get() - lensY.get()) * factor);
  });
  const clipPath = useTransform([lensX, lensY, sizeValue], (values: number[]) =>
    on ? `circle(${values[2]}px at ${values[0]}px ${values[1]}px)` : "circle(0px at -200px -200px)",
  );
  const ringTransform = useTransform([lensX, lensY, sizeValue], (values: number[]) =>
    `translate(${values[0] - values[2]}px, ${values[1] - values[2]}px)`,
  );
  const ringSize = useTransform(sizeValue, (s) => s * 2);
  const halo = `0 0 ${18 * glow}px rgba(94,160,255,${0.8 * glow}), 0 0 ${46 * glow}px rgba(94,160,255,${0.45 * glow})`;
  return (
    <div
      className="relative h-full min-h-[62vh] cursor-none overflow-hidden bg-[#f5f5f7]"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        targetX.set(event.clientX - rect.left);
        targetY.set(event.clientY - rect.top);
        setOn(true);
      }}
      onPointerLeave={() => setOn(false)}
    >
      <div className="absolute inset-0 grid place-items-center [background-image:radial-gradient(circle,rgba(0,0,0,.13)_1.25px,transparent_1.25px)] [background-size:16px_16px]">
        <div className="text-center">
          <span className="font-bricolage select-none text-[clamp(4rem,15vw,7rem)] font-extrabold tracking-[-.05em] text-foreground/85">OIAD</span>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[.24em] text-black/30">one interaction a day</p>
        </div>
        <p className="absolute bottom-5 font-mono text-[10px] uppercase tracking-[.2em] text-black/30">surface — the version you know</p>
      </div>
      <motion.div
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 overflow-hidden bg-[#04060f] [background-image:linear-gradient(rgba(64,140,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(64,140,255,.16)_1px,transparent_1px)] [background-size:22px_22px]"
        style={{ clipPath }}
      >
        {!reduced && (
          <motion.span
            aria-hidden="true"
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(94,160,255,.6),transparent)]"
          />
        )}
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <span className="font-bricolage select-none text-[clamp(4rem,15vw,7rem)] font-extrabold tracking-[-.05em] text-[#5ea0ff]" style={{ textShadow: halo }}>OIAD</span>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[.24em] text-[#5ea0ff]/75">beneath the surface</p>
          </div>
        </div>
        <span className="absolute left-6 top-5 font-mono text-[9px] uppercase tracking-[.18em] text-[#5ea0ff]/80">x-ray · live build</span>
        <span className="absolute right-6 top-5 font-mono text-[9px] tracking-[.14em] text-[#5ea0ff]/60">3,812 stars</span>
        <span className="absolute bottom-5 left-6 font-mono text-[9px] tracking-[.14em] text-[#5ea0ff]/60">day 07 · vinyl player</span>
        <span className="absolute bottom-5 right-6 font-mono text-[9px] tracking-[.14em] text-[#5ea0ff]/60">v2.4.1</span>
      </motion.div>
      {ring && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 rounded-full border-2 border-[var(--oiad-blue)]"
          style={{ transform: ringTransform, width: ringSize, height: ringSize, opacity: on ? 1 : 0, transition: "opacity 150ms" }}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center">
        <span className={`font-mono text-[10px] uppercase tracking-[.2em] text-black/35 transition-opacity ${on ? "opacity-0" : "opacity-100"}`}>move to see through</span>
      </div>
    </div>
  );
}

/* --- tuner --- */

const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function XRayTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(XRAY_DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function XRayStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? XRAY_DEFAULTS;
  return <XRayLens {...settings} />;
}

export function XRayTunerPanel() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const { settings, setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <div>
      <TunerHeader title="Lens" blurb="The cursor becomes a porthole. Tune the size, how heavily it lags behind your hand, and the neon glow." />
      <div className="mt-5 space-y-1.5 border-t border-hairline pt-5">
        <DialRow icon={IconResize} label="Lens size" value={settings.lensSize} min={56} max={170} step={2} format={(v) => `${v}px`} onChange={(v) => set("lensSize", v)} />
        <DialRow icon={IconZoomCode} label="Lag" value={settings.smooth} min={0} max={1} step={0.05} format={(v) => (v < 0.05 ? "instant" : `${v.toFixed(2)}`)} onChange={(v) => set("smooth", v)} />
        <DialRow icon={IconSunHigh} label="Glow" value={settings.glow} min={0} max={2} step={0.1} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set("glow", v)} />
        <SegmentedRow icon={IconFocus} label="Lens ring" id="xray-ring" on={settings.ring} onChange={(v) => set("ring", v)} />
      </div>
      <button onClick={() => setSettings(XRAY_DEFAULTS)} className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button>
    </div>
  );
}
