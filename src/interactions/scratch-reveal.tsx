"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

export type ScratchRevealProps = {
  className?: string;
  reward?: string;
  label?: string;
  code?: string;
  accent?: string;
  brushSize?: number;
  coating?: "silver" | "dark";
  tilt?: boolean;
  fill?: boolean;
};

const W = 960;
const H = 500;

export function ScratchReveal({ className = "", reward = "$299", label = "FOR YOU", code = "MAKE299", accent = "#00b7ae", brushSize = 52, coating = "silver", tilt = true, fill = false }: ScratchRevealProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const card = React.useRef<HTMLDivElement>(null);
  const drawing = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = React.useState(0);
  const reduced = useReducedMotion();

  const paintCoating = React.useCallback(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(W, H);
    for (let i = 0; i < image.data.length; i += 4) {
      const noise = ((i / 4 * 1103515245 + 12345) >>> 0) % 19;
      const tone = coating === "dark" ? 17 + noise : 183 + noise;
      image.data[i] = tone; image.data[i + 1] = coating === "dark" ? tone + 8 : tone + 3; image.data[i + 2] = coating === "dark" ? tone + 12 : tone + 1; image.data[i + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    context.fillStyle = coating === "dark" ? "rgba(0,210,200,.25)" : "rgba(255,255,255,.38)";
    for (let y = 12; y < H; y += 21) for (let x = 12; x < W; x += 21) { context.beginPath(); context.arc(x + (Math.floor(y / 21) % 2) * 10, y, 2.2, 0, Math.PI * 2); context.fill(); }
  }, [coating]);

  React.useEffect(() => { paintCoating(); }, [paintCoating]);

  const scratch = (event: React.PointerEvent<HTMLCanvasElement>, start = false) => {
    if (!drawing.current && !start) return;
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: (event.clientX - bounds.left) / bounds.width * W, y: (event.clientY - bounds.top) / bounds.height * H };
    const previous = start ? point : last.current ?? point;
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = (event.pointerType === "touch" ? brushSize * 1.35 : brushSize) * 2;
    context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(point.x, point.y); context.stroke();
    last.current = point;
  };
  const stop = () => {
    drawing.current = false; last.current = null;
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const pixels = context.getImageData(0, 0, W, H).data;
    let clear = 0, total = 0;
    for (let y = 8; y < H; y += 12) for (let x = 8; x < W; x += 12) { total++; if (pixels[(y * W + x) * 4 + 3] < 80) clear++; }
    setProgress(Math.round(clear / total * 100));
  };
  const frame = fill ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%" } : { width: "min(92vw, 760px)" };

  return <div className={`relative ${className}`} style={frame} onPointerMove={(event) => {
    if (!tilt || reduced || !card.current || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5, y = (event.clientY - bounds.top) / bounds.height - .5;
    card.current.style.transform = `perspective(900px) rotateX(${y * -7}deg) rotateY(${x * 9}deg) translateY(-3px)`;
    card.current.style.setProperty("--scratch-x", `${(x + .5) * 100}%`); card.current.style.setProperty("--scratch-y", `${(y + .5) * 100}%`);
  }} onPointerLeave={() => { if (card.current) card.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)"; }}>
    <div ref={card} className="relative mx-auto h-full w-full overflow-hidden rounded-[22px] bg-[#0b1111] p-[clamp(12px,3%,26px)] shadow-[0_30px_54px_rgba(0,0,0,.22)] transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] dark:bg-[#050808]" style={{ containerType: "inline-size" }}>
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at var(--scratch-x, 55%) var(--scratch-y, 32%), ${accent}80, transparent 42%)` }} />
      <div className="relative flex items-center justify-between font-mono text-[clamp(8px,1.8cqw,13px)] uppercase tracking-[.2em] text-white/75"><span>01 ♥</span><span>{label}</span></div>
      <div className="relative mt-[clamp(12px,3%,24px)] h-[calc(100%-42px)] overflow-hidden rounded-[17px]" style={{ background: `radial-gradient(circle at 72% 22%, ${accent}, #063c3b 52%, #071211 100%)` }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.36)_1.2px,transparent_1.6px)] [background-size:19px_19px] opacity-70" />
        <div className="absolute inset-0 grid place-items-center px-[8cqw]"><div className="w-full text-center text-white"><p className="font-mono text-[clamp(8px,1.7cqw,12px)] tracking-[.28em] text-white/70">YOUR CREDIT</p><strong className="mt-[1cqw] block font-mono text-[clamp(38px,12.5cqw,98px)] font-normal tracking-[-.1em] tabular-nums">{reward}</strong><span className="mt-[1.8cqw] inline-block border-t border-white/35 pt-[1.6cqw] font-mono text-[clamp(7px,1.45cqw,10px)] tracking-[.22em] text-white/78">UNLOCKED</span></div></div>
        <div className="absolute bottom-[clamp(12px,3cqw,20px)] left-[clamp(12px,3cqw,20px)] right-[clamp(12px,3cqw,20px)] flex justify-between font-mono text-[clamp(7px,1.55cqw,11px)] leading-relaxed tracking-[.12em] text-white/80"><span>PLAN / PRO<br />CODE / {code}</span><span className="text-right">GENERATED<br />JUST FOR YOU</span></div>
        <canvas ref={canvas} width={W} height={H} aria-label="Scratch the coating to reveal the reward" className="absolute inset-0 h-full w-full touch-none cursor-crosshair" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; scratch(event, true); }} onPointerMove={scratch} onPointerUp={stop} onPointerCancel={stop} />
      </div>
    </div>
    {!fill && <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[.16em] text-muted">{progress}% uncovered</p>}
  </div>;
}
