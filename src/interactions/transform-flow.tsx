"use client";

import * as React from "react";

export type TransformPathStyle = "curved" | "linear";

export type TransformFlowProps = {
  className?: string;
  aspectRatio?: string;
  centered?: boolean;
  inputAssets?: string[];
  outputAssets?: string[];
  pathStyle?: TransformPathStyle;
  duration?: number;
  particleCount?: number;
  chargeDuration?: number;
  maxSpeed?: number;
  accent?: string;
  assetSize?: number;
  showGuides?: boolean;
  sound?: boolean;
  interactive?: boolean;
};

export const DEFAULT_INPUT_ASSETS = ["✦", "●", "◆", "✳", "▲", "✢"];
export const DEFAULT_OUTPUT_ASSETS = ["✺", "↗", "✹", "✧", "◼", "☼"];

const INPUT_PATHS = [
  "M0 73H14C104 73 192 92 269 128L351 166C428 202 516 220 606 220H1280",
  "M0 220H1280",
  "M0 367H14C104 367 192 348 269 312L351 274C428 238 516 220 606 220H1280",
];
const OUTPUT_PATHS = [
  "M-640 220H0L0 220H14C104 220 192 201 269 165L351 127C428 91 516 72 606 72H720",
  "M-640 220H720",
  "M-640 220H0L0 220H14C104 220 192 239 269 275L351 313C428 349 516 368 606 368H720",
];
const LINEAR_INPUT = ["M0 104H1280", "M0 220H1280", "M0 336H1280"];
const LINEAR_OUTPUT = ["M-640 104H720", "M-640 220H720", "M-640 336H720"];
const TINTS = ["#002fff", "#7c3aed", "#db2777", "#0ea5e9", "#9333ea", "#e11d48"];

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function panelViewBoxHeight(aspectRatio: string) {
  const [width, height] = aspectRatio.split("/").map((value) => Number(value.trim()));
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? (1280 * height) / width
    : 440;
}

function isImageAsset(value: string) {
  return /^(https?:\/\/|data:image\/)/.test(value);
}

function AssetMark({ value, tint }: { value: string; tint: string }) {
  return isImageAsset(value) ? (
    <image href={value} x="-18" y="-18" width="36" height="36" preserveAspectRatio="xMidYMid meet" />
  ) : (
    <text x="0" y="10" textAnchor="middle" fontSize="27" fill={tint}>{value}</text>
  );
}

export function TransformFlow({
  className = "",
  aspectRatio = "32 / 11",
  centered = false,
  inputAssets = DEFAULT_INPUT_ASSETS,
  outputAssets = DEFAULT_OUTPUT_ASSETS,
  pathStyle = "curved",
  duration = 11.4,
  particleCount = 24,
  chargeDuration = 10,
  maxSpeed = 33,
  accent = "#002fff",
  assetSize = 56,
  showGuides = true,
  sound = true,
  interactive = true,
}: TransformFlowProps) {
  const svgPanels = React.useRef(new Set<SVGSVGElement>());
  const timeline = React.useRef(0);
  const lastFrame = React.useRef<number | null>(null);
  const holding = React.useRef(false);
  const holdStart = React.useRef(0);
  const currentSpeed = React.useRef(1);
  const audioContext = React.useRef<AudioContext | null>(null);
  const oscillator = React.useRef<OscillatorNode | null>(null);
  const gain = React.useRef<GainNode | null>(null);
  const [pointer, setPointer] = React.useState({ x: 0, y: 0, visible: false });
  const [charge, setCharge] = React.useState({ speed: 0, glow: 0, x: 0, y: 0, holding: false });

  const registerSvg = React.useCallback((node: SVGSVGElement | null) => {
    if (!node) return;
    svgPanels.current.add(node);
    node.pauseAnimations();
    node.setCurrentTime(timeline.current);
  }, []);

  const stopSound = React.useCallback(() => {
    const context = audioContext.current;
    const tone = oscillator.current;
    const level = gain.current;
    if (!context || !tone || !level) return;
    level.gain.cancelScheduledValues(context.currentTime);
    level.gain.setValueAtTime(Math.max(level.gain.value, 0.0001), context.currentTime);
    level.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
    tone.stop(context.currentTime + 0.38);
    oscillator.current = null;
    gain.current = null;
  }, []);

  React.useEffect(() => {
    let frame = 0;
    const tick = (time: number) => {
      const previous = lastFrame.current ?? time;
      const elapsed = (time - previous) / 1000;
      const heldFor = holding.current ? time - holdStart.current : 0;
      const speedProgress = holding.current ? Math.min(heldFor / 2700, 1) : 0;
      const glowProgress = holding.current ? Math.min(heldFor / (chargeDuration * 1000), 1) : 0;
      const targetSpeed = holding.current ? 1 + Math.pow(speedProgress, 1.65) * (maxSpeed - 1) : 1;
      const easing = 1 - Math.exp(-elapsed * (holding.current ? 3.1 : 1.45));
      currentSpeed.current += (targetSpeed - currentSpeed.current) * easing;
      timeline.current += elapsed * currentSpeed.current;
      svgPanels.current.forEach((svg) => svg.setCurrentTime(timeline.current));
      if (holding.current) {
        const shake = 0.35 + speedProgress * speedProgress * 3.4;
        setCharge({ speed: speedProgress, glow: glowProgress, x: Math.sin(time * 0.047) * shake, y: Math.cos(time * 0.071) * shake * 0.65, holding: true });
      }
      if (oscillator.current && audioContext.current) oscillator.current.frequency.setTargetAtTime(108 + Math.min(currentSpeed.current, maxSpeed) * 14, audioContext.current.currentTime, 0.05);
      lastFrame.current = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stopSound();
    };
  }, [chargeDuration, maxSpeed, stopSound]);

  function context() {
    if (!audioContext.current) audioContext.current = new AudioContext();
    return audioContext.current;
  }

  function startSound() {
    if (!sound || oscillator.current) return;
    const audio = context();
    void audio.resume();
    const tone = audio.createOscillator();
    const level = audio.createGain();
    tone.type = "sine";
    tone.frequency.setValueAtTime(122, audio.currentTime);
    level.gain.setValueAtTime(0.0001, audio.currentTime);
    level.gain.exponentialRampToValueAtTime(0.028, audio.currentTime + 0.18);
    tone.connect(level).connect(audio.destination);
    tone.start();
    oscillator.current = tone;
    gain.current = level;
  }

  function releaseSound() {
    if (!sound) return;
    const audio = context();
    const tone = audio.createOscillator();
    const level = audio.createGain();
    tone.type = "sine";
    tone.frequency.setValueAtTime(330, audio.currentTime);
    tone.frequency.exponentialRampToValueAtTime(145, audio.currentTime + 0.36);
    level.gain.setValueAtTime(0.0001, audio.currentTime);
    level.gain.exponentialRampToValueAtTime(0.04, audio.currentTime + 0.025);
    level.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.42);
    tone.connect(level).connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + 0.45);
  }

  function hint(event: React.PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, visible: true });
  }

  function begin(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !interactive) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    hint(event);
    holdStart.current = performance.now();
    holding.current = true;
    setCharge((value) => ({ ...value, holding: true }));
    startSound();
  }

  function release() {
    if (!holding.current) return;
    holding.current = false;
    setCharge({ speed: 0, glow: 0, x: 0, y: 0, holding: false });
    stopSound();
    releaseSound();
  }

  const paths = pathStyle === "curved" ? { input: INPUT_PATHS, output: OUTPUT_PATHS } : { input: LINEAR_INPUT, output: LINEAR_OUTPUT };
  const viewBoxHeight = panelViewBoxHeight(aspectRatio);
  const stageStyle = { transform: centered ? `translate(${charge.x}px, -50%)` : `translate(${charge.x}px, ${charge.y}px)`, aspectRatio, "--transform-accent": accent } as React.CSSProperties & { "--transform-accent": string };

  return <div className={`relative w-full overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_24px_72px_rgba(0,0,0,.1)] will-change-transform ${className}`} style={stageStyle}>
    <div className="grid h-full grid-cols-2">
      <TransformPanel side="input" assets={inputAssets} paths={paths.input} duration={duration} assetSize={assetSize} viewBoxHeight={viewBoxHeight} showGuides={showGuides} registerSvg={registerSvg} />
      <TransformPanel side="output" assets={outputAssets} paths={paths.output} duration={duration} assetSize={assetSize} viewBoxHeight={viewBoxHeight} showGuides={showGuides} registerSvg={registerSvg} />
    </div>
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2 bg-[var(--transform-accent)]" style={{ opacity: 0.12 + charge.glow * 0.88, boxShadow: `0 0 ${8 + charge.glow * 62}px color-mix(in srgb, var(--transform-accent) ${18 + charge.glow * 78}%, transparent)` }} />
    <CentreGlow intensity={charge.glow} />
    <ChargeParticles intensity={charge.speed} count={particleCount} />
    {interactive && <button type="button" aria-label="Hold to accelerate the transform flow" className={`absolute inset-0 z-40 touch-none focus:outline-none ${charge.holding ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={begin} onPointerUp={release} onPointerCancel={release} onPointerMove={hint} onPointerEnter={hint} onPointerLeave={() => setPointer((value) => ({ ...value, visible: false }))} />}
    {interactive && <span aria-hidden="true" className="pointer-events-none absolute z-50 rounded-full border border-hairline bg-surface/85 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-muted backdrop-blur-sm transition-opacity duration-150" style={{ left: pointer.x + 12, top: pointer.y + 12, opacity: pointer.visible ? 1 : 0 }}>hold</span>}
  </div>;
}

function TransformPanel({ side, assets, paths, duration, assetSize, viewBoxHeight, showGuides, registerSvg }: { side: "input" | "output"; assets: string[]; paths: string[]; duration: number; assetSize: number; viewBoxHeight: number; showGuides: boolean; registerSvg: (node: SVGSVGElement | null) => void }) {
  const viewBoxTop = (440 - viewBoxHeight) / 2;
  return <div className={`relative overflow-hidden ${side === "input" ? "bg-surface" : "bg-black/[0.018] dark:bg-white/[0.025]"}`}>
    <div className="absolute inset-x-0 top-0 z-10 border-b border-hairline bg-surface/65 px-4 py-3 backdrop-blur-sm"><span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">{side === "input" ? "Input" : "Output"}</span></div>
    <svg ref={registerSvg} className="absolute inset-0 size-full" viewBox={`0 ${viewBoxTop} 640 ${viewBoxHeight}`} preserveAspectRatio="xMidYMid meet" aria-label={`${side} animated transformation paths`}>
      {showGuides ? ([0, 1, 2] as const).map((lane) => <path key={lane} d={paths[lane]} fill="none" stroke="var(--hairline-solid)" strokeWidth="1.25" strokeDasharray="4 7" />) : null}
      {showGuides ? ([0, 1, 2] as const).flatMap((lane) => [0, 1, 2].map((index) => <RouteDot key={`${lane}-${index}`} lane={lane} index={index} path={paths[lane]} />)) : null}
      {assets.slice(0, 6).map((asset, index) => <FlowAsset key={`${asset}-${index}`} asset={asset} tint={TINTS[index]} lane={(index % 3) as 0 | 1 | 2} cycle={Math.floor(index / 3)} side={side} path={paths[index % 3]} duration={duration} assetSize={assetSize} />)}
    </svg>
  </div>;
}

function RouteDot({ lane, index, path }: { lane: 0 | 1 | 2; index: number; path: string }) {
  return <circle r="2.5" fill="var(--hairline-solid)" opacity="0.8"><animateMotion dur="10.2s" begin={`${-(index * 3.4 + lane * 0.85)}s`} repeatCount="indefinite" path={path} /></circle>;
}

function FlowAsset({ asset, tint, lane, cycle, side, path, duration, assetSize }: { asset: string; tint: string; lane: 0 | 1 | 2; cycle: number; side: "input" | "output"; path: string; duration: number; assetSize: number }) {
  const pair = cycle * 3 + lane;
  const delay = `${pair * (duration / 6)}s`;
  const seamPoint = lane === 1 ? (side === "input" ? "0.5" : "0.470588") : (side === "input" ? "0.511" : "0.461");
  return <g visibility="hidden">
    <set attributeName="visibility" to="visible" begin={delay} fill="freeze" />
    <g>
      <animateMotion dur={`${duration}s`} begin={delay} repeatCount="indefinite" calcMode="linear" keyPoints={`0;${seamPoint};1`} keyTimes="0;0.5;1" path={path} />
      <rect x={-assetSize / 2} y={-assetSize / 2} width={assetSize} height={assetSize} rx={assetSize * 0.285} fill="var(--surface)" stroke="var(--hairline-solid)" />
      <g transform={`scale(${assetSize / 56})`}><AssetMark value={asset} tint={tint} /></g>
    </g>
  </g>;
}

function CentreGlow({ intensity }: { intensity: number }) {
  return <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 size-full" viewBox="0 0 1280 440" preserveAspectRatio="none"><defs><radialGradient id="transform-centre-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="var(--transform-accent)" stopOpacity="0.42" /><stop offset="0.42" stopColor="var(--transform-accent)" stopOpacity="0.16" /><stop offset="1" stopColor="var(--transform-accent)" stopOpacity="0" /></radialGradient></defs><ellipse cx="640" cy="220" rx={35 + intensity * 620} ry={72 + intensity * 330} fill="url(#transform-centre-glow)" opacity={Math.min(1, intensity * 1.2)} /></svg>;
}

function ChargeParticles({ intensity, count }: { intensity: number; count: number }) {
  const active = Math.round(4 + intensity * count);
  return <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[25] size-full overflow-visible" viewBox="0 0 1280 440" preserveAspectRatio="none" style={{ opacity: intensity * 0.9 }}>
    {Array.from({ length: active }, (_, index) => {
      const seed = index * 17 + 43;
      const direction = index % 2 === 0 ? -1 : 1;
      const y = 220 + (seededUnit(seed) - 0.5) * 190;
      const endX = 640 + direction * (80 + seededUnit(seed + 1) * 420);
      const endY = y + (seededUnit(seed + 2) - 0.5) * 28;
      const controlX = 640 + direction * (20 + seededUnit(seed + 3) * 120);
      const radius = 0.7 + seededUnit(seed + 4) * 1.8;
      const travel = 0.72 + seededUnit(seed + 5) * 0.42;
      const begin = `${-(seededUnit(seed + 6) * 0.72)}s`;
      return <circle key={index} r={radius} fill="var(--transform-accent)"><animateMotion dur={`${travel}s`} begin={begin} repeatCount="indefinite" path={`M640 ${y} Q${controlX} ${y + (seededUnit(seed + 7) - 0.5) * 34} ${endX} ${endY}`} /><animate attributeName="opacity" dur={`${travel}s`} begin={begin} repeatCount="indefinite" values="0;0.9;0" keyTimes="0;0.12;1" /></circle>;
    })}
  </svg>;
}
