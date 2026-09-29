"use client";

import { useMemo, useState, useSyncExternalStore, type ComponentType } from "react";
import Link from "next/link";
import { WindChimes, HangingPhoto } from "./resting";
import { ScratchReveal } from "./scratch-card";
import { TicketDispenser, ShuffleDeck, PackingList } from "./paper";
import { ModularShelf, CablePatchboard, StampDesk, FilingDrawer } from "./objects";
import { SoundContext, useAudio } from "./shared";
import "./playground.css";

const studies: { name: string; slug: string; hint: string; kind: string; Component: ComponentType }[] = [
  { name: "Wind Chimes", slug: "wind-chimes", hint: "Drag the centre cord or a tube. Hover to wake the colours.", kind: "TOUCH · SOUND · WIND", Component: WindChimes },
  { name: "Scratch Reveal", slug: "scratch-reveal", hint: "Rub away the silver. There’s something underneath.", kind: "SCRATCH · DISCOVER", Component: ScratchReveal },
  { name: "Hanging Photo", slug: "hanging-photo", hint: "Grab a corner and let it swing. Browse the photographs.", kind: "DRAG · SWING · BROWSE", Component: HangingPhoto },
  { name: "Ticket Dispenser", slug: "ticket-dispenser", hint: "Hold feed to draw the boarding pass out.", kind: "HOLD · FEED · KEEP", Component: TicketDispenser },
  { name: "Shuffle Deck", slug: "shuffle-deck", hint: "Pull a card to peek. Throw it aside to browse.", kind: "PEEK · FLIP · SHUFFLE", Component: ShuffleDeck },
  { name: "Packing List", slug: "packing-list", hint: "Drag your essentials into the bag. Tap to unpack.", kind: "PACK · ARRANGE · CHECK", Component: PackingList },
  { name: "Modular Shelf", slug: "modular-shelf", hint: "Slide the books into a new order. Tap one to open it.", kind: "COLLECT · REORDER · EXPLORE", Component: ModularShelf },
  { name: "Cable Patchboard", slug: "cable-patchboard", hint: "Patch a source into an output. Every route does something.", kind: "CONNECT · ROUTE · LISTEN", Component: CablePatchboard },
  { name: "Stamp Desk", slug: "stamp-desk", hint: "Hover over the handle to pick it up. Press the invoice to stamp.", kind: "PICK UP · PRESS · APPROVE", Component: StampDesk },
  { name: "Filing Drawer", slug: "filing-drawer", hint: "Pull the handle. Thumb through folders and lift one out.", kind: "OPEN · BROWSE · READ", Component: FilingDrawer },
];

const favouritesKey = "1iad-next-ten-kept";
function readFavourites() { try { return localStorage.getItem(favouritesKey) ?? "[]"; } catch { return "[]"; } }
function subscribeFavourites(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener("1iad-favourites", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("1iad-favourites", callback); };
}

export default function Playground() {
  const [sound, setSound] = useState(false);
  const savedFavourites = useSyncExternalStore(subscribeFavourites, readFavourites, () => "[]");
  const kept = useMemo<string[]>(() => { try { const saved = JSON.parse(savedFavourites); return Array.isArray(saved) ? saved.filter((value) => typeof value === "string") : []; } catch { return []; } }, [savedFavourites]);
  const setKept = (update: (value: string[]) => string[]) => {
    try { localStorage.setItem(favouritesKey, JSON.stringify(update(kept))); window.dispatchEvent(new Event("1iad-favourites")); } catch {}
  };
  const [resets, setResets] = useState<Record<string, number>>({});
  const play = useAudio(sound);
  return <SoundContext.Provider value={play}>
    <main className="pg-page">
      <header className="pg-top"><Link href="/" className="pg-brand">01<span>♥</span> / a little playground</Link><button className={`pg-sound ${sound ? "is-on" : ""}`} aria-pressed={sound} onClick={() => setSound(!sound)}><span aria-hidden="true">{sound ? "◖))" : "◖×"}</span> Sound {sound ? "on" : "off"}</button></header>
      <section className="pg-intro"><p className="pg-eyebrow">1IAD · EXPERIMENTS 011—020</p><h1>Go on.<br/>Touch everything<span>.</span></h1><div><p>Ten little things with a life of their own.<br/>Pick them up. Make a mess. Keep your favourites.</p><span className="pg-status"><i/> Local playground · work in progress</span></div></section>
      <nav className="pg-index" aria-label="Jump to an interaction">{studies.map((study, i) => <a key={study.slug} href={`#${study.slug}`}><span>{String(i + 11).padStart(3, "0")}</span>{study.name}</a>)}</nav>
      <div className="pg-grid">{studies.map(({ slug, name, hint, kind, Component }, i) => <article id={slug} className="pg-card" key={slug}>
        <div className="pg-card-top"><span className="pg-eyebrow">{String(i + 11).padStart(3, "0")} / {kind}</span><button className="pg-reset" title={`Reset ${name}`} aria-label={`Reset ${name}`} onClick={() => setResets((value) => ({ ...value, [slug]: (value[slug] ?? 0) + 1 }))}>↺</button></div>
        <div className={`pg-stage pg-${slug}`}><Component key={resets[slug] ?? 0}/></div>
        <div className="pg-card-bottom"><div><h2>{name}</h2><p>{hint}</p></div><button className={`pg-keep ${kept.includes(slug) ? "is-kept" : ""}`} aria-label={`Keep ${name}`} aria-pressed={kept.includes(slug)} onClick={() => setKept((value) => value.includes(slug) ? value.filter((x) => x !== slug) : [...value, slug])}>{kept.includes(slug) ? "♥ Kept" : "♡ Keep"}</button></div>
      </article>)}</div>
      <footer className="pg-footer"><span>{kept.length ? `${kept.length} favourites saved on this browser.` : "Your favourites will be saved on this browser."}</span><a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Back to the top ↑</a></footer>
    </main>
  </SoundContext.Provider>;
}
