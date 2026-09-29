"use client";

import {
  Aperture,
  CircleDashed,
  FolderLock,
  GalleryVerticalEnd,
  MessageCircle,
  Orbit,
  ScanLine,
  Sparkles,
  Timer,
} from "lucide-react";
import { IconCloud } from "@/components/ui/icon-cloud";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import Text3DFlip from "@/components/ui/text-3d-flip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import ArcadePixel from "@/components/smoothui/arcade-pixel";
import Scrubber from "@/components/smoothui/scrubber";
import MorphSurface from "@/components/smoothui/morph-surface";
import FigmaComment from "@/components/smoothui/figma-comment";
import ConfidentialFolder from "@/components/confidential-folder";
import { DynamicGridGallery, type GalleryItem } from "@/components/dynamic-grid-gallery";
import PromptBox from "@/components/prompt-box";
import ScanDocument from "@/components/scan-document";
import SetTimer from "@/components/set-timer";
import SmoothDropdown from "@/components/smooth-dropdown";
import StackedOutlineText from "@/components/stacked-outline-text";
import PhysicalThemeToggle from "@/components/physical-theme-toggle";
import { WheelCarousel, type WheelCarouselItem } from "@/components/wheel-carousel";
import { Persona, type PersonaState } from "@/components/ai-elements/persona";
import { Shimmer } from "@/components/ai-elements/shimmer";
import LEDBoard from "../../components/animata/card/led-board";
import { useState } from "react";

const iconSet = [
  Sparkles,
  Orbit,
  Aperture,
  FolderLock,
  GalleryVerticalEnd,
  MessageCircle,
  ScanLine,
  Timer,
  CircleDashed,
].flatMap((Icon, group) =>
  [0, 1, 2].map((copy) => (
    <Icon
      aria-hidden="true"
      color={group % 5 === 0 ? "#ff9f0a" : group % 2 ? "var(--foreground)" : "#365cff"}
      key={`${group}-${copy}`}
      size={72}
      strokeWidth={1.35}
    />
  )),
);

const svgImage = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><filter id="n"><feTurbulence baseFrequency=".9" numOctaves="4" stitchTiles="stitch"/><feBlend mode="soft-light" in="SourceGraphic"/></filter></defs><rect width="900" height="900" fill="url(#g)"/><circle cx="450" cy="410" r="230" fill="none" stroke="white" stroke-opacity=".55" stroke-width="2"/><path d="M120 620 Q450 260 780 620" fill="none" stroke="white" stroke-opacity=".7" stroke-width="4"/><rect width="900" height="900" filter="url(#n)" opacity=".16"/></svg>`)}`;

const avatarImage = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#f5c9a8"/><stop offset="1" stop-color="#bf704f"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="#ffd54a"/><circle cx="48" cy="39" r="22" fill="url(#a)"/><path d="M14 96c4-24 17-36 34-36s30 12 34 36" fill="#365cff"/><path d="M27 37c1-19 12-27 25-25 11 2 18 10 18 23-8-2-15-8-18-14-5 8-13 13-25 16Z" fill="#2b211d"/><circle cx="40" cy="41" r="2"/><circle cx="57" cy="41" r="2"/><path d="M41 51c5 4 10 4 15 0" fill="none" stroke="#7f3e34" stroke-linecap="round" stroke-width="2"/></svg>`)}`;

const galleryItems: GalleryItem[] = [
  ["TENSION", "#ff3b30", "#ffcc00"],
  ["ORBIT", "#002fff", "#52d6ff"],
  ["BLOOM", "#6e2cff", "#ff5fa2"],
  ["SIGNAL", "#07111f", "#00d084"],
  ["HEAT", "#ff6b00", "#7b00ff"],
  ["AFTERIMAGE", "#111", "#6b7280"],
].map(([title, from, to], index) => ({
  id: index,
  title,
  alt: `${title.toLowerCase()} generative interaction study`,
  src: svgImage(from, to),
}));

const wheelItems: WheelCarouselItem[] = galleryItems.map((item, index) => ({
  id: item.id,
  label: item.title ?? `Study ${index + 1}`,
  category: `${String(index + 1).padStart(2, "0")} / MOTION STUDY`,
  image: item.src,
}));

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`absolute inset-0 flex h-full min-h-0 w-full items-center justify-center p-8 ${className}`}>{children}</div>;
}

export function IconCloudInteraction() {
  return <Frame><IconCloud icons={iconSet} /></Frame>;
}

export function DiaRevealInteraction() {
  return <Frame className="p-0!"><div className="flex h-full w-full items-center justify-center"><DiaTextReveal className="max-w-[13ch] text-center text-[clamp(34px,6vw,76px)] font-extrabold leading-[.96] tracking-[-.02em]" colors={["#365cff", "#7c5cff", "#d85cff", "#ff8a4c", "#ffd54a"]} duration={1.35} fixedWidth repeat repeatDelay={0.8} text={["Move first.", "Think later.", "Make it felt."]} /></div></Frame>;
}

export function TextFlipInteraction() {
  return <Frame><Text3DFlip as="h2" className="cursor-pointer justify-center whitespace-nowrap text-center text-[clamp(28px,4vw,56px)] font-black uppercase leading-none tracking-[-.015em]" flipTextClassName="text-[#365cff]" rotateDirection="top" staggerDuration={0.028}>BORING IS A BUG</Text3DFlip></Frame>;
}

export function DropdownInteraction() {
  return (
    <Frame>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button className="rounded-2xl bg-foreground px-6 py-3 font-semibold text-background shadow-xl transition-transform active:scale-[.97]">Open the day</button></DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 rounded-2xl border-hairline bg-surface p-2 text-foreground shadow-2xl">
          <DropdownMenuLabel>Choose an experiment</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Start with motion <DropdownMenuShortcut>⌘1</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem>Start with sound <DropdownMenuShortcut>⌘2</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem>Start with touch <DropdownMenuShortcut>⌘3</DropdownMenuShortcut></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Frame>
  );
}

export function LedBoardInteraction() { return <Frame><div className="w-full max-w-2xl"><LEDBoard word="2026" /></div></Frame>; }
export function ArcadePixelInteraction() { return <Frame className="p-0!"><div className="absolute inset-0 flex items-center overflow-hidden bg-[#080808]"><ArcadePixel animate="marquee" className="w-full! overflow-visible" columns={34} crt glow loop palette={["transparent", "#ffdc3e", "#ff3b30"]} pixelSize={9} scanlines speed={0.72} text="ONE INTERACTION A DAY   " /></div></Frame>; }
export function ScrubberInteraction() { return <Frame><div className="w-full max-w-xl"><Scrubber decimals={0} defaultValue={68} label="INTENSITY" max={100} step={1} ticks={11} /></div></Frame>; }
export function MorphSurfaceInteraction() { return <Frame><MorphSurface /></Frame>; }
export function FigmaCommentInteraction() { return <Frame><FigmaComment authorName="Future you" avatarAlt="Portrait of your future self" avatarUrl={avatarImage} className="size-8" message="This feels inevitable now. Keep the tiny pause before it opens." timestamp="from tomorrow" width={250} /></Frame>; }
export function ConfidentialFolderInteraction() {
  const letterFront = (
    <div className="flex h-full flex-col p-6 font-mono text-[10px] leading-[1.55] text-[#675f52]">
      <p className="tracking-[.16em] uppercase">Recovery note</p>
      <div className="mt-4 space-y-1">
        <p>from: yesterday</p>
        <p>to: right now</p>
        <p>re: the missing days</p>
      </div>
      <div className="my-4 h-px bg-black/15" />
      <p className="max-w-[36ch] text-pretty">
        Nothing is late once it starts moving. Pick one unfinished thought,
        make it tangible, and let the next day answer it.
      </p>
      <ol className="mt-4 space-y-1 tabular-nums">
        <li>1. Choose the strange part</li>
        <li>2. Make it respond</li>
        <li>3. Leave a little mystery</li>
      </ol>
      <p className="mt-auto tracking-[.12em] uppercase">Archive #013</p>
    </div>
  );

  return (
    <Frame className="bg-black">
      <ConfidentialFolder
        badge="#013"
        className="scale-80"
        height={310}
        letterFront={letterFront}
        message="Twenty-six missed days are not a failure. They are twenty-six invitations to make something impossible to ignore."
        punchline="Open the backlog. Steal back the days."
        subtitle="Recovered from the archive."
        stage={false}
        title="The missing days"
        width={248}
      />
    </Frame>
  );
}
export function DynamicGalleryInteraction() { return <Frame><div className="h-full max-h-[520px] w-full max-w-4xl overflow-hidden rounded-[24px]"><DynamicGridGallery expandFactor={2.2} gap={8} items={galleryItems} rounded="rounded-[16px]" /></div></Frame>; }
export function PromptBoxInteraction() { return <Frame><PromptBox /></Frame>; }
export function ScanDocumentInteraction() { return <Frame><ScanDocument /></Frame>; }
export function SetTimerInteraction() { return <Frame><SetTimer /></Frame>; }
export function SmoothDropdownInteraction() { return <Frame className="overflow-visible"><SmoothDropdown /></Frame>; }
export function StackedOutlineInteraction() { return <Frame className="p-0!"><StackedOutlineText className="h-full min-h-0" fontSize={150} stacks={7} text="MOVE" /></Frame>; }
export function ThemeSwitchInteraction() { return <Frame><PhysicalThemeToggle /></Frame>; }
export function WheelCarouselInteraction() { return <Frame><div className="h-[460px] w-full max-w-5xl"><WheelCarousel background="transparent" className="h-full" contentWidth={760} dragSpeed={0.014} edgeFade initialIndex={2} itemFont={{ fontSize: "18px", fontWeight: 650, letterSpacing: "-0.01em", lineHeight: "1.1" }} items={wheelItems} markerColor="#365cff" mode="custom" momentum photoAspect="1/1" photoRadius={20} photoSide="left" photoWidth={32} radius={250} selectedColor="var(--foreground)" showMarker snap spacing={17} textColor="var(--muted)" visibleItems={4} /></div></Frame>; }

export function PersonaInteraction() {
  const [state, setState] = useState<PersonaState>("idle");
  const states: PersonaState[] = ["idle", "listening", "thinking", "speaking", "asleep"];
  return <Frame><div className="flex max-w-sm flex-col items-center gap-4"><Persona className="size-48" state={state} variant="halo" /><div className="flex max-w-full flex-wrap justify-center gap-1.5">{states.map((next) => <button className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${state === next ? "border-transparent bg-foreground text-background" : "border-hairline bg-surface"}`} key={next} onClick={() => setState(next)}>{next}</button>)}</div></div></Frame>;
}

export function ShimmerInteraction() { return <Frame><Shimmer as="h2" className="max-w-[15ch] text-center text-[clamp(34px,5.8vw,76px)] font-extrabold leading-[.98] tracking-[-.02em]" duration={1.8} spread={5}>Waiting is also motion.</Shimmer></Frame>; }
