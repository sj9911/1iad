"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Action, clamp, useSound } from "./shared";

const W = 960, H = 500;

export function ScratchReveal() {
  const card = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);
  const seed = useRef(719);
  const lastSound = useRef(0);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const play = useSound();

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    // A fixed drawing buffer preserves the scratches when the card resizes.
    let n = 231;
    const random = () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
    const pixels = ctx.createImageData(W, H);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const tone = 186 + Math.floor(random() * 22);
      pixels.data[i] = tone; pixels.data[i + 1] = tone + 3; pixels.data[i + 2] = tone + 1; pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    for (let y = 10; y < H; y += 19) for (let x = 10; x < W; x += 19) {
      ctx.beginPath(); ctx.arc(x + (Math.floor(y / 19) % 2) * 9.5, y, 2.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${.3 + random() * .3})`; ctx.fill();
    }
  }, []);

  const illuminate = (event: PointerEvent<HTMLDivElement>) => {
    const element = card.current;
    if (!element) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1), y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    element.style.setProperty("--scratch-x", `${x * 100}%`);
    element.style.setProperty("--scratch-y", `${y * 100}%`);
    if (event.pointerType === "mouse" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.style.transform = `perspective(900px) rotateX(${(y - .5) * -9}deg) rotateY(${(x - .5) * 11}deg) translateY(-3px)`;
    }
  };

  const scratch = (event: PointerEvent<HTMLCanvasElement>, start = false) => {
    if ((!drawing.current && !start) || revealed) return;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const p = { x: (event.clientX - bounds.left) / bounds.width * W, y: (event.clientY - bounds.top) / bounds.height * H };
    const last = start ? p : previous.current ?? p;
    const distance = Math.hypot(p.x - last.x, p.y - last.y);
    const steps = Math.max(1, Math.ceil(distance / 7));
    const radius = event.pointerType === "touch" ? 45 : 36;
    ctx.globalCompositeOperation = "destination-out";
    const random = () => { seed.current = (seed.current * 1664525 + 1013904223) >>> 0; return seed.current / 4294967296; };
    for (let step = 0; step <= steps; step++) {
      const x = last.x + (p.x - last.x) * step / steps, y = last.y + (p.y - last.y) * step / steps;
      ctx.beginPath();
      for (let tooth = 0; tooth < 40; tooth++) {
        const angle = tooth / 40 * Math.PI * 2, r = radius * (.82 + random() * .3);
        const bx = x + Math.cos(angle) * r, by = y + Math.sin(angle) * r;
        if (tooth === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
      }
      ctx.closePath(); ctx.fill();
    }
    previous.current = p;
    if (performance.now() - lastSound.current > 85) { play(620 + Math.min(distance, 80) * 3, "paper", .3); lastSound.current = performance.now(); }
  };

  const finish = () => {
    drawing.current = false; previous.current = null;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || revealed) return;
    const pixels = ctx.getImageData(0, 0, W, H).data;
    let empty = 0, samples = 0;
    for (let y = 5; y < H; y += 12) for (let x = 5; x < W; x += 12) { samples++; if (pixels[(y * W + x) * 4 + 3] < 100) empty++; }
    setProgress(Math.round(empty / samples * 100));
  };

  const reveal = () => { setRevealed(true); setProgress(100); canvas.current?.getContext("2d")?.clearRect(0, 0, W, H); };

  return <>
    <div className="pg-scratcher-scene" onPointerMove={illuminate} onPointerLeave={() => { if (card.current) card.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)"; }}>
      <div ref={card} className="pg-scratcher-card">
        <div className="pg-scratcher-top"><span className="pg-scratcher-mark" aria-label="One interaction a day">01<span>♥</span></span><span>For you</span></div>
        <div className="pg-scratcher-field">
          <div className="pg-scratcher-prize" aria-label="299 dollar credit">$299</div>
          <div className="pg-scratcher-details"><span>PLAN / PRO<br/>CREDIT / ONE YEAR</span><span>MADE FOR<br/>YOUR NEXT IDEA</span></div>
          <canvas ref={canvas} width={W} height={H} aria-label="Scratch the dotted coating to reveal your reward" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; scratch(event, true); }} onPointerMove={(event) => scratch(event)} onPointerUp={finish} onPointerCancel={finish}/>
        </div>
        <div className="pg-scratcher-light" aria-hidden="true"/>
        <div className="pg-scratcher-grain" aria-hidden="true"/>
      </div>
    </div>
    <div className="pg-controls"><span className="pg-small" role="status">{progress}% uncovered</span>{progress < 40 && !revealed ? <Action onClick={reveal}>Reveal without scratching</Action> : <Action onClick={async () => { reveal(); try { await navigator.clipboard.writeText("MAKE299"); setCopied(true); } catch { setCopied(false); } }}>{copied ? "Copied MAKE299 ✓" : "Reveal & copy code"}</Action>}</div>
    <span className="pg-scratcher-demo">A sample reward, just for playing.</span>
  </>;
}
