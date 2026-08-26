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
  clusterSpacing?: number;
  floatiness?: number;
  stringColor?: string;
  aspectRatio?: string;
  showBackdrop?: boolean;
  fill?: boolean;
  interactive?: boolean;
};

type BalloonBody = {
  id: string;
  digit: string;
  x: number;
  y: number;
  anchorX: number;
  vx: number;
  vy: number;
  phase: number;
  angle: number;
  angularVelocity: number;
  lift: number;
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
  threadLength = 160,
  clusterSpacing = 1.14,
  floatiness = 1,
  stringColor = "#69501f",
  aspectRatio = "32 / 14.3",
  showBackdrop = true,
  fill = false,
  interactive = true,
}: BalloonNumbersProps) {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const balloonNodes = React.useRef(new Map<string, HTMLDivElement>());
  const threadNodes = React.useRef(new Map<string, SVGPathElement>());
  const pointer = React.useRef<{ x: number; y: number } | null>(null);
  const safeDigits = digitsFrom(value, maxDigits);
  const key = `${safeDigits}-${balloonSize}-${threadLength}-${clusterSpacing}`;

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rect = stage.getBoundingClientRect();
    const visualHeight = balloonSize * 1.48;
    const radius = balloonSize * 0.47;
    const initialTetherLength = Math.min(threadLength, Math.max(32, rect.height - visualHeight - 18));
    const availableWidth = Math.max(0, rect.width - (radius + 12) * 2);
    const preferredAnchorSpacing = balloonSize * clusterSpacing;
    const anchorSpacing = safeDigits.length > 1
      ? Math.min(preferredAnchorSpacing, availableWidth / (safeDigits.length - 1))
      : 0;
    const centeredAnchorX = (index: number) => rect.width / 2 + (index - (safeDigits.length - 1) / 2) * anchorSpacing;
    const bodies: BalloonBody[] = [...safeDigits].map((digit, index) => {
      const anchorX = centeredAnchorX(index);
      const startOffsetX = (hash(index + 3) - 0.5) * 24;
      const anchorY = rect.height - 10;
      const verticalReach = Math.sqrt(Math.max(0, initialTetherLength ** 2 - startOffsetX ** 2));
      return {
        id: `${digit}-${index}`,
        digit,
        // The anchors form one centred, evenly spaced line. Each balloon gets
        // only a tiny offset, so the composition reads as a single bouquet.
        x: anchorX + startOffsetX,
        y: anchorY - verticalReach - visualHeight / 2 + 2,
        anchorX,
        vx: (hash(index + 41) - 0.5) * 0.18,
        vy: (hash(index + 67) - 0.5) * 0.08,
        phase: hash(index + 101) * Math.PI * 2,
        angle: (hash(index + 131) - 0.5) * 5,
        angularVelocity: (hash(index + 151) - 0.5) * 0.04,
        lift: 0.88 + hash(index + 173) * 0.24,
      };
    });

    let frame = 0;
    let last = performance.now();
    let wind = 0;
    let gustDirection = 0;
    let gustStartedAt = -Infinity;
    let gustDuration = 0;
    let nextGust = last + 1900 + hash(safeDigits.length) * 2800;

    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 16.667, 2.5);
      last = now;
      const bounds = stage.getBoundingClientRect();
      const tetherLength = Math.min(threadLength, Math.max(32, bounds.height - visualHeight - 18));
      const liveAvailableWidth = Math.max(0, bounds.width - (radius + 12) * 2);
      const liveAnchorSpacing = safeDigits.length > 1
        ? Math.min(preferredAnchorSpacing, liveAvailableWidth / (safeDigits.length - 1))
        : 0;
      bodies.forEach((body, index) => {
        body.anchorX = bounds.width / 2 + (index - (safeDigits.length - 1) / 2) * liveAnchorSpacing;
      });
      if (!reducedMotion && now >= nextGust) {
        gustDirection = (hash(now / 1000) * 2 - 1) * 0.06 * windStrength;
        gustStartedAt = now;
        // A quick, passing gust: it always settles before one second.
        gustDuration = 430 + hash(now / 2000) * 380;
        nextGust = now + 2600 + hash(now / 3400) * 4200;
      }
      const gustProgress = (now - gustStartedAt) / gustDuration;
      const gustEnvelope = gustProgress > 0 && gustProgress < 1
        ? Math.sin(gustProgress * Math.PI)
        : 0;
      const targetWind = gustDirection * gustEnvelope;
      wind += (targetWind - wind) * 0.16 * elapsed;

      for (const body of bodies) {
        const buoyancy = (-0.013 - Math.sin(now / 1450 + body.phase) * 0.0025 * floatiness) * body.lift;
        const ambientDrift = reducedMotion ? 0 : Math.sin(now / 1700 + body.phase) * 0.0012 * floatiness;
        body.vx += (wind + ambientDrift) * elapsed;
        body.vy += buoyancy * elapsed;

        const mouse = pointer.current;
        if (interactive && !reducedMotion && mouse) {
          const dx = body.x - mouse.x;
          const dy = body.y - mouse.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < repelRadius) {
            const force = Math.pow(1 - distance / repelRadius, 2) * 0.34;
            body.vx += (dx / distance) * force * elapsed;
            body.vy += (dy / distance) * force * elapsed;
            body.angularVelocity += (dx / distance) * force * 0.018 * elapsed;
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
            // Foil balloons deform and lose energy instead of bouncing like balls.
            const impulse = relative * 0.34;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
            a.angularVelocity -= relative * ny * 0.018;
            b.angularVelocity += relative * ny * 0.018;
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
        const maxY = Math.max(minY, bounds.height - visualHeight / 2 - tetherLength - 10);
        if (body.x < minX || body.x > maxX) body.vx *= -0.6;
        if (body.y < minY || body.y > maxY) body.vy *= -0.58;
        body.x = Math.min(maxX, Math.max(minX, body.x));
        body.y = Math.min(maxY, Math.max(minY, body.y));

        // A real tether cannot keep stretching. Once the balloon reaches the
        // chosen string length, it continues to drift along that radius.
        const anchorY = bounds.height - 10;
        const baseY = body.y + visualHeight / 2 - 2;
        const tetherX = body.x - body.anchorX;
        const tetherY = baseY - anchorY;
        const tetherDistance = Math.hypot(tetherX, tetherY) || 1;
        if (tetherDistance > tetherLength) {
          const nx = tetherX / tetherDistance;
          const ny = tetherY / tetherDistance;
          body.x = body.anchorX + nx * tetherLength;
          body.y = anchorY + ny * tetherLength - visualHeight / 2 + 2;
          const outwardVelocity = body.vx * nx + body.vy * ny;
          if (outwardVelocity > 0) {
            body.vx -= outwardVelocity * nx;
            body.vy -= outwardVelocity * ny;
          }
        }

        const targetAngle = reducedMotion
          ? 0
          : Math.max(-7, Math.min(7, body.vx * 8 + Math.sin(now / 2100 + body.phase) * 1.1 * floatiness));
        body.angularVelocity += (targetAngle - body.angle) * 0.012 * elapsed;
        body.angularVelocity *= Math.pow(0.94, elapsed);
        body.angle += body.angularVelocity * elapsed;

        const node = balloonNodes.current.get(body.id);
        if (node) {
          node.style.transform = `translate3d(${body.x - balloonSize / 2}px, ${body.y - visualHeight / 2}px, 0) rotate(${body.angle}deg)`;
        }
        const thread = threadNodes.current.get(body.id);
        if (thread) {
          const startY = body.y + visualHeight / 2 - 2;
          const endY = bounds.height - 10;
          const straightDistance = Math.hypot(body.anchorX - body.x, endY - startY);
          const slack = Math.max(0, tetherLength - straightDistance);
          const airBow = Math.max(-12, Math.min(12, -body.vx * 8));
          const slackBow = Math.sin(body.phase) * Math.min(9, slack * 0.3);
          const bow = airBow + slackBow;
          const height = endY - startY;
          thread.setAttribute("d", `M ${body.x} ${startY} C ${body.x + bow} ${startY + height * 0.28}, ${body.anchorX + bow * 0.72} ${startY + height * 0.7}, ${body.anchorX} ${endY}`);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [balloonSize, clusterSpacing, floatiness, interactive, key, repelRadius, safeDigits, threadLength, windStrength]);

  function movePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  return (
    <div
      ref={stageRef}
      className={`relative w-[min(92%,900px)] overflow-hidden rounded-2xl border border-hairline bg-[linear-gradient(180deg,#fffdf8_0%,#f7f5f0_100%)] shadow-[0_24px_72px_rgba(90,72,31,.12)] dark:bg-[linear-gradient(180deg,#1c1b19_0%,#12110f_100%)] ${className}`}
      style={fill
        ? { position: "absolute", inset: 0, width: "100%", height: "100%", aspectRatio: "auto" }
        : { aspectRatio }}
      onPointerMove={movePointer}
      onPointerLeave={() => { pointer.current = null; }}
      aria-label={`Floating balloon number ${safeDigits}`}
    >
      {showBackdrop && <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[#c89c36]/30" />}
      {showBackdrop && <div aria-hidden="true" className="absolute inset-x-8 bottom-6 h-12 rounded-full bg-[#d7ac46]/10 blur-2xl" />}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" preserveAspectRatio="none">
        {[...safeDigits].map((digit, index) => {
          const id = `${digit}-${index}`;
          return <path key={id} ref={(node) => { if (node) threadNodes.current.set(id, node); else threadNodes.current.delete(id); }} fill="none" stroke={stringColor} strokeOpacity="0.58" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      {[...safeDigits].map((digit, index) => {
        const id = `${digit}-${index}`;
        return (
          <div
            key={id}
            ref={(node) => {
              if (node) balloonNodes.current.set(id, node);
              else balloonNodes.current.delete(id);
            }}
            className="absolute left-0 top-0 origin-[50%_96%] will-change-transform"
            style={{ width: balloonSize, height: balloonSize * 1.48, zIndex: 10 + Math.round(hash(index + 211) * 6) }}
          >
            <img src={`/balloon-numbers/${digit}.svg`} alt="" draggable={false} className="pointer-events-none mx-auto block select-none drop-shadow-[0_10px_12px_rgba(93,67,13,.18)]" style={{ width: balloonSize, height: balloonSize * 1.48, objectFit: "contain", objectPosition: "center bottom" }} />
          </div>
        );
      })}
    </div>
  );
}
