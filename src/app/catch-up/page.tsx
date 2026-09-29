"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconArrowLeft,
  IconArrowsShuffle,
  IconAtom,
  IconFile,
  IconSparkles,
} from "@tabler/icons-react";

const EASE = [0.23, 1, 0.32, 1] as const;

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

function MagneticReceipt() {
  const [pull, setPull] = React.useState({ x: 0, y: 0 });
  const [seed, setSeed] = React.useState(0);
  const lines = ["COLD BREW", "FRESH PEACH", "MORNING PAPER", "TIP"];

  return (
    <div
      className="relative grid min-h-[300px] place-items-center overflow-hidden bg-[linear-gradient(135deg,#f8f8f9_0%,#f2f2f5_100%)] p-6"
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        setPull({ x: (event.clientX - box.left) / box.width - 0.5, y: (event.clientY - box.top) / box.height - 0.5 });
      }}
      onPointerLeave={() => setPull({ x: 0, y: 0 })}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(var(--dot)_1px,transparent_1px)] [background-size:18px_18px]" />
      <motion.div
        animate={{ x: pull.x * 9, y: pull.y * 6, rotate: pull.x * 1.5 }}
        transition={{ type: "spring", stiffness: 170, damping: 18 }}
        className="relative w-[min(82%,290px)] rounded-sm bg-[#fffdf8] px-6 py-5 shadow-[0_12px_30px_rgba(41,37,28,.18)]"
      >
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-black/15 pb-3 font-mono text-[10px] tracking-[.16em] text-black/45"><span>MARKET / 07:42</span><span>#{String(seed + 82).padStart(4, "0")}</span></div>
        {lines.map((line, index) => {
          const direction = index % 2 ? -1 : 1;
          const force = (index + 1) * 0.7;
          return (
            <motion.div
              key={`${seed}-${line}`}
              animate={{ x: pull.x * direction * force * 19, y: pull.y * force * 7 }}
              transition={{ type: "spring", stiffness: 180, damping: 15 }}
              className="flex h-8 items-center justify-between border-b border-dashed border-black/10 font-mono text-xs text-black/72"
            >
              <span>{line}</span><span>{["$5.00", "$4.50", "$3.00", "$2.50"][index]}</span>
            </motion.div>
          );
        })}
        <div className="mt-4 flex items-end justify-between"><span className="font-mono text-[10px] tracking-[.16em] text-black/45">TOTAL</span><span className="font-bricolage text-2xl font-semibold tracking-[-.06em] text-black">$15.00</span></div>
        <div className="mt-5 text-center font-mono text-[9px] tracking-[.22em] text-black/30">THANK YOU</div>
      </motion.div>
      <button onClick={() => setSeed((value) => value + 1)} className="absolute bottom-4 right-4 flex size-9 items-center justify-center rounded-xl border border-hairline bg-surface text-muted transition-colors hover:text-foreground" aria-label="Shuffle receipt"><IconArrowsShuffle size={16} /></button>
      <p className="absolute bottom-5 left-5 text-xs text-muted">move your cursor</p>
    </div>
  );
}

function LiquidTabs() {
  const [selected, setSelected] = React.useState("Studio");
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const tabs = ["Studio", "Archive", "Notes"];
  const panels = {
    Studio: {
      label: "ACTIVE CANVAS",
      title: "Make room for the work.",
      content: <div className="mt-5 grid grid-cols-[1.35fr_.65fr] gap-2"><span className="h-14 rounded-lg bg-[var(--oiad-blue)]/12" /><span className="h-14 rounded-lg border border-dashed border-[var(--oiad-blue)]/30" /></div>,
    },
    Archive: {
      label: "SAVED / 12",
      title: "Quietly filed for later.",
      content: <div className="mt-4 space-y-2">{["Moodboard — Friday", "Poster study — 03", "Type tests — rough"].map((item) => <div key={item} className="flex items-center gap-2 rounded-lg bg-black/[.035] px-2.5 py-2 text-left font-mono text-[10px] text-muted"><span className="size-1.5 rounded-full bg-[var(--oiad-blue)]" />{item}</div>)}</div>,
    },
    Notes: {
      label: "DRAFT NOTE",
      title: "Keep the small thought close.",
      content: <div className="mt-4 rounded-lg border border-dashed border-black/10 p-3 text-left font-mono text-[10px] leading-loose text-muted"><span className="block border-b border-black/10">Less chrome. More air.</span><span className="block border-b border-black/10">Let the selected thing breathe.</span></div>,
    },
  } as const;
  const panel = panels[selected as keyof typeof panels];
  const activeIndex = tabs.indexOf(selected);

  function chooseTab(tab: string) {
    const nextIndex = tabs.indexOf(tab);
    if (nextIndex === activeIndex) return;
    setDirection(nextIndex > activeIndex ? 1 : -1);
    setSelected(tab);
  }

  return (
    <div className="grid min-h-[300px] place-items-center bg-[radial-gradient(circle_at_50%_0%,#eef1ff,transparent_54%)] p-6">
      <div className="w-full max-w-[390px]">
        <div className="relative flex rounded-2xl border border-[#002fff]/15 bg-surface/70 p-1.5 shadow-[0_12px_32px_rgba(0,47,255,.08)] backdrop-blur">
          <div aria-hidden="true" className="pointer-events-none absolute inset-1.5">
            <motion.span
              className="absolute inset-y-0 left-0 bg-[var(--oiad-blue)] shadow-[inset_0_-5px_10px_rgba(0,0,0,.15),0_6px_14px_rgba(0,47,255,.25)]"
              style={{ width: `${100 / tabs.length}%`, transformOrigin: direction === 1 ? "right center" : "left center" }}
              animate={{
                x: `${activeIndex * 100}%`,
                scaleX: [1, 1.22, 0.97, 1],
                borderRadius: direction === 1
                  ? ["12px", "52% 28% 32% 50% / 50% 38% 62% 50%", "18px 12px 14px 18px", "12px"]
                  : ["12px", "28% 52% 50% 32% / 38% 50% 50% 62%", "12px 18px 18px 14px", "12px"],
              }}
              transition={{ x: { type: "spring", stiffness: 330, damping: 25, mass: 0.66 }, scaleX: { duration: 0.48, times: [0, 0.35, 0.7, 1], ease: EASE }, borderRadius: { duration: 0.48, times: [0, 0.35, 0.7, 1], ease: EASE } }}
            />
          </div>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => chooseTab(tab)} className="font-bricolage relative z-10 flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold outline-none">
              <span className={`relative transition-colors ${selected === tab ? "text-white" : "text-muted"}`}>{tab}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={{ duration: 0.3, ease: EASE }} className="mt-7 rounded-2xl border border-hairline bg-surface/75 p-5 shadow-[0_8px_24px_rgba(0,0,0,.04)]">
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[var(--oiad-blue)]">{panel.label}</p>
            <p className="font-bricolage mt-2 text-lg font-semibold tracking-[-.03em]">{panel.title}</p>
            {panel.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrbitingFiles() {
  const [active, setActive] = React.useState(false);
  const reduced = useReducedMotion();
  const files = ["brief.pdf", "notes.txt", "frames.fig"];
  return (
    <div className="relative grid min-h-[300px] place-items-center overflow-hidden bg-[linear-gradient(155deg,#f9fafc,#f2f4fa)] p-6">
      <div className="absolute size-[250px] rounded-full border border-dashed border-black/10" />
      <motion.div animate={reduced ? {} : { rotate: 360 }} transition={{ duration: active ? 3.4 : 15, repeat: Infinity, ease: "linear" }} className="absolute size-[250px]">
        {files.map((file, index) => {
          const angle = index * 120 - 90;
          return <motion.button key={file} onClick={() => setActive((value) => !value)} whileTap={{ scale: 0.92 }} style={{ left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 125}px)`, top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 125}px)` }} className="absolute grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-hairline bg-surface shadow-[0_8px_18px_rgba(0,0,0,.08)]">
            <motion.span animate={reduced ? {} : { rotate: -360 }} transition={{ duration: active ? 3.4 : 15, repeat: Infinity, ease: "linear" }} className="flex flex-col items-center gap-0.5"><IconFile size={18} stroke={1.7} className="text-[var(--oiad-blue)]" /><span className="max-w-12 truncate font-mono text-[8px] text-muted">{file}</span></motion.span>
          </motion.button>;
        })}
      </motion.div>
      <button onClick={() => setActive((value) => !value)} className="relative z-10 grid size-[110px] place-items-center rounded-full border border-[#002fff]/20 bg-surface shadow-[0_0_0_12px_rgba(0,47,255,.04),0_12px_30px_rgba(0,47,255,.12)] transition-transform hover:scale-[1.04]">
        <span className="flex flex-col items-center gap-1"><IconAtom size={24} className="text-[var(--oiad-blue)]" /><span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted">{active ? "faster" : "orbit"}</span></span>
      </button>
      <p className="absolute bottom-5 text-xs text-muted">tap the centre or a file</p>
    </div>
  );
}

function TextLiftStudy() {
  const word = "TOUCH";
  const ref = React.useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = React.useState<number | null>(null);
  return (
    <div ref={ref} onPointerMove={(event) => { const box = event.currentTarget.getBoundingClientRect(); setPointer((event.clientX - box.left) / box.width); }} onPointerLeave={() => setPointer(null)} className="grid min-h-[300px] place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_50%,#eff0f5,transparent_62%)] p-5">
      <div className="flex select-none items-end justify-center" aria-label={word}>
        {[...word].map((letter, index) => {
          const position = (index + 0.5) / word.length;
          // At rest, the word is a calm typographic object with a single
          // baseline. Cursor proximity is the only thing that disturbs it.
          const proximity = pointer === null ? 0 : Math.max(0, 1 - Math.abs(pointer - position) * 4.4);
          return <motion.span key={letter} animate={{ y: -proximity * 18, scaleY: 1 + proximity * 0.24, scaleX: 1 - proximity * 0.08 }} transition={{ type: "spring", stiffness: 160, damping: 17 }} style={{ fontVariationSettings: `"wght" ${470 + proximity * 390}, "wdth" ${100 - proximity * 15}` }} className="font-bricolage inline-block text-[clamp(2.9rem,11vw,6.6rem)] font-medium leading-none tracking-normal text-foreground">{letter}</motion.span>;
        })}
      </div>
      <span className="absolute bottom-5 font-mono text-[10px] uppercase tracking-[.2em] text-muted">move across the word</span>
    </div>
  );
}

export default function CatchUpPage() {
  return (
    <main className="min-h-svh bg-background px-5 py-7 text-foreground sm:px-10 sm:py-10" style={{ backgroundImage: "radial-gradient(circle, var(--dot) 1.25px, transparent 1.25px)", backgroundSize: "18px 18px" }}>
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.08]"><IconArrowLeft size={16} />Back</Link>
        <header className="mt-12 max-w-2xl sm:mt-16"><p className="font-mono text-xs font-semibold uppercase tracking-[.2em] text-[var(--oiad-blue)]">Four missed days / one small lab</p><h1 className="font-bricolage mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Catch-up studies.</h1><p className="mt-5 text-lg leading-relaxed text-muted">Try each one. We pick the strongest, then turn it into a proper 1IAD day with a tuner and a gallery card.</p></header>
        <div className="mt-12 grid gap-5 lg:grid-cols-2"><Study day="010" title="Magnetic Receipt" note="Cursor-led reordering"><MagneticReceipt /></Study><Study day="011" title="Liquid Tabs" note="Ink-like selection"><LiquidTabs /></Study><Study day="012" title="Orbiting Files" note="A tiny file constellation"><OrbitingFiles /></Study><Study day="013" title="Text Lift" note="Text responds to proximity"><TextLiftStudy /></Study></div>
        <div className="mt-8 flex items-center gap-2 text-sm text-muted"><IconSparkles size={16} className="text-[var(--oiad-blue)]" />Local study only — none of these are in the gallery yet.</div>
      </div>
    </main>
  );
}
