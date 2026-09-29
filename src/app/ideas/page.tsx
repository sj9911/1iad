"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react";

function Study({
  day,
  title,
  note,
  children,
}: {
  day: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-hairline bg-surface shadow-[0_18px_52px_rgba(0,0,0,.07)]">
      <div className="flex items-start justify-between gap-5 border-b border-hairline px-5 py-4 sm:px-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--oiad-blue)]">{day}</p>
          <h2 className="font-bricolage mt-1 text-xl font-semibold tracking-[-0.035em]">{title}</h2>
        </div>
        <p className="max-w-40 pt-1 text-right text-xs leading-relaxed text-muted">{note}</p>
      </div>
      <div className="min-h-[300px]">{children}</div>
    </section>
  );
}

let audioCtx: AudioContext | null = null;
function blip(freq = 660, duration = 0.07, type: OscillatorType = "sine", volume = 0.1) {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    /* audio unavailable */
  }
}

const MODES = ["REC", "PLAY", "FF", "REW"] as const;
type Mode = (typeof MODES)[number];

function TapeDeck() {
  const [mode, setMode] = React.useState<Mode | null>(null);
  const reduced = useReducedMotion();
  const activeIndex = mode ? MODES.indexOf(mode) : -1;
  const reel = (direction: 1 | -1) => (
    <div className="relative size-20 rounded-full border-[5px] border-black/70 bg-[conic-gradient(from_0deg,#1a1a1a_0_25%,#3a3a3a_25%_50%,#1a1a1a_50%_75%,#3a3a3a_75%)]">
      <div className="absolute inset-[30%] rounded-full border-[3px] border-black/70 bg-[#e8e6df]" />
      <motion.div
        className="absolute inset-0"
        animate={{ transform: !reduced && mode && mode !== "REC" ? `rotate(${360 * direction}deg)` : "rotate(0deg)" }}
        transition={{ duration: mode === "FF" ? 0.45 : mode === "REW" ? 0.55 : 2.2, repeat: !reduced && mode && mode !== "REC" ? Infinity : 0, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-[8%] h-[84%] w-[3px] -translate-x-1/2 rounded bg-black/55" />
        <span className="absolute left-[8%] top-1/2 h-[3px] w-[84%] -translate-y-1/2 rounded bg-black/55" />
      </motion.div>
    </div>
  );
  return (
    <div className="relative grid min-h-[300px] place-items-center bg-[linear-gradient(150deg,#f4f1ea,#eceadf)] p-6">
      <div className="w-full max-w-[330px] rounded-2xl border border-black/15 bg-[#efece4] p-5 shadow-[0_14px_34px_rgba(30,25,15,.18)]">
        <div className="flex items-center justify-between gap-4">
          {reel(-1)}
          <div className="flex-1">
            <div
              className="h-1.5 rounded-full bg-[linear-gradient(90deg,#2b2b2b_var(--tape),#d8d4c8_var(--tape))] transition-all duration-500"
              style={{ "--tape": mode === "FF" ? "30%" : mode === "REW" ? "85%" : "58%" } as React.CSSProperties}
            />
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[.22em] text-black/45">OIAD-07 · chrome tape</p>
          </div>
          {reel(1)}
        </div>
        <div className="relative mt-5 flex rounded-xl border border-black/15 bg-[#e3dfd4] p-1">
          {mode && (
            <motion.span
              className="absolute inset-y-1 rounded-lg bg-[#c8322b] shadow-[0_3px_8px_rgba(0,0,0,.28)]"
              initial={false}
              style={{ width: `calc((100% - 8px) / ${MODES.length})` }}
              animate={{ left: `calc(4px + ${activeIndex} * (100% - 8px) / ${MODES.length})` }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            />
          )}
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode((current) => (current === m ? null : m));
                blip(m === "REC" ? 300 : m === "REW" ? 420 : 540, 0.05, "square", 0.07);
              }}
              className={`relative z-10 flex-1 rounded-lg py-2 font-mono text-[11px] font-semibold tracking-[.14em] transition-colors ${mode === m ? "text-white" : "text-black/55 hover:text-black/80"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <p className="absolute bottom-5 text-xs text-muted">{mode ? `${mode} — reels engaged` : "press a transport key"}</p>
    </div>
  );
}

function HoldToCharge() {
  const [frame, setFrame] = React.useState({ p: 0, jx: 0, jy: 0 });
  const [burst, setBurst] = React.useState(false);
  const holding = React.useRef(false);
  const bursting = React.useRef(false);
  const value = React.useRef(0);
  useAnimationFrame(() => {
    if (holding.current) value.current = Math.min(1.35, value.current + 0.011);
    else if (!bursting.current) value.current = Math.max(0, value.current - 0.045);
    const full = value.current >= 1;
    setFrame((prev) => {
      const jx = full ? (Math.random() - 0.5) * 6 : 0;
      const jy = full ? (Math.random() - 0.5) * 6 : 0;
      if (prev.p === value.current && prev.jx === jx && prev.jy === jy) return prev;
      return { p: value.current, jx, jy };
    });
  });
  const progress = frame.p;
  const full = progress >= 1;
  function release() {
    holding.current = false;
    if (value.current >= 1) {
      bursting.current = true;
      setBurst(true);
      blip(880, 0.28, "triangle", 0.12);
      setTimeout(() => {
        setBurst(false);
        value.current = 0;
        bursting.current = false;
      }, 700);
    } else if (value.current > 0.15) {
      blip(180, 0.18, "sawtooth", 0.06);
    }
  }
  return (
    <div className="relative grid min-h-[300px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_58%,#eef1ff,transparent_60%)] p-6">
      <div
        style={{ transform: `translate(${frame.jx}px, ${frame.jy}px)` }}
        className="relative grid size-[150px] place-items-center"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,47,255,.12)" strokeWidth="5" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={full ? "#ff3b30" : "var(--oiad-blue)"}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={283}
            strokeDashoffset={283 - Math.min(progress, 1) * 283}
          />
        </svg>
        <button
          onPointerDown={() => { holding.current = true; blip(320, 0.04, "square", 0.05); }}
          onPointerUp={release}
          onPointerLeave={() => holding.current && release()}
          className="grid size-[86px] select-none place-items-center rounded-full border border-[#002fff]/25 bg-surface text-center font-mono text-[10px] uppercase tracking-[.18em] text-muted shadow-[0_10px_26px_rgba(0,47,255,.14)]"
          style={{ transform: `scale(${1 - Math.min(progress, 1.35) * 0.08})` }}
        >
          {burst ? "burst" : full ? "over!" : "hold"}
        </button>
        {burst && (
          <motion.span
            initial={{ opacity: 0.9, transform: "scale(0.9)" }}
            animate={{ opacity: 0, transform: "scale(2.1)" }}
            transition={{ duration: 0.65, ease: EASE_OUT }}
            className="absolute inset-0 rounded-full border-[3px] border-[var(--oiad-blue)]"
          />
        )}
      </div>
      <p className="absolute bottom-5 text-xs text-muted">{full ? "venting — let go!" : "hold to charge, release at 100%"}</p>
    </div>
  );
}

const RIPPLE_WORD = "RIPPLE";

function TypeRipple() {
  const [impulses, setImpulses] = React.useState<number[]>(() => new Array(RIPPLE_WORD.length).fill(0));
  const [ripples, setRipples] = React.useState<{ id: number; x: number }[]>([]);
  const rippleId = React.useRef(0);
  const decaying = React.useRef(false);
  useAnimationFrame(() => {
    if (!decaying.current) return;
    setImpulses((prev) => {
      let alive = false;
      const next = prev.map((v) => {
        const decayed = v * 0.88;
        if (Math.abs(decayed) > 0.15) {
          alive = true;
          return decayed;
        }
        return 0;
      });
      if (!alive) decaying.current = false;
      return alive || prev.some((v) => v !== 0) ? next : prev;
    });
  });
  const reduced = useReducedMotion();
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.key === "Tab") return;
      const center = 12 + Math.random() * 76;
      const id = ++rippleId.current;
      setRipples((current) => [...current.slice(-4), { id, x: center }]);
      setTimeout(() => setRipples((current) => current.filter((r) => r.id !== id)), 900);
      blip(480 + Math.random() * 260, 0.05, "sine", 0.06);
      if (reduced) return;
      setImpulses((prev) =>
        prev.map((impulse, index) => {
          const position = ((index + 0.5) / RIPPLE_WORD.length) * 100;
          const distance = position - center;
          return impulse + Math.sign(distance || 1) * 42 * Math.exp(-(distance * distance) / 420);
        }),
      );
      decaying.current = true;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reduced]);
  return (
    <div className="relative grid min-h-[300px] place-items-center overflow-hidden bg-[linear-gradient(165deg,#f7f8fc,#eef0f8)] p-6">
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ opacity: 0.7, transform: "scale(0.9)" }}
          animate={{ opacity: 0, transform: reduced ? "scale(1)" : "scale(5)" }}
          transition={{ duration: 0.85, ease: EASE_OUT }}
          className="absolute top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--oiad-blue)]/60"
          style={{ left: `${ripple.x}%` }}
        />
      ))}
      <div className="relative flex select-none items-center justify-center">
        {[...RIPPLE_WORD].map((letter, index) => (
          <motion.span
            key={index}
            animate={{ transform: `translateX(${impulses[index]}px)` }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
            className="font-bricolage inline-block text-[clamp(2.6rem,10vw,5.6rem)] font-semibold leading-none tracking-[-.02em] text-foreground"
          >
            {letter}
          </motion.span>
        ))}
      </div>
      <p className="absolute bottom-5 text-xs text-muted">press any key — the word ripples</p>
    </div>
  );
}

function ToggleMushroom() {
  const [on, setOn] = React.useState(false);
  const reduced = useReducedMotion();
  const knobTransform = reduced
    ? on ? "translateX(80px)" : "translateX(0px)"
    : on
      ? ["translateX(0px) scale(1, 1)", "translateX(28px) scale(0.82, 1.18)", "translateX(80px) scale(1.14, 0.9)", "translateX(80px) scale(0.96, 1.05)", "translateX(80px) scale(1, 1)"]
      : ["translateX(80px) scale(1, 1)", "translateX(52px) scale(0.82, 1.18)", "translateX(0px) scale(1.14, 0.9)", "translateX(0px) scale(0.96, 1.05)", "translateX(0px) scale(1, 1)"];
  return (
    <div className="relative grid min-h-[300px] place-items-center bg-[radial-gradient(circle_at_50%_50%,#fdf3ef,transparent_62%)] p-6">
      <button
        onClick={() => { setOn((v) => !v); blip(on ? 300 : 520, 0.09, "sine", 0.1); }}
        className="select-none rounded-[999px] outline-none"
        aria-pressed={on}
        aria-label="Mushroom toggle"
      >
        <motion.div
          whileTap={{ transform: "scale(1.12, 0.78)" }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className={`flex h-[92px] w-[172px] items-center rounded-[999px] border p-[10px] transition-colors duration-300 ${on ? "border-[#002fff]/30 bg-[var(--oiad-blue)]/90 shadow-[0_16px_34px_rgba(0,47,255,.3)]" : "border-black/12 bg-[#efece6] shadow-[0_12px_28px_rgba(0,0,0,.14)]"}`}
        >
          <motion.div
            animate={{ transform: knobTransform }}
            transition={reduced
              ? { duration: 0.2, ease: EASE_OUT }
              : { duration: 0.55, times: [0, 0.3, 0.6, 0.8, 1], ease: EASE_OUT }}
            className={`grid size-[72px] place-items-center rounded-full shadow-[0_6px_14px_rgba(0,0,0,.22)] ${on ? "bg-white" : "bg-[#fbf9f4]"}`}
          >
            <span className={`size-5 rounded-full transition-colors ${on ? "bg-[var(--oiad-blue)]" : "bg-black/15"}`} />
          </motion.div>
        </motion.div>
      </button>
      <p className="absolute bottom-5 text-xs text-muted">{on ? "on — squish it again" : "off — press and hold to squish"}</p>
    </div>
  );
}

const DETENT = 30;

function Tick({ rotation, angle }: { rotation: MotionValue<number>; angle: number }) {
  const background = useTransform(rotation, (r) => {
    const current = ((r % 360) + 360) % 360;
    const diff = Math.abs(current - angle);
    return Math.min(diff, 360 - diff) < DETENT / 2 ? "var(--oiad-blue)" : "rgba(0,0,0,.15)";
  });
  return (
    <motion.span
      className="absolute left-1/2 top-0 h-3 w-[3px] -translate-x-1/2 rounded-full"
      style={{ transformOrigin: "50% 95px", rotate: angle, background }}
    />
  );
}

function DialSpinner() {
  const rotation = useMotionValue(0);
  const [dragging, setDragging] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const vel = React.useRef(0);
  const lastAngle = React.useRef(0);
  const draggingRef = React.useRef(false);
  const lastDetent = React.useRef(0);
  const box = React.useRef<HTMLDivElement>(null);
  const knobTransform = useTransform(rotation, (r) => `rotate(${r}deg)`);
  const angleFrom = (event: React.PointerEvent) => {
    const rect = box.current!.getBoundingClientRect();
    return (Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2) * 180) / Math.PI;
  };
  useAnimationFrame(() => {
    if (draggingRef.current) return;
    if (Math.abs(vel.current) > 0.25) {
      vel.current *= 0.95;
      rotation.set(rotation.get() + vel.current);
    }
    const target = Math.round(rotation.get() / DETENT) * DETENT;
    const current = rotation.get();
    if (Math.abs(target - current) > 0.05) rotation.set(current + (target - current) * 0.22);
    const nextStep = ((Math.round(rotation.get() / DETENT) % 12) + 12) % 12;
    setStep((prev) => (prev === nextStep ? prev : nextStep));
  });
  return (
    <div className="relative grid min-h-[300px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#eef1ff,transparent_58%)] p-6">
      <div ref={box} className="relative grid size-[190px] place-items-center rounded-full">
        <div className="absolute inset-0 rounded-full border border-dashed border-black/12" />
        {Array.from({ length: 12 }, (_, i) => (
          <Tick key={i} rotation={rotation} angle={i * DETENT} />
        ))}
        <motion.button
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            lastAngle.current = angleFrom(event);
            lastDetent.current = Math.round(rotation.get() / DETENT);
            draggingRef.current = true;
            setDragging(true);
            vel.current = 0;
          }}
          onPointerMove={(event) => {
            if (!draggingRef.current) return;
            const angle = angleFrom(event);
            let delta = angle - lastAngle.current;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            lastAngle.current = angle;
            vel.current = vel.current * 0.5 + delta * 0.5;
            rotation.set(rotation.get() + delta);
            const detent = Math.round(rotation.get() / DETENT);
            if (detent !== lastDetent.current) {
              lastDetent.current = detent;
              blip(560 + ((((detent % 12) + 12) % 12) + 1) * 28, 0.03, "square", 0.05);
            }
          }}
          onPointerUp={() => { draggingRef.current = false; setDragging(false); }}
          onPointerCancel={() => { draggingRef.current = false; setDragging(false); }}
          style={{ transform: knobTransform }}
          className="relative z-10 grid size-[132px] cursor-grab touch-none place-items-center rounded-full border border-black/15 bg-[conic-gradient(from_0deg,#f4f2ee_0deg,#dcd9d2_30deg,#f4f2ee_60deg,#dcd9d2_90deg,#f4f2ee_120deg,#dcd9d2_150deg,#f4f2ee_180deg,#dcd9d2_210deg,#f4f2ee_240deg,#dcd9d2_270deg,#f4f2ee_300deg,#dcd9d2_330deg,#f4f2ee_360deg)] shadow-[0_16px_38px_rgba(0,0,0,.2),inset_0_2px_4px_rgba(255,255,255,.7)] active:cursor-grabbing"
        >
          <span className="grid size-11 place-items-center rounded-full border border-black/10 bg-[#fbfaf7] shadow-inner">
            <span className="h-6 w-[3px] -translate-y-2 rounded-full bg-[var(--oiad-blue)]" />
          </span>
        </motion.button>
      </div>
      <p className="absolute bottom-5 font-mono text-[11px] uppercase tracking-[.2em] text-muted">
        step {String(step + 1).padStart(2, "0")} · {dragging ? "spinning" : "spin me"}
      </p>
    </div>
  );
}

function RubberRuler() {
  const raw = useMotionValue(160);
  const spring = useSpring(raw, { stiffness: 300, damping: 24, mass: 0.7 });
  const bandClip = useTransform(spring, (w) => `inset(0 calc(100% - ${w}px) 0 0)`);
  const guideTransform = useTransform(spring, (w) => `translate(${w - 2}px, -50%)`);
  const labelTransform = useTransform(spring, (w) => `translateX(calc(${w}px - 50%))`);
  const [snapped, setSnapped] = React.useState<number | null>(null);
  const [label, setLabel] = React.useState(160);
  const ticks = Array.from({ length: 11 }, (_, i) => 20 + i * 28);
  const track = React.useRef<HTMLDivElement>(null);
  return (
    <div className="relative grid min-h-[300px] place-items-center bg-[linear-gradient(160deg,#f6f7fb,#eff1f8)] p-6">
      <div
        ref={track}
        className="relative h-[150px] w-full max-w-[420px] cursor-ew-resize touch-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const rect = track.current!.getBoundingClientRect();
          const pointer = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
          raw.set(pointer);
          setLabel(Math.round(pointer));
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const rect = track.current!.getBoundingClientRect();
          const pointer = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
          const near = ticks.find((tick) => Math.abs(tick - pointer) < 14) ?? null;
          setSnapped((prev) => (prev === near ? prev : near));
          setLabel((prev) => {
            const next = near !== null ? ticks.indexOf(near) * 10 : Math.round(pointer);
            return prev === next ? prev : next;
          });
          raw.set(near ?? pointer);
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black/10" />
        {ticks.map((tick, index) => (
          <span
            key={tick}
            className={`absolute top-1/2 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${snapped === tick ? "h-9 bg-[var(--oiad-blue)]" : "h-5 bg-black/25"}`}
            style={{ left: tick }}
          >
            {index % 5 === 0 && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-black/35">{index * 10}</span>}
          </span>
        ))}
        <motion.div
          className="absolute inset-x-0 top-1/2 h-[46px] -translate-y-1/2 rounded-full bg-[var(--oiad-blue)]/14 shadow-[inset_0_0_0_2px_var(--oiad-blue)]"
          style={{ clipPath: bandClip }}
        />
        <motion.div
          className="absolute left-0 top-1/2 h-[74px] w-[4px] rounded-full bg-[var(--oiad-blue)] shadow-[0_8px_18px_rgba(0,47,255,.4)]"
          style={{ transform: guideTransform }}
        />
        <motion.span
          className="absolute -top-2 left-0 rounded-lg border border-[#002fff]/20 bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--oiad-blue)] shadow-sm"
          style={{ transform: labelTransform }}
        >
          {label}
        </motion.span>
      </div>
      <p className="absolute bottom-5 text-xs text-muted">drag the guide — it snaps to the ticks</p>
    </div>
  );
}

export default function IdeasPage() {
  return (
    <main className="min-h-svh bg-background px-5 py-7 text-foreground sm:px-10 sm:py-10" style={{ backgroundImage: "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)", backgroundSize: "18px 18px" }}>
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.08]"><IconArrowLeft size={16} />Back</Link>
        <header className="mt-12 max-w-2xl sm:mt-16"><p className="font-mono text-xs font-semibold uppercase tracking-[.2em] text-[var(--oiad-blue)]">Five gap days / six ideas</p><h1 className="font-bricolage mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Fill the gaps.</h1><p className="mt-5 text-lg leading-relaxed text-muted">Six rough prototypes for the missed days. Try them all, keep the two or three strongest, and we promote those into proper 1IAD days with a tuner and a gallery card.</p></header>
        <div className="mt-12 grid gap-5 lg:grid-cols-2"><Study day="AUG 23" title="Tape Deck" note="Springy transport lever"><TapeDeck /></Study><Study day="AUG 28" title="Hold to Charge" note="Risk / reward timing"><HoldToCharge /></Study><Study day="AUG 29" title="Type Ripple" note="Keystrokes push the word"><TypeRipple /></Study><Study day="AUG 30" title="Toggle Mushroom" note="Squishy jelly physics"><ToggleMushroom /></Study><Study day="AUG 31" title="Dial Spinner" note="Inertia + detent clicks"><DialSpinner /></Study><Study day="ALT" title="Rubber Ruler" note="Magnetic snap guide"><RubberRuler /></Study></div>
        <div className="mt-8 flex items-center gap-2 text-sm text-muted"><IconSparkles size={16} className="text-[var(--oiad-blue)]" />Local study only — none of these are in the gallery yet.</div>
      </div>
    </main>
  );
}
