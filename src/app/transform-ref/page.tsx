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

        <section className="relative mt-12 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_18px_54px_rgba(0,0,0,.08)]">
          <div className="grid min-h-[440px] grid-cols-2">
            <FlowPanel title="Input group" side="input" assets={sources} />
            <FlowPanel title="Output group" side="output" assets={targets} />
          </div>

          {/* One shared seam, not a connector: the paired output begins as
              its input leaves, making the visible handoff feel continuous. */}
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 z-20 border-l border-hairline" />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <AssetControls label="Input assets" assets={sources} onFile={(index, file) => replace("source", index, file)} />
          <AssetControls label="Output assets" assets={targets} onFile={(index, file) => replace("target", index, file)} />
        </section>
      </div>
    </main>
  );
}

function FlowPanel({ title, side, assets }: { title: string; side: "input" | "output"; assets: Asset[] }) {
  return <div className={`relative overflow-hidden ${side === "input" ? "bg-surface" : "bg-black/[0.018] dark:bg-white/[0.025]"}`}>
    <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-hairline px-5 py-4"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</span><span className="font-mono text-[10px] text-[var(--oiad-blue)]">03</span></div>
    <svg className="absolute inset-0 size-full" viewBox="0 0 640 440" preserveAspectRatio="xMidYMid meet" aria-label={`${title} animated paths`}>
      {assets.map((asset, index) => <SvgFlowItem key={index} asset={asset} lane={(index % 3) as Lane} cycle={Math.floor(index / 3)} side={side} />)}
    </svg>
  </div>;
}

function SvgFlowItem({ asset, lane, cycle, side }: { asset: Asset; lane: Lane; cycle: number; side: "input" | "output" }) {
  // Each invisible run starts a full panel-width before its own box. At the
  // midpoint both icon centres occupy the shared seam (input x=640, output
  // x=0); overflow clipping then makes one continuous, transformed object.
  const path = side === "input" ? INPUT_PATHS[lane] : OUTPUT_PATHS[lane];
  // The straight middle route has exact horizontal distances, so its seam
  // point is calculated exactly: x=640 in the input panel and x=0 after the
  // output has travelled 640px from -640. This keeps both halves aligned.
  const seamPoint = lane === 1
    ? side === "input" ? "0.5" : "0.470588"
    : side === "input" ? "0.511" : "0.461";
  // The second set is half a loop behind. Outputs are also phase-shifted by
  // half a loop, so a prior input is already flowing through the right box
  // while the new input enters the left one. Neither panel ever goes empty.
  const delay = `${lane * 1.35 + cycle * 5.7 + (side === "output" ? -5.7 : 0)}s`;
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

function AssetControls({ label, assets, onFile }: { label: string; assets: Asset[]; onFile: (index: number, file?: File) => void }) {
  return <section className="rounded-2xl border border-hairline bg-surface p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bricolage text-lg font-semibold">{label}</h2><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">PNG / SVG</span></div><div className="grid grid-cols-3 gap-2">{assets.map((asset, index) => <label key={index} className="group flex cursor-pointer items-center gap-2 rounded-xl bg-black/[0.04] p-2.5 transition-colors hover:bg-black/[0.07] dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"><span className="flex size-8 items-center justify-center rounded-lg border border-hairline bg-surface text-base"><AssetMark asset={asset} /></span><span className="hidden font-mono text-[10px] text-muted sm:block">GROUP {index + 1}</span><IconUpload size={14} className="ml-auto text-[var(--oiad-blue)]" /><input type="file" accept="image/png,image/svg+xml" className="sr-only" onChange={(event) => onFile(index, event.target.files?.[0])} /></label>)}</div></section>;
}
