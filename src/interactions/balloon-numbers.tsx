"use client";

/* eslint-disable @next/next/no-img-element -- the active digit asset changes at runtime. */

import * as React from "react";

export type BalloonNumbersProps = {
  className?: string;
  value?: string;
  maxDigits?: number;
  balloonSize?: number;
  windStrength?: number;
  repelRadius?: number;
  threadLength?: number;
  interactive?: boolean;
};

type BalloonBody = {
  id: string;
  digit: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
};

const DEFAULT_VALUE = "2026";

function hash(value: number) {
  const x = Math.sin(value * 91.731) * 43758.5453;
  return x - Math.floor(x);
}

function digitsFrom(value: string, maxDigits: number) {
  const digits = value.replace(/\D/g, "").slice(0, maxDigits);
  return digits || "0";
}

export function BalloonNumbers({
  className = "",
  value = DEFAULT_VALUE,
  maxDigits = 12,
  balloonSize = 74,
  windStrength = 1,
  repelRadius = 170,
  threadLength = 74,
  interactive = true,
}: BalloonNumbersProps) {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const balloonNodes = React.useRef(new Map<string, HTMLDivElement>());
  const pointer = React.useRef<{ x: number; y: number } | null>(null);
  const safeDigits = digitsFrom(value, maxDigits);
  const key = `${safeDigits}-${balloonSize}-${threadLength}`;

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const visualHeight = balloonSize * 1.48;
    const radius = balloonSize * 0.47;
    const bodies: BalloonBody[] = [...safeDigits].map((digit, index) => ({
      id: `${digit}-${index}`,
      digit,
      x: radius + 18 + hash(index + 3) * Math.max(1, rect.width - radius * 2 - 36),
      y: visualHeight / 2 + 18 + hash(index + 19) * Math.max(1, rect.height - visualHeight - threadLength - 44),
      vx: (hash(index + 41) - 0.5) * 0.45,
      vy: (hash(index + 67) - 0.5) * 0.25,
      phase: hash(index + 101) * Math.PI * 2,
    }));

    let frame = 0;
    let last = performance.now();
    let wind = 0;
    let targetWind = 0;
    let nextWind = last + 1400 + hash(safeDigits.length) * 2000;

    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 16.667, 2.5);
      last = now;
      const bounds = stage.getBoundingClientRect();
      if (now >= nextWind) {
        targetWind = (hash(now / 1000) * 2 - 1) * 0.18 * windStrength;
        nextWind = now + 1800 + hash(now / 2000) * 2800;
      }
      wind += (targetWind - wind) * 0.018 * elapsed;

      for (const body of bodies) {
        const buoyancy = -0.014 - Math.sin(now / 1250 + body.phase) * 0.006;
        body.vx += (wind + Math.sin(now / 980 + body.phase) * 0.004) * elapsed;
        body.vy += buoyancy * elapsed;

        const mouse = pointer.current;
        if (interactive && mouse) {
          const dx = body.x - mouse.x;
          const dy = body.y - mouse.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < repelRadius) {
            const force = Math.pow(1 - distance / repelRadius, 2) * 1.35;
            body.vx += (dx / distance) * force * elapsed;
            body.vy += (dy / distance) * force * elapsed;
          }
        }
      }

      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          const a = bodies[i];
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          const minimum = radius * 1.78;
          if (distance >= minimum) continue;
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minimum - distance;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) {
            const impulse = relative * 0.58;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
          }
        }
      }

      for (const body of bodies) {
        body.vx *= 0.992;
        body.vy *= 0.992;
        body.x += body.vx * elapsed;
        body.y += body.vy * elapsed;

        const minX = radius + 12;
        const maxX = Math.max(minX, bounds.width - radius - 12);
        const minY = visualHeight / 2 + 8;
        const maxY = Math.max(minY, bounds.height - visualHeight / 2 - threadLength - 10);
        if (body.x < minX || body.x > maxX) body.vx *= -0.6;
        if (body.y < minY || body.y > maxY) body.vy *= -0.58;
        body.x = Math.min(maxX, Math.max(minX, body.x));
        body.y = Math.min(maxY, Math.max(minY, body.y));

        const node = balloonNodes.current.get(body.id);
        if (node) {
          const tilt = Math.max(-9, Math.min(9, body.vx * 12));
          node.style.transform = `translate3d(${body.x - balloonSize / 2}px, ${body.y - visualHeight / 2}px, 0) rotate(${tilt}deg)`;
          node.style.setProperty("--thread-sway", `${Math.max(-16, Math.min(16, body.vx * -14))}`);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [balloonSize, interactive, key, repelRadius, safeDigits, threadLength, windStrength]);

  function movePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  return (
    <div
      ref={stageRef}
      className={`relative aspect-[32/14.3] w-[min(92vw,900px)] overflow-hidden rounded-2xl border border-hairline bg-[linear-gradient(180deg,#fffdf8_0%,#f7f5f0_100%)] shadow-[0_24px_72px_rgba(90,72,31,.12)] dark:bg-[linear-gradient(180deg,#1c1b19_0%,#12110f_100%)] ${className}`}
      onPointerMove={movePointer}
      onPointerLeave={() => { pointer.current = null; }}
      aria-label={`Floating balloon number ${safeDigits}`}
    >
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[#c89c36]/30" />
      <div aria-hidden="true" className="absolute inset-x-8 bottom-6 h-12 rounded-full bg-[#d7ac46]/10 blur-2xl" />
      {[...safeDigits].map((digit, index) => {
        const id = `${digit}-${index}`;
        return (
          <div
            key={id}
            ref={(node) => {
              if (node) balloonNodes.current.set(id, node);
              else balloonNodes.current.delete(id);
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: balloonSize, height: balloonSize * 1.48 + threadLength }}
          >
            <img src={`/balloon-numbers/${digit}.svg`} alt="" draggable={false} className="pointer-events-none mx-auto block max-w-full select-none drop-shadow-[0_10px_12px_rgba(93,67,13,.18)]" style={{ height: balloonSize * 1.48 }} />
            <svg aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2" style={{ top: balloonSize * 1.48 - 3, height: threadLength, width: balloonSize * 0.9 }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M50 0 C68 28, 32 66, 50 100" fill="none" stroke="rgba(117, 83, 23, .6)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
