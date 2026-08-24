"use client";

/**
 * 1IAD Day 6 — Shader Button
 * A button whose thick border is a live WebGL fragment shader: kaleidoscopic
 * textile patterns (chevrons, diamonds, stripes, triangles) morph and flow
 * around the band in warm gold, copper, and hot pink. Hovering accelerates
 * the flow and blooms the halo; pressing compresses the button.
 * Falls back to a CSS conic gradient when WebGL is unavailable.
 *
 * Self-contained: React + Tailwind only, no animation library.
 * https://x.com/sunnyxdesign — built in public, one interaction a day.
 */

import * as React from "react";

// halo + fallback ring share the shader's palette
const COLORS =
  "#d9a626, #99521a, #e6802e, #eb4073, #ffc74d, #d9a626";

const CSS = `
@property --sb-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
@keyframes sb-spin { to { --sb-angle: 360deg; } }
.sb-root { animation: sb-spin 4s linear infinite; }
.sb-paint {
  background: conic-gradient(from var(--sb-angle), ${COLORS});
}
/* the border band: contents masked to a ring of --t thickness */
.sb-ring {
  padding: var(--t);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
@media (prefers-reduced-motion: reduce) {
  .sb-root { animation: none; }
}
`;

/* --- the kaleidoscope band shader (adapted from a fullscreen mandala:
       center glow, rings, and edge fade removed — a border band only
       ever samples the outer field) --- */
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_symmetry;
uniform float u_speed;
uniform float u_boost;

#define PI 3.14159265359
#define TAU 6.28318530718

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
vec2 kaleidoscope(vec2 uv, float segments) {
  float angle = atan(uv.y, uv.x);
  float r = length(uv);
  float segAngle = TAU / segments;
  angle = mod(angle, segAngle);
  angle = abs(angle - segAngle * 0.5);
  return vec2(cos(angle), sin(angle)) * r;
}
float stripePattern(vec2 p, float t) {
  float s1 = step(0.5, fract(p.x * 3.0 + t * 0.3));
  float s2 = step(0.5, fract(p.y * 4.0 - t * 0.2));
  return s1 * 0.5 + s2 * 0.5;
}
float chevronPattern(vec2 p, float t) {
  float y = p.y + t * 0.15;
  float chevron = abs(fract(p.x * 2.0) - 0.5) * 2.0;
  chevron = abs(fract(chevron + y * 3.0) - 0.5) * 2.0;
  return smoothstep(0.3, 0.35, chevron);
}
float diamondPattern(vec2 p, float t) {
  vec2 q = rot(PI * 0.25) * p;
  float d = abs(fract(q.x * 2.5 + t * 0.1) - 0.5) + abs(fract(q.y * 2.5 - t * 0.08) - 0.5);
  return smoothstep(0.4, 0.42, d);
}
float trianglePattern(vec2 p, float t) {
  vec2 q = p * 3.0;
  q.x += floor(q.y) * 0.5;
  vec2 f = fract(q) - 0.5;
  float tri = abs(f.x) + abs(f.y);
  float anim = sin(t * 0.4 + floor(q.x) * 1.3 + floor(q.y) * 0.7) * 0.15;
  return smoothstep(0.45 + anim, 0.47 + anim, tri);
}
vec3 palette(float t, float patIdx) {
  vec3 c0 = vec3(0.85, 0.65, 0.15);
  vec3 c1 = vec3(0.60, 0.30, 0.08);
  vec3 c2 = vec3(0.90, 0.50, 0.18);
  vec3 c3 = vec3(0.92, 0.25, 0.45);
  vec3 c4 = vec3(1.00, 0.78, 0.30);
  float phase = fract(t + patIdx * 0.2);
  vec3 col;
  if (phase < 0.2) col = mix(c0, c1, phase / 0.2);
  else if (phase < 0.4) col = mix(c1, c2, (phase - 0.2) / 0.2);
  else if (phase < 0.6) col = mix(c2, c3, (phase - 0.4) / 0.2);
  else if (phase < 0.8) col = mix(c3, c4, (phase - 0.6) / 0.2);
  else col = mix(c4, c0, (phase - 0.8) / 0.2);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / u_res.y;
  float t = u_time * u_speed;
  float segments = u_symmetry;

  uv = rot(t * 0.12) * uv;
  float r = length(uv);

  vec2 kuv = kaleidoscope(uv, segments);
  kuv *= 3.5 * (1.0 + sin(t * 0.35) * 0.15);
  kuv += vec2(t * 0.05, t * 0.03);

  float chev = chevronPattern(kuv * 1.2, t);
  float diam = diamondPattern(kuv * 0.8 + vec2(t * 0.02), t * 1.2);
  vec2 stripeUV = rot(t * 0.08) * kuv;
  float stripe = stripePattern(stripeUV * 1.5, t);
  float tri = trianglePattern(kuv * 0.9 + vec2(sin(t * 0.2) * 0.3), t);

  float morphPhase = fract(t * 0.06);
  float m0 = smoothstep(0.0, 0.1, morphPhase) * smoothstep(0.35, 0.25, morphPhase);
  float m1 = smoothstep(0.2, 0.3, morphPhase) * smoothstep(0.55, 0.45, morphPhase);
  float m2 = smoothstep(0.4, 0.5, morphPhase) * smoothstep(0.75, 0.65, morphPhase);
  float m3 = smoothstep(0.6, 0.7, morphPhase) * smoothstep(0.95, 0.85, morphPhase);
  float mSum = m0 + m1 + m2 + m3;
  if (mSum < 0.3) {
    m0 = max(m0, 0.3);
    m1 = max(m1, 0.2);
  }
  float pattern = chev * m0 + diam * m1 + stripe * m2 + tri * m3;
  float basePat = diamondPattern(kuv * 1.1, t * 0.7) * 0.35;
  pattern = max(pattern, basePat);

  vec2 kuv2 = kaleidoscope(uv * 1.3, segments + 2.0);
  kuv2 *= 1.0 + sin(t * 0.25) * 0.1;
  kuv2 += vec2(t * 0.03, -t * 0.04);
  float innerPattern = chevronPattern(kuv2, t * 0.8) * 0.4;
  innerPattern += trianglePattern(kuv2 * 1.2, t * 0.6) * 0.3;

  float colorPhase = t * 0.04 + r * 0.5;
  vec3 col1 = palette(colorPhase, 0.0);
  vec3 col2 = palette(colorPhase + 0.3, 1.0);
  vec3 col3 = palette(colorPhase + 0.6, 2.0);

  vec3 col = vec3(0.45, 0.22, 0.07) + col1 * 0.25;
  col = mix(col, col1 * 1.25, pattern * 0.9);
  col = mix(col, col2, innerPattern * 0.5);

  float foldAngle = atan(uv.y, uv.x);
  float foldDist = abs(sin(foldAngle * segments * 0.5));
  float foldLine = smoothstep(0.02, 0.0, 1.0 - foldDist) * 0.6;
  foldLine *= 0.5 + 0.5 * sin(t * 0.5 + r * 4.0);
  col += col3 * foldLine;

  float pinkFlash = sin(t * 0.7 + r * 6.0) * cos(foldAngle * 3.0 + t * 0.4);
  pinkFlash = pow(max(pinkFlash, 0.0), 6.0) * 0.8;
  col += vec3(0.95, 0.2, 0.5) * pinkFlash;

  float tex = noise(gl_FragCoord.xy * 0.5) * 0.04 - 0.02;
  col += tex;

  col = col / (1.0 + col * 0.3);
  col = pow(max(col, vec3(0.0)), vec3(0.92, 0.96, 1.06));

  col = mix(vec3(dot(col, vec3(0.333))), col, 1.0 + (u_boost - 1.0) * 0.8) * u_boost;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function ShaderButton({
  children = "Home",
  icon,
  thickness = 3,
  symmetry = 8,
  onClick,
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  thickness?: number;
  symmetry?: number;
  onClick?: () => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  // hover accelerates the flow; the loop lerps toward this target
  const speedTarget = React.useRef(0.5);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return; // CSS conic fallback stays visible underneath

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("ShaderButton compile:", gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("ShaderButton link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uSymmetry = gl.getUniformLocation(prog, "u_symmetry");
    const uSpeed = gl.getUniformLocation(prog, "u_speed");
    const uBoost = gl.getUniformLocation(prog, "u_boost");

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => {
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let speed = 0.5;
    let raf = 0;
    const render = (now: number) => {
      speed += (speedTarget.current - speed) * 0.06;
      // every frame, not just on resize: a remount reuses the context but
      // compiles a fresh program whose u_res would otherwise stay (0,0)
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 40 : now * 0.001); // frozen but composed
      gl.uniform1f(uSymmetry, symmetry);
      gl.uniform1f(uSpeed, speed);
      // hotter band on light backgrounds, where the warm palette goes muddy
      gl.uniform1f(
        uBoost,
        document.documentElement.classList.contains("dark") ? 1.0 : 1.45,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // no loseContext() here: React's dev double-mount would get the same,
    // permanently dead context back from getContext on the second pass
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [symmetry]);

  return (
    <button
      onClick={onClick}
      onPointerEnter={() => (speedTarget.current = 1.6)}
      onPointerLeave={() => (speedTarget.current = 0.5)}
      className="sb-root group relative flex select-none items-center gap-5 rounded-full border border-black/10 bg-gradient-to-b from-white to-neutral-200 p-2 pr-9 text-neutral-900 shadow-[0_2px_6px_rgba(0,0,0,0.08),0_12px_28px_rgba(0,0,0,0.10)] outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-[#e6802e] focus-visible:ring-offset-4 active:scale-[0.97] dark:border-white/10 dark:from-[#2e2e30] dark:to-[#151517] dark:text-neutral-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <style>{CSS}</style>
      {/* the icon well: the shader shows as a thin prismatic ring around it */}
      <span aria-hidden="true" className="relative size-14 shrink-0 rounded-full">
        {/* soft halo behind the ring; blooms on hover */}
        <span className="sb-paint absolute -inset-1.5 rounded-full opacity-65 blur-md transition-opacity duration-300 group-hover:opacity-100 dark:opacity-45 dark:group-hover:opacity-90" />
        {/* CSS conic ring — visible only if WebGL is unavailable */}
        <span
          className="sb-paint sb-ring absolute inset-0 rounded-full"
          style={{ "--t": `${thickness}px` } as React.CSSProperties}
        />
        {/* the shader: fills the circle; the embossed face occludes the
            middle, so only the ring shows. (A CSS ring mask on the canvas
            is unreliable — Chromium mask-composite vs. composited layers.) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full overflow-hidden rounded-full"
        />
        {/* embossed face */}
        <span
          className="absolute rounded-full border border-white/70 bg-gradient-to-b from-white to-neutral-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18),inset_0_-1px_1px_rgba(255,255,255,0.55)] dark:border-white/10 dark:from-[#2e2e30] dark:to-[#151517] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.65),inset_0_-1px_1px_rgba(255,255,255,0.06)]"
          style={{ inset: thickness }}
        />
        {/* the icon, softly embossed */}
        <span className="absolute inset-0 flex items-center justify-center text-neutral-600 [filter:drop-shadow(0_1px_1px_rgba(255,255,255,0.6))] dark:text-neutral-100 dark:[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.7))]">
          {icon ?? (
            <svg viewBox="0 0 24 24" className="size-6 fill-current">
              <path d="M11.3 3.3a1 1 0 0 1 1.4 0l7.6 7.2a.7.7 0 0 1-.48 1.2H18.4v7.05a1.25 1.25 0 0 1-1.25 1.25H14.2v-4.9a.9.9 0 0 0-.9-.9h-2.6a.9.9 0 0 0-.9.9v4.9H6.85A1.25 1.25 0 0 1 5.6 18.75V11.7H4.18a.7.7 0 0 1-.48-1.2Z" />
            </svg>
          )}
        </span>
      </span>
      <span className="relative text-xl font-semibold tracking-tight">
        {children}
      </span>
    </button>
  );
}
