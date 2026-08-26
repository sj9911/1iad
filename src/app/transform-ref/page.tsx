"use client";

import * as React from "react";
import Link from "next/link";
import { IconUpload } from "@tabler/icons-react";

type Lane = 0 | 1 | 2;
type Asset = { label: string; image?: string; tint: string };

const SOURCE_DEFAULTS: Asset[] = [
  { label: "✦", tint: "#002fff" },
  { label: "●", tint: "#7c3aed" },
  { label: "◆", tint: "#db2777" },
  { label: "✳", tint: "#0ea5e9" },
  { label: "▲", tint: "#9333ea" },
  { label: "✢", tint: "#e11d48" },
];
const TARGET_DEFAULTS: Asset[] = [
  { label: "✺", tint: "#16a34a" },
  { label: "↗", tint: "#ea580c" },
  { label: "✹", tint: "#002fff" },
  { label: "✧", tint: "#65a30d" },
  { label: "◼", tint: "#c2410c" },
  { label: "☼", tint: "#2563eb" },
];
// The four curved routes are the supplied Bézier path baked into the panel's
// 640×440 coordinate space. Keeping the icon group unscaled prevents the
// route mirror from squashing the actual SVG/PNG card.
const INPUT_PATHS = [
  "M0 73.2H14.1323C103.755 73.2 191.796 92.094 269.386 127.979L350.776 165.621C428.366 201.506 516.406 220.4 606.029 220.4H1280",
  "M0 220H1280",
  "M0 366.8H14.1323C103.755 366.8 191.796 347.906 269.386 312.021L350.776 274.379C428.366 238.494 516.406 219.6 606.029 219.6H1280",
];
const OUTPUT_PATHS = [
  "M-640 220H0L0 219.6H14.1323C103.755 219.6 191.796 200.706 269.386 164.821L350.776 127.179C428.366 91.294 516.406 72.4 606.029 72.4H720",
  "M-640 220H720",
  "M-640 220H0L0 220.4H14.1323C103.755 220.4 191.796 239.294 269.386 275.179L350.776 312.821C428.366 348.706 516.406 367.6 606.029 367.6H720",
];

function AssetMark({ asset }: { asset: Asset }) {
  return asset.image ? (
    // Local selected files stay in this browser session only.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset.image} alt="" className="size-full object-contain" />
  ) : <span style={{ color: asset.tint }}>{asset.label}</span>;
}

export default function TransformRefPage() {
  const [sources, setSources] = React.useState(SOURCE_DEFAULTS);
  const [targets, setTargets] = React.useState(TARGET_DEFAULTS);
  const [pointerHint, setPointerHint] = React.useState({ x: 0, y: 0, visible: false });
  const [holdState, setHoldState] = React.useState({ intensity: 0, glow: 0, x: 0, y: 0, holding: false });
  const svgPanels = React.useRef(new Set<SVGSVGElement>());
  const animationTime = React.useRef(0);
  const lastFrame = React.useRef<number | null>(null);
  const isAccelerating = React.useRef(false);
  const accelerationStart = React.useRef(0);
  const currentSpeed = React.useRef(1);
  const audioContext = React.useRef<AudioContext | null>(null);
  const accelerationOscillator = React.useRef<OscillatorNode | null>(null);
  const accelerationGain = React.useRef<GainNode | null>(null);

  const registerSvg = React.useCallback((node: SVGSVGElement | null) => {
    if (!node) return;
    svgPanels.current.add(node);
    node.pauseAnimations();
    node.setCurrentTime(animationTime.current);
  }, []);

  React.useEffect(() => {
    let frame = 0;
    const tick = (time: number) => {
      const previous = lastFrame.current ?? time;
      const elapsed = (time - previous) / 1000;
      const heldFor = isAccelerating.current ? time - accelerationStart.current : 0;
      // A long, playful ramp gives the motion room to build. Releasing uses
      // a softer response so the flow glides back to its resting tempo.
      const targetSpeed = isAccelerating.current
        ? 1 + Math.pow(Math.min(heldFor / 2700, 1), 1.65) * 32
        : 1;
      const intensity = isAccelerating.current ? Math.min(heldFor / 2700, 1) : 0;
      const glow = isAccelerating.current ? Math.min(heldFor / 10000, 1) : 0;
      const easing = 1 - Math.exp(-elapsed * (isAccelerating.current ? 3.1 : 1.45));
      currentSpeed.current += (targetSpeed - currentSpeed.current) * easing;
      animationTime.current += elapsed * currentSpeed.current;
      svgPanels.current.forEach((svg) => svg.setCurrentTime(animationTime.current));
      if (isAccelerating.current) {
        const magnitude = 0.35 + intensity * intensity * 3.4;
        setHoldState({
          intensity,
          glow,
          x: Math.sin(time * 0.047) * magnitude,
          y: Math.cos(time * 0.071) * magnitude * 0.65,
          holding: true,
        });
      }
      if (accelerationOscillator.current && audioContext.current) {
        accelerationOscillator.current.frequency.setTargetAtTime(108 + Math.min(currentSpeed.current, 33) * 14, audioContext.current.currentTime, 0.05);
      }
      lastFrame.current = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stopAccelerationSound();
    };
  }, []);

  function getAudioContext() {
    if (!audioContext.current) audioContext.current = new AudioContext();
    return audioContext.current;
  }

  function startAccelerationSound() {
    const context = getAudioContext();
    void context.resume();
    if (accelerationOscillator.current) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(122, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.028, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    accelerationOscillator.current = oscillator;
    accelerationGain.current = gain;
  }

  function stopAccelerationSound() {
    const context = audioContext.current;
    const oscillator = accelerationOscillator.current;
    const gain = accelerationGain.current;
    if (!context || !oscillator || !gain) return;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    oscillator.stop(context.currentTime + 0.45);
    accelerationOscillator.current = null;
    accelerationGain.current = null;
  }

  function playReleaseSound() {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(330, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(145, context.currentTime + 0.36);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.04, context.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
  }

  function updatePointerHint(event: React.PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointerHint({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, visible: true });
  }

  function startAcceleration(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePointerHint(event);
    accelerationStart.current = performance.now();
    isAccelerating.current = true;
    setHoldState((state) => ({ ...state, holding: true }));
    startAccelerationSound();
  }

  function releaseAcceleration() {
    if (!isAccelerating.current) return;
    isAccelerating.current = false;
    setHoldState({ intensity: 0, glow: 0, x: 0, y: 0, holding: false });
    stopAccelerationSound();
    playReleaseSound();
  }

  function replace(kind: "source" | "target", index: number, file?: File) {
    if (!file || !file.type.match(/image\/(svg\+xml|png)/)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const update = (items: Asset[]) => items.map((item, slot) =>
        slot === index ? { ...item, image: String(reader.result) } : item,
      );
      if (kind === "source") setSources(update);
      else setTargets(update);
    };
    reader.readAsDataURL(file);
  }

  return (
    <main
      className="min-h-svh bg-background px-6 py-8 text-foreground sm:px-10"
      style={{ backgroundImage: "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)", backgroundSize: "18px 18px" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="rounded-2xl border border-hairline bg-surface px-4 py-2 font-bricolage text-sm font-semibold transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">← Back</Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Temporary study / transform flow</p>
        </div>

        <header className="mt-14 max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--oiad-blue)]">One thing becomes another</p>
          <h1 className="font-bricolage mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Transform flow</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">Each input keeps its pace until it leaves the first box. At that exact moment, its paired output enters the second box and carries the motion onward.</p>
        </header>

        <section className="relative mt-12 overflow-hidden rounded-[28px] border border-hairline bg-surface shadow-[0_28px_80px_rgba(0,0,0,.1)] will-change-transform" style={{ transform: `translate(${holdState.x}px, ${holdState.y}px)` }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-[var(--oiad-blue)]/35 to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2 bg-[var(--oiad-blue)]" style={{ opacity: 0.12 + holdState.glow * 0.88, boxShadow: `0 0 ${8 + holdState.glow * 62}px color-mix(in srgb, var(--oiad-blue) ${18 + holdState.glow * 78}%, transparent)` }} />
          <CenterChargeGlow intensity={holdState.glow} />
          <ChargeParticles intensity={holdState.intensity} />
          <div className="grid min-h-[440px] grid-cols-2">
            <FlowPanel title="Input group" side="input" assets={sources} registerSvg={registerSvg} />
            <FlowPanel title="Output group" side="output" assets={targets} registerSvg={registerSvg} />
          </div>

          {/* One shared seam, not a connector: the paired output begins as
              its input leaves, making the visible handoff feel continuous. */}
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 z-20 border-l border-hairline" />
          <button
            type="button"
            aria-label="Hold to accelerate the transform flow"
            className={`absolute inset-0 z-40 touch-none focus:outline-none ${holdState.holding ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={startAcceleration}
            onPointerUp={releaseAcceleration}
            onPointerCancel={releaseAcceleration}
            onPointerMove={updatePointerHint}
            onPointerEnter={updatePointerHint}
            onPointerLeave={() => setPointerHint((hint) => ({ ...hint, visible: false }))}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-50 rounded-full border border-hairline bg-surface/85 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-muted backdrop-blur-sm transition-opacity duration-150"
            style={{ left: pointerHint.x + 12, top: pointerHint.y + 12, opacity: pointerHint.visible ? 1 : 0 }}
          >hold</span>
        </section>

        <AssetPairControls
          sources={sources}
          targets={targets}
          onFile={(side, index, file) => replace(side, index, file)}
        />
      </div>
      <FullscreenChargeGlow intensity={holdState.glow} />
    </main>
  );
}

function FlowPanel({ title, side, assets, registerSvg }: { title: string; side: "input" | "output"; assets: Asset[]; registerSvg: (node: SVGSVGElement | null) => void }) {
  const isInput = side === "input";
  return <div className={`relative overflow-hidden ${isInput ? "bg-[linear-gradient(135deg,var(--surface)_0%,color-mix(in_srgb,var(--surface)_96%,var(--oiad-blue))_100%)]" : "bg-[linear-gradient(225deg,var(--surface)_0%,color-mix(in_srgb,var(--surface)_96%,var(--oiad-blue))_100%)]"}`}>
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-hairline bg-surface/65 px-5 py-4 backdrop-blur-sm"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</span><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--oiad-blue)]">06 pairs</span></div>
    <div aria-hidden="true" className={`pointer-events-none absolute bottom-4 z-10 font-mono text-[9px] uppercase tracking-[0.22em] text-muted/70 ${isInput ? "left-5" : "right-5"}`}>{isInput ? "source signal / live" : "output signal / live"}</div>
    <svg ref={registerSvg} className="absolute inset-0 size-full" viewBox="0 0 640 440" preserveAspectRatio="xMidYMid meet" aria-label={`${title} animated paths`}>
      <defs>
        <radialGradient id={`seam-glow-${side}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={side === "input" ? "translate(645 220) rotate(90) scale(108.5 51.2)" : "translate(-5 220) rotate(90) scale(108.5 51.2)"}>
          <stop stopColor="var(--oiad-blue)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--oiad-blue)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* The guides expose the choreography without competing with the cards. */}
      {([0, 1, 2] as Lane[]).map((lane) => <path key={lane} d={motionPath(side, lane)} fill="none" stroke="var(--hairline-solid)" strokeWidth="1.25" strokeDasharray="4 7" />)}
      {([0, 1, 2] as Lane[]).flatMap((lane) => [0, 1, 2].map((dot) => <RouteDot key={`${lane}-${dot}`} side={side} lane={lane} index={dot} />))}
      {assets.map((_, index) => <SeamMagic key={index} side={side} pairIndex={index} />)}
      {assets.map((asset, index) => <SvgFlowItem key={index} asset={asset} lane={(index % 3) as Lane} cycle={Math.floor(index / 3)} side={side} />)}
    </svg>
  </div>;
}

function motionPath(side: "input" | "output", lane: Lane) {
  return side === "input" ? INPUT_PATHS[lane] : OUTPUT_PATHS[lane];
}

function RouteDot({ side, lane, index }: { side: "input" | "output"; lane: Lane; index: number }) {
  // Negative starts distribute dots across the route immediately, rather
  // than making the first render wait for a stagger to fill the highway.
  const begin = `${-(index * 3.4 + lane * 0.85)}s`;
  return <circle r="2.5" fill="var(--hairline-solid)" opacity="0.8">
    <animateMotion dur="10.2s" begin={begin} repeatCount="indefinite" path={motionPath(side, lane)} />
  </circle>;
}

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function ChargeParticles({ intensity }: { intensity: number }) {
  const duration = 0.72;
  const particleCount = Math.round(4 + intensity * 28);
  return <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[25] size-full overflow-visible" viewBox="0 0 1280 440" preserveAspectRatio="none" style={{ opacity: intensity * 0.9 }}>
    {Array.from({ length: particleCount }, (_, index) => {
      const seed = index * 17 + 43;
      const direction = index % 2 === 0 ? -1 : 1;
      const y = 220 + (seededUnit(seed) - 0.5) * 190;
      const endX = 640 + direction * (80 + seededUnit(seed + 1) * 420);
      const endY = y + (seededUnit(seed + 2) - 0.5) * 28;
      const controlX = 640 + direction * (20 + seededUnit(seed + 3) * 120);
      const radius = 0.7 + seededUnit(seed + 4) * 1.8;
      return <circle key={index} r={radius} fill="var(--oiad-blue)">
        <animateMotion dur={`${duration + seededUnit(seed + 5) * 0.42}s`} begin={`${-(seededUnit(seed + 6) * duration)}s`} repeatCount="indefinite" path={`M640 ${y} Q${controlX} ${y + (seededUnit(seed + 7) - 0.5) * 34} ${endX} ${endY}`} />
        <animate attributeName="opacity" dur={`${duration + seededUnit(seed + 5) * 0.42}s`} begin={`${-(seededUnit(seed + 6) * duration)}s`} repeatCount="indefinite" values="0;0.9;0" keyTimes="0;0.12;1" />
      </circle>;
    })}
  </svg>;
}

function CenterChargeGlow({ intensity }: { intensity: number }) {
  return <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 size-full" viewBox="0 0 1280 440" preserveAspectRatio="none">
    <defs>
      <radialGradient id="centre-charge-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="var(--oiad-blue)" stopOpacity="0.42" />
        <stop offset="0.42" stopColor="var(--oiad-blue)" stopOpacity="0.16" />
        <stop offset="1" stopColor="var(--oiad-blue)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="640" cy="220" rx={35 + intensity * 620} ry={72 + intensity * 330} fill="url(#centre-charge-glow)" opacity={Math.min(1, intensity * 1.2)} />
  </svg>;
}

function FullscreenChargeGlow({ intensity }: { intensity: number }) {
  const takeover = Math.max(0, (intensity - 0.5) / 0.5);
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]" style={{ opacity: takeover, background: "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--oiad-blue) 78%, white) 0%, color-mix(in srgb, var(--oiad-blue) 42%, transparent) 42%, color-mix(in srgb, var(--oiad-blue) 16%, transparent) 74%, var(--oiad-blue) 100%)", transition: "opacity 80ms linear" }} />;
}

function SeamMagic({ side, pairIndex }: { side: "input" | "output"; pairIndex: number }) {
  // Source and target share this clock: their inside-edge glow rises only
  // during the exact exit / entry moment of their matched transformation.
  const begin = `${pairIndex * 1.9}s`;
  const glowX = side === "input" ? 539 : 0;
  const edgeX = side === "input" ? 640 : 0;
  const direction = side === "input" ? -1 : 1;
  const pulseTimes = "0;0.4;0.455;0.485;0.515;0.545;0.59;1";
  const particles = Array.from({ length: 10 }, (_, index) => {
    // Stable seeds keep the fire-like motion organic without changing on a
    // re-render or causing server/client hydration differences.
    const seed = pairIndex * 31 + index * 7 + (side === "input" ? 0 : 101);
    const birth = 0.435 + seededUnit(seed) * 0.095;
    const peak = birth + 0.035 + seededUnit(seed + 1) * 0.03;
    const death = peak + 0.075 + seededUnit(seed + 2) * 0.07;
    const startY = 220 + (seededUnit(seed + 3) - 0.5) * 58;
    const apexY = startY + (seededUnit(seed + 4) - 0.5) * 8;
    const endY = startY + (seededUnit(seed + 5) - 0.5) * 14;
    const apexX = edgeX + direction * (10 + seededUnit(seed + 6) * 36);
    const endX = edgeX + direction * (28 + seededUnit(seed + 7) * 68);
    return { birth, peak, death, startY, apexY, endY, apexX, endX, r: 1.15 + seededUnit(seed + 8) * 1.75 };
  });
  return <>
    <rect x={glowX} y="87.5" width="101" height="265" fill={`url(#seam-glow-${side})`} opacity="0">
      <animate attributeName="opacity" dur="11.4s" begin={begin} repeatCount="indefinite" values="0;0;0.2;0.48;0.25;0.58;0.16;0" keyTimes={pulseTimes} />
    </rect>
    {particles.map((particle, index) => {
      const startX = edgeX + direction * 2;
      const times = `0;${particle.birth};${particle.peak};${particle.death};1`;
      return <circle key={index} cx={startX} cy={particle.startY} r={particle.r} fill="var(--oiad-blue)" opacity="0">
        <animate attributeName="opacity" dur="11.4s" begin={begin} repeatCount="indefinite" values="0;0;0.82;0;0" keyTimes={times} />
        <animate attributeName="cx" dur="11.4s" begin={begin} repeatCount="indefinite" values={`${startX};${startX};${particle.apexX};${particle.endX};${startX}`} keyTimes={times} />
        <animate attributeName="cy" dur="11.4s" begin={begin} repeatCount="indefinite" values={`${particle.startY};${particle.startY};${particle.apexY};${particle.endY};${particle.startY}`} keyTimes={times} />
        <animate attributeName="r" dur="11.4s" begin={begin} repeatCount="indefinite" values={`0;0;${particle.r};0;0`} keyTimes={times} />
      </circle>;
    })}
  </>;
}

function SvgFlowItem({ asset, lane, cycle, side }: { asset: Asset; lane: Lane; cycle: number; side: "input" | "output" }) {
  // Each invisible run starts a full panel-width before its own box. At the
  // midpoint both icon centres occupy the shared seam (input x=640, output
  // x=0); overflow clipping then makes one continuous, transformed object.
  const path = motionPath(side, lane);
  // The straight middle route has exact horizontal distances, so its seam
  // point is calculated exactly: x=640 in the input panel and x=0 after the
  // output has travelled 640px from -640. This keeps both halves aligned.
  const seamPoint = lane === 1
    ? side === "input" ? "0.5" : "0.470588"
    : side === "input" ? "0.511" : "0.461";
  // Six pairs are evenly distributed across one 11.4s loop. A fresh pair
  // arrives every 1.9s, then the first pair restarts immediately after #06,
  // creating a continuous conveyor rather than two batches of three.
  const pairIndex = cycle * 3 + lane;
  const delay = `${pairIndex * 1.9}s`;
  return <g visibility="hidden">
    {/* Prevent delayed lanes from flashing at their SVG origin before their
        animateMotion clock begins. Once started, panel clipping does all
        hiding naturally. */}
    <set attributeName="visibility" to="visible" begin={delay} fill="freeze" />
    <g>
      <animateMotion dur="11.4s" begin={delay} repeatCount="indefinite" calcMode="linear" keyPoints={`0;${seamPoint};1`} keyTimes="0;0.5;1" path={path} />
      <rect x="-28" y="-28" width="56" height="56" rx="16" fill="var(--surface)" stroke="var(--hairline-solid)" />
      {asset.image ? <image href={asset.image} x="-18" y="-18" width="36" height="36" preserveAspectRatio="xMidYMid meet" /> : <text x="0" y="10" textAnchor="middle" fontSize="27" fill={asset.tint}>{asset.label}</text>}
    </g>
  </g>;
}

function AssetPairControls({ sources, targets, onFile }: { sources: Asset[]; targets: Asset[]; onFile: (side: "source" | "target", index: number, file?: File) => void }) {
  return <section className="mt-5 rounded-2xl border border-hairline bg-surface p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bricolage text-lg font-semibold">Transformation pairs</h2><p className="mt-1 text-sm text-muted">Each input and output with the same number travel together.</p></div><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">PNG / SVG</span></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {sources.map((source, index) => <div key={index} className="rounded-xl bg-black/[0.04] p-2.5 dark:bg-white/[0.07]">
        <p className="mb-2 font-mono text-[10px] font-semibold tracking-[0.15em] text-[var(--oiad-blue)]">GROUP {String(index + 1).padStart(2, "0")}</p>
        <div className="grid grid-cols-2 gap-2">
          <AssetPicker label="Input" asset={source} onFile={(file) => onFile("source", index, file)} />
          <AssetPicker label="Output" asset={targets[index]} onFile={(file) => onFile("target", index, file)} />
        </div>
      </div>)}
    </div>
  </section>;
}

function AssetPicker({ label, asset, onFile }: { label: string; asset: Asset; onFile: (file?: File) => void }) {
  return <label className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-hairline bg-surface p-2 transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"><span className="flex size-9 items-center justify-center text-base"><AssetMark asset={asset} /></span><span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{label}</span><IconUpload size={13} className="text-[var(--oiad-blue)]" /><input type="file" accept="image/png,image/svg+xml" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} /></label>;
}
