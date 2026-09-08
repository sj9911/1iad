"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, type PointerEvent, type ReactNode } from "react";

export type Sound = (frequency?: number, kind?: "bell" | "paper" | "click" | "thud", strength?: number) => void;
export const SoundContext = createContext<Sound>(() => {});
export const useSound = () => useContext(SoundContext);
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export function point(event: PointerEvent<SVGElement>) {
  const svg = event.currentTarget instanceof SVGSVGElement ? event.currentTarget : event.currentTarget.ownerSVGElement;
  const matrix = svg?.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return { x: p.x, y: p.y };
}

export function useAudio(enabled: boolean): Sound {
  const context = useRef<AudioContext | null>(null);
  const active = useRef(enabled);
  useEffect(() => { active.current = enabled; }, [enabled]);
  useEffect(() => () => { void context.current?.close(); }, []);
  return useCallback((frequency = 440, kind = "click", strength = 1) => {
    if (!active.current) return;
    const ctx = context.current ??= new AudioContext();
    void ctx.resume().catch(() => {});
    const start = ctx.currentTime;
    const duration = kind === "bell" ? 2.4 : kind === "paper" ? 0.16 : 0.09;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(Math.min(0.13, 0.07 * strength), start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    gain.connect(ctx.destination);
    if (kind === "paper") {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = frequency * 3;
      noise.connect(filter); filter.connect(gain); noise.start();
      noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
    } else {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, start);
      if (kind === "thud") osc.frequency.exponentialRampToValueAtTime(45, start + duration);
      osc.connect(gain); osc.start(); osc.stop(start + duration);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      if (kind === "bell") {
        const overtone = ctx.createOscillator();
        const level = ctx.createGain(); level.gain.value = 0.16;
        overtone.frequency.value = frequency * 2.76;
        overtone.connect(level); level.connect(gain); overtone.start(); overtone.stop(start + duration);
        overtone.onended = () => { overtone.disconnect(); level.disconnect(); };
      }
    }
  }, []);
}

// Stop simulation work offscreen, in background tabs, and for reduced-motion users.
export function useSimulation(tick: (dt: number, time: number) => void) {
  const ref = useRef<SVGSVGElement>(null);
  const callback = useRef(tick);
  useEffect(() => { callback.current = tick; });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0, last = 0, visible = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const run = (now: number) => {
      callback.current(Math.min((now - (last || now)) / 1000, 0.035), now / 1000);
      last = now;
      frame = requestAnimationFrame(run);
    };
    const sync = () => {
      cancelAnimationFrame(frame); last = 0;
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(run);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", sync); reduced.removeEventListener("change", sync); };
  }, []);
  return ref;
}

export function useMaterials() {
  const id = useId().replaceAll(":", "");
  return {
    metal: `url(#${id}-metal)`, wood: `url(#${id}-wood)`, paper: `url(#${id}-paper)`, shadow: `url(#${id}-shadow)`,
    defs: <defs>
      <linearGradient id={`${id}-metal`}><stop stopColor="#919a9b"/><stop offset=".2" stopColor="#dce1df"/><stop offset=".44" stopColor="#f7f8f4"/><stop offset=".65" stopColor="#adb5b5"/><stop offset="1" stopColor="#717c7e"/></linearGradient>
      <linearGradient id={`${id}-wood`} x2="0" y2="1"><stop stopColor="#bf8253"/><stop offset=".25" stopColor="#deb48a"/><stop offset="1" stopColor="#9c6340"/></linearGradient>
      <linearGradient id={`${id}-paper`} x2=".25" y2="1"><stop stopColor="#fffef7"/><stop offset="1" stopColor="#eeece2"/></linearGradient>
      <filter id={`${id}-shadow`} x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#24231c" floodOpacity=".17"/></filter>
    </defs>,
  };
}

export function Action({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="pg-action" disabled={disabled} onClick={onClick}>{children}</button>;
}

export function downloadSVG(name: string, markup: string) {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
