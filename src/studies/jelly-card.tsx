"use client";

// Jelly Card — a physical object you can grab anywhere and fling.
// Release velocity is carried into the spring (a real flick), the body
// stretches along the pull direction, and reduced motion gets a stiff,
// no-wobble follow.

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { IconHandGrab, IconHeartHandshake, IconStretching, IconWaveSine } from "@tabler/icons-react";
import { DialRow, TunerHeader } from "@/components/tuner-controls";

type Settings = {
  bounce: number;
  stiffness: number;
  stretchiness: number;
};

export const JELLY_CARD_DEFAULTS: Settings = { bounce: 0.32, stiffness: 150, stretchiness: 1 };

export function JellyCard({ bounce = JELLY_CARD_DEFAULTS.bounce, stiffness = JELLY_CARD_DEFAULTS.stiffness, stretchiness = JELLY_CARD_DEFAULTS.stretchiness }: Settings) {
  const reduced = useReducedMotion();
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, reduced ? { stiffness: 380, damping: 34 } : { stiffness, damping: 0, bounce, mass: 0.9 });
  const springY = useSpring(targetY, reduced ? { stiffness: 380, damping: 34 } : { stiffness, damping: 0, bounce, mass: 0.9 });
  const dragging = React.useRef(false);
  const last = React.useRef({ x: 0, y: 0, t: 0 });
  const velocity = React.useRef({ x: 0, y: 0 });
  const flickTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const transform = useTransform([springX, springY], (values: number[]) => {
    const [x, y] = values;
    const distance = Math.hypot(x, y);
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    const stretch = Math.min(0.42, distance * 0.0011 * stretchiness);
    return `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.55}) rotate(${-angle}deg)`;
  });
  function release() {
    dragging.current = false;
    // flick: chase the throw point, then spring home — the hand-off keeps
    // the pointer's velocity alive without touching spring internals
    const throwX = springX.get() + velocity.current.x * 9;
    const throwY = springY.get() + velocity.current.y * 9;
    targetX.set(reduced ? 0 : throwX);
    targetY.set(reduced ? 0 : throwY);
    if (flickTimer.current) clearTimeout(flickTimer.current);
    flickTimer.current = setTimeout(() => {
      targetX.set(0);
      targetY.set(0);
    }, reduced ? 0 : 110);
  }
  return (
    <div
      className="relative grid h-full min-h-[62vh] touch-none place-items-center bg-[radial-gradient(circle_at_50%_45%,#eef1ff,transparent_62%)]"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragging.current = true;
        const rect = event.currentTarget.getBoundingClientRect();
        last.current = { x: event.clientX, y: event.clientY, t: performance.now() };
        targetX.set(event.clientX - rect.left - rect.width / 2);
        targetY.set(event.clientY - rect.top - rect.height / 2);
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        targetX.set(event.clientX - rect.left - rect.width / 2);
        targetY.set(event.clientY - rect.top - rect.height / 2);
        const now = performance.now();
        const dt = Math.max(1, now - last.current.t);
        velocity.current = {
          x: ((event.clientX - last.current.x) / dt) * 16,
          y: ((event.clientY - last.current.y) / dt) * 16,
        };
        last.current = { x: event.clientX, y: event.clientY, t: now };
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <motion.div
        style={{ transform }}
        className="grid h-[150px] w-[240px] cursor-grab place-items-center rounded-[28px] border border-[#002fff]/20 bg-[linear-gradient(150deg,#ffffff,#e9edfb)] shadow-[0_22px_48px_rgba(0,47,255,.16)] active:cursor-grabbing"
      >
        <span className="flex flex-col items-center gap-2 text-[var(--oiad-blue)]">
          <IconHandGrab size={24} stroke={1.7} />
          <span className="font-mono text-[10px] uppercase tracking-[.22em]">grab me · fling me</span>
        </span>
      </motion.div>
      <p className="absolute bottom-5 text-xs text-muted">drag it out and let go mid-swing — it keeps the flick</p>
    </div>
  );
}

/* --- tuner --- */

const Ctx = React.createContext<{ settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>> } | null>(null);

export function JellyCardTunerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState(JELLY_CARD_DEFAULTS);
  return <Ctx.Provider value={{ settings, setSettings }}>{children}</Ctx.Provider>;
}

export function JellyCardStageTuned() {
  const settings = React.useContext(Ctx)?.settings ?? JELLY_CARD_DEFAULTS;
  return <JellyCard {...settings} />;
}

export function JellyCardTunerPanel() {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const { settings, setSettings } = ctx;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <div>
      <TunerHeader title="Jelly" blurb="A body you can throw. Tune the wobble, how snappy the spring is, and how far the jelly stretches." />
      <div className="mt-5 space-y-1.5 border-t border-hairline pt-5">
        <DialRow icon={IconWaveSine} label="Wobble" value={settings.bounce} min={0} max={0.6} step={0.02} format={(v) => v.toFixed(2)} onChange={(v) => set("bounce", v)} />
        <DialRow icon={IconHeartHandshake} label="Springiness" value={settings.stiffness} min={60} max={420} step={10} format={(v) => String(v)} onChange={(v) => set("stiffness", v)} />
        <DialRow icon={IconStretching} label="Stretch" value={settings.stretchiness} min={0} max={2.4} step={0.1} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set("stretchiness", v)} />
      </div>
      <button onClick={() => setSettings(JELLY_CARD_DEFAULTS)} className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-black/[0.04] text-sm font-medium transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]">Reset defaults</button>
    </div>
  );
}
