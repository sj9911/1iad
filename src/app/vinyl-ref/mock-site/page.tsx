"use client";

// TEMPORARY: shows the Day 7 turntable as it'd actually be used — a small
// floating corner widget over a real page — instead of centered on a dev
// test page. All mechanics below are copy-pasted verbatim from
// ../page.tsx (rAF loop, drag/scratch, spotify, swap animation); only the
// surrounding layout differs. Delete alongside the rest of the vinyl-ref
// route once the real interaction is packaged.
//
// The mock site's placeholder text uses "Redacted Script", a real Google
// Font built for exactly this — it substitutes glyphs with scribble shapes
// while keeping natural word-length rhythm, so paragraphs read as "real
// text at a glance" without ever being legible. Everything that isn't text
// (images, icons, buttons) is a plain solid container instead, so the
// content hierarchy is still obvious.

import * as React from "react";

const DEG_PER_MS = 360 / 1800; // 33 1/3 RPM
const SECONDS_PER_REV = 1.8;
const NEEDLE_DROP_MS = 1050;
const SPIN_UP_TAU = 450;
const COAST_DOWN_TAU = 320;
const ARM_START_DEG = 15;
const ARM_END_DEG = 37.5;
const ARM_TAU = 260;
const CX = 472;
const CY = 485.5;
const SWAP_SLIDE_TAU = 160;
const SWAP_OFFSTAGE_X = -900;
const SWAP_PAUSE_MS = 220;
const DOUBLE_TAP_MS = 300;

const DEFAULT_TRACK =
  "https://archive.org/download/DWK315/02_-_Anitek_-_So_Far.mp3";

type SpotifyController = {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  loadUri: (uri: string) => void;
  addListener: (
    event: string,
    cb: (e: { data: { position: number; duration: number } }) => void,
  ) => void;
};

function toSpotifyUri(url: string): string | null {
  const m = url.match(
    /open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/,
  );
  return m ? `spotify:${m[1]}:${m[2]}` : null;
}

// scribble placeholder text — real words in a real font (Redacted Script),
// which substitutes every glyph with a scribble shape. plausible phrase
// lengths so the rendered shapes have realistic rhythm; never meant to be
// read, and the className only ever controls size/color/layout, never a
// fake height/width bar the way a skeleton loader would.
function S({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`font-scribble ${className}`}>{children}</span>;
}

export default function VinylMockSitePage() {
  const [svg, setSvg] = React.useState("");
  const [variant, setVariant] = React.useState<"full" | "bare" | "glass">(
    "glass",
  );
  const [playing, setPlaying] = React.useState(false);
  const [spotifyInput, setSpotifyInput] = React.useState("");
  const [spotifyActive, setSpotifyActive] = React.useState(false);
  const host = React.useRef<HTMLDivElement>(null);
  const playingRef = React.useRef(false);
  const playStart = React.useRef(0);
  const angle = React.useRef(0);
  const platters = React.useRef<NodeListOf<Element> | null>(null);
  const discStatic = React.useRef<NodeListOf<Element> | null>(null);
  const tonearm = React.useRef<SVGGElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const spotifyRef = React.useRef<SpotifyController | null>(null);
  const spotifyHostRef = React.useRef<HTMLDivElement>(null);
  const spotifyActiveRef = React.useRef(false);
  const spotifyProgress = React.useRef({ pos: 0, dur: 0 });
  const lastSpotifySeek = React.useRef(0);
  const swapPhase = React.useRef<"idle" | "out" | "waiting" | "paused" | "in">(
    "idle",
  );
  const recordSlideX = React.useRef(0);
  const pendingTrack = React.useRef<{ uri: string; art?: string } | null>(
    null,
  );
  const swapPauseUntil = React.useRef(0);
  const playlist = React.useRef<string[]>([]);
  const playlistIndex = React.useRef(0);
  const lastTapTime = React.useRef(0);
  const pendingToggleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const actx = React.useRef<AudioContext | null>(null);
  const scratchBufs = React.useRef<
    { fwd: AudioBuffer; rev: AudioBuffer } | "loading" | null
  >(null);
  const scratchSrc = React.useRef<{
    node: AudioBufferSourceNode;
    dir: 1 | -1;
  } | null>(null);
  const drag = React.useRef({
    active: false,
    lastPointerAngle: 0,
    vel: 0,
    moved: 0,
  });

  React.useEffect(() => {
    fetch("/tmp/vinyl-ref.svg")
      .then((r) => r.text())
      .then((t) => {
        platters.current = null;
        tonearm.current = null;
        setSvg(t);
      });
  }, []);

  function stopScratchSrc() {
    try {
      scratchSrc.current?.node.stop();
    } catch {}
    scratchSrc.current = null;
  }

  function ensureScratchBuffers() {
    if (scratchBufs.current) return;
    scratchBufs.current = "loading";
    actx.current ??= new AudioContext();
    fetch(DEFAULT_TRACK)
      .then((r) => r.arrayBuffer())
      .then((ab) => actx.current!.decodeAudioData(ab))
      .then((fwd) => {
        const rev = actx.current!.createBuffer(
          fwd.numberOfChannels,
          fwd.length,
          fwd.sampleRate,
        );
        for (let c = 0; c < fwd.numberOfChannels; c++) {
          const src = fwd.getChannelData(c);
          const dst = rev.getChannelData(c);
          for (let i = 0, n = src.length; i < n; i++) dst[i] = src[n - 1 - i];
        }
        scratchBufs.current = { fwd, rev };
      })
      .catch(() => {
        scratchBufs.current = null;
      });
  }

  React.useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let vel = 0;
    let armAngle = 0;
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;

      const needleDown =
        playingRef.current &&
        swapPhase.current === "idle" &&
        now - playStart.current >= NEEDLE_DROP_MS;

      if (drag.current.active) {
        drag.current.vel *= Math.exp(-dt / 80);
        vel = drag.current.vel;
      } else {
        const target = needleDown ? DEG_PER_MS : 0;
        const tau = target > vel ? SPIN_UP_TAU : COAST_DOWN_TAU;
        vel += (target - vel) * (1 - Math.exp(-dt / tau));
        if (target === 0 && Math.abs(vel) < DEG_PER_MS * 0.08) vel = 0;
      }

      if (swapPhase.current === "out") {
        recordSlideX.current +=
          (SWAP_OFFSTAGE_X - recordSlideX.current) *
          (1 - Math.exp(-dt / SWAP_SLIDE_TAU));
        if (Math.abs(SWAP_OFFSTAGE_X - recordSlideX.current) < 4) {
          recordSlideX.current = SWAP_OFFSTAGE_X;
          swapPhase.current = "waiting";
        }
      } else if (swapPhase.current === "waiting") {
        if (pendingTrack.current) {
          const pending = pendingTrack.current;
          pendingTrack.current = null;
          if (pending.art) {
            host.current?.querySelector("image")?.setAttribute("href", pending.art);
          }
          spotifyRef.current?.loadUri(pending.uri);
          swapPauseUntil.current = now + SWAP_PAUSE_MS;
          swapPhase.current = "paused";
        }
      } else if (swapPhase.current === "paused") {
        if (now >= swapPauseUntil.current) swapPhase.current = "in";
      } else if (swapPhase.current === "in") {
        recordSlideX.current +=
          (0 - recordSlideX.current) * (1 - Math.exp(-dt / SWAP_SLIDE_TAU));
        if (Math.abs(recordSlideX.current) < 1) {
          recordSlideX.current = 0;
          swapPhase.current = "idle";
          playStart.current = now;
        }
      }

      if (vel !== 0 || swapPhase.current !== "idle") {
        if (!drag.current.active) {
          angle.current = (angle.current + vel * dt) % 360;
        }
        if (!platters.current?.length) {
          platters.current = host.current?.querySelectorAll(".platter") ?? null;
        }
        platters.current?.forEach((el) => {
          (el as SVGGElement).style.transform =
            `translateX(${recordSlideX.current}px) rotate(${angle.current}deg)`;
        });
        if (!discStatic.current?.length) {
          discStatic.current = host.current?.querySelectorAll(".disc-static") ?? null;
        }
        discStatic.current?.forEach((el) => {
          (el as SVGGElement).style.transform = `translateX(${recordSlideX.current}px)`;
        });
      }

      if (drag.current.active && spotifyActiveRef.current && spotifyRef.current) {
        const { pos, dur } = spotifyProgress.current;
        if (dur > 0) {
          const deltaMs = (vel * dt * SECONDS_PER_REV * 1000) / 360;
          const nextPos = Math.max(0, Math.min(dur, pos + deltaMs));
          spotifyProgress.current = { pos: nextPos, dur };
          if (now - lastSpotifySeek.current > 120) {
            lastSpotifySeek.current = now;
            spotifyRef.current.seek(nextPos / 1000);
          }
        }
      }

      const audio = audioRef.current;
      if (audio && !spotifyActiveRef.current) {
        if (drag.current.active) {
          if (audio.duration) {
            const deltaSec = (vel * dt * SECONDS_PER_REV) / 360;
            audio.currentTime = Math.max(
              0,
              Math.min(audio.duration, audio.currentTime + deltaSec),
            );
          }
          if (!audio.paused) audio.pause();

          const bufs = scratchBufs.current;
          if (bufs && bufs !== "loading" && actx.current && audio.duration) {
            const ratio = vel / DEG_PER_MS;
            const dir = ratio > 0.02 ? 1 : ratio < -0.02 ? -1 : 0;
            if (dir === 0) {
              stopScratchSrc();
            } else if (!scratchSrc.current || scratchSrc.current.dir !== dir) {
              stopScratchSrc();
              const node = actx.current.createBufferSource();
              node.buffer = dir === 1 ? bufs.fwd : bufs.rev;
              node.connect(actx.current.destination);
              node.playbackRate.value = Math.max(
                0.05,
                Math.min(6, Math.abs(ratio)),
              );
              const offset =
                dir === 1
                  ? audio.currentTime
                  : Math.max(0, bufs.fwd.duration - audio.currentTime);
              try {
                node.start(0, Math.min(offset, node.buffer.duration - 0.01));
              } catch {}
              node.onended = () => {
                if (scratchSrc.current?.node === node) scratchSrc.current = null;
              };
              scratchSrc.current = { node, dir };
            } else {
              scratchSrc.current.node.playbackRate.value = Math.max(
                0.05,
                Math.min(6, Math.abs(ratio)),
              );
            }
          }
        } else {
          if (scratchSrc.current) stopScratchSrc();
          const ratio = vel / DEG_PER_MS;
          if (ratio > 0.07) {
            audio.playbackRate = Math.max(0.07, Math.min(1, ratio));
            if (audio.paused) void audio.play().catch(() => {});
          } else if (!audio.paused) {
            audio.pause();
          }
        }
      }

      let progress = 0;
      if (spotifyActiveRef.current) {
        const { pos, dur } = spotifyProgress.current;
        if (dur > 0) progress = pos / dur;
      } else if (audio?.duration) {
        progress = audio.currentTime / audio.duration;
      }
      const armTarget =
        swapPhase.current !== "idle"
          ? 0
          : playingRef.current
            ? ARM_START_DEG + (ARM_END_DEG - ARM_START_DEG) * Math.min(1, progress)
            : 0;
      armAngle += (armTarget - armAngle) * (1 - Math.exp(-dt / ARM_TAU));
      const speedRatio = Math.min(1, Math.abs(vel) / DEG_PER_MS);
      const onRecord = armAngle > ARM_START_DEG * 0.8;
      const tremble = onRecord
        ? speedRatio *
          (Math.sin((angle.current * Math.PI) / 180) * 0.14 +
            Math.sin(now * 0.019) * 0.05)
        : 0;
      tonearm.current ??=
        host.current?.querySelector<SVGGElement>(".tonearm") ?? null;
      if (tonearm.current) {
        tonearm.current.style.transform = `rotate(${armAngle + tremble}deg)`;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function pointerAngle(e: React.PointerEvent): number | null {
    const svgEl = host.current?.querySelector("svg");
    if (!svgEl) return null;
    const r = svgEl.getBoundingClientRect();
    const scale = 1064 / r.width;
    const x = (e.clientX - r.left) * scale - CX;
    const y = (e.clientY - r.top) * scale - CY;
    if (Math.hypot(x, y) > 380) return null;
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (swapPhase.current !== "idle") return;
    const a = pointerAngle(e);
    if (a === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (spotifyActiveRef.current) {
      spotifyRef.current?.pause();
    } else {
      ensureScratchBuffers();
      void actx.current?.resume();
    }
    drag.current = { active: true, lastPointerAngle: a, vel: 0, moved: 0 };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    const a = pointerAngle(e);
    if (a === null) return;
    let delta = a - drag.current.lastPointerAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    drag.current.lastPointerAngle = a;
    drag.current.moved += Math.abs(delta);
    drag.current.vel = drag.current.vel * 0.5 + (delta / 16.7) * 0.5;
    angle.current = (angle.current + delta) % 360;
  }

  function endDrag() {
    drag.current.active = false;
    stopScratchSrc();
    if (spotifyActiveRef.current && spotifyRef.current) {
      spotifyRef.current.seek(spotifyProgress.current.pos / 1000);
      if (playingRef.current) spotifyRef.current.play();
    }
  }

  function toggle() {
    if (swapPhase.current !== "idle") return;
    if (drag.current.moved > 4) {
      drag.current.moved = 0;
      return;
    }
    if (playlist.current.length > 1) {
      const now = performance.now();
      if (now - lastTapTime.current < DOUBLE_TAP_MS) {
        if (pendingToggleTimer.current) {
          clearTimeout(pendingToggleTimer.current);
          pendingToggleTimer.current = null;
        }
        lastTapTime.current = 0;
        skipToNext();
        return;
      }
      lastTapTime.current = now;
      pendingToggleTimer.current = setTimeout(() => {
        pendingToggleTimer.current = null;
        doToggle();
      }, DOUBLE_TAP_MS);
      return;
    }
    doToggle();
  }

  function skipToNext() {
    if (playlist.current.length < 2) return;
    playlistIndex.current = (playlistIndex.current + 1) % playlist.current.length;
    loadTrackFromUrl(playlist.current[playlistIndex.current]);
  }

  function doToggle() {
    setPlaying((p) => {
      const next = !p;
      playingRef.current = next;
      if (next) {
        playStart.current = performance.now();
        if (!spotifyActiveRef.current) ensureScratchBuffers();
      }
      if (spotifyActiveRef.current && spotifyRef.current) {
        if (next) {
          setTimeout(() => {
            if (playingRef.current) spotifyRef.current?.play();
          }, NEEDLE_DROP_MS);
        } else {
          spotifyRef.current.pause();
        }
      }
      return next;
    });
  }

  function loadTrackFromUrl(url: string) {
    const uri = toSpotifyUri(url);
    if (!uri || !spotifyHostRef.current) return;

    const artPromise = fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
    )
      .then((r) => r.json())
      .then((d: { thumbnail_url?: string }) => d.thumbnail_url)
      .catch(() => undefined);

    if (spotifyActiveRef.current && spotifyRef.current) {
      artPromise.then((art) => {
        pendingTrack.current = { uri, art };
      });
      if (swapPhase.current === "idle") swapPhase.current = "out";
      return;
    }

    audioRef.current?.pause();
    setSpotifyActive(true);
    spotifyActiveRef.current = true;
    artPromise.then((art) => {
      if (art) host.current?.querySelector("image")?.setAttribute("href", art);
    });

    if (spotifyRef.current) {
      spotifyRef.current.loadUri(uri);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onSpotifyIframeApiReady = (api: {
      createController: (
        el: HTMLElement,
        opts: { uri: string; width: string; height: number },
        cb: (c: SpotifyController) => void,
      ) => void;
    }) => {
      api.createController(
        spotifyHostRef.current!,
        { uri, width: "100%", height: 80 },
        (controller) => {
          spotifyRef.current = controller;
          controller.addListener("playback_update", (e) => {
            spotifyProgress.current = {
              pos: e.data.position,
              dur: e.data.duration,
            };
          });
        },
      );
    };
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);
  }

  function connectSpotify() {
    const urls = spotifyInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!urls.length) return;
    playlist.current = urls;
    playlistIndex.current = 0;
    loadTrackFromUrl(urls[0]);
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Redacted+Script:wght@400;700&display=swap"
      />
      <style>{`
        .font-scribble { font-family: "Redacted Script", cursive; }
        .tonearm {
          transform-box: view-box;
          transform-origin: 936px 127px;
          will-change: transform;
        }
        .platter {
          transform-box: view-box;
          transform-origin: ${CX}px ${CY}px;
          will-change: transform;
        }
        .disc-static {
          transform-box: view-box;
          will-change: transform;
        }
        [data-variant="bare"] .chassis-body,
        [data-variant="bare"] .chassis-controls {
          display: none;
        }
        [data-variant="glass"] .chassis-body {
          opacity: 0;
        }
      `}</style>

      {/* ————————————————— the mock website ————————————————— */}
      {/* full-width throughout — no boxed max-width shell — with three
          vivid full-bleed gradient bands (hero, mid-page, cta) so there's
          always something colorful for the glass variant to actually blur */}
      <div className="min-h-svh bg-neutral-950 text-white">
        {/* nav */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500" />
              <S className="text-lg leading-none text-white">Amble</S>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              <S className="text-base text-neutral-400">Product</S>
              <S className="text-base text-neutral-400">Features</S>
              <S className="text-base text-neutral-400">Pricing</S>
              <S className="text-base text-neutral-400">Company</S>
            </nav>
            <button className="rounded-full bg-indigo-500 px-5 py-2 shadow-sm shadow-indigo-500/30">
              <S className="inline-block text-base leading-none text-white">Get started</S>
            </button>
          </div>
        </header>

        {/* hero — glass-test zone 1 */}
        <section className="relative isolate overflow-hidden px-6 py-28 text-center md:px-12 md:py-36 lg:px-20">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_30%,#6d5bff_0%,transparent_50%),radial-gradient(circle_at_80%_15%,#ff5b9e_0%,transparent_45%),radial-gradient(circle_at_60%_85%,#3fd6c7_0%,transparent_55%)]"
          />
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1">
              <S className="text-sm leading-none text-white/80">New · v2.0 is live</S>
            </div>
            <h1 className="mb-6 leading-tight">
              <S className="block text-4xl text-white md:text-6xl">Music that moves</S>
              <S className="block text-4xl text-white md:text-6xl">with your site</S>
            </h1>
            <p className="mx-auto mb-9 max-w-xl">
              <S className="text-lg leading-relaxed text-white/60">
                A tiny turntable widget that plays real records for your
                visitors, wherever they land on your site.
              </S>
            </p>
            <div className="flex justify-center gap-3">
              <button className="rounded-full bg-white px-6 py-3">
                <S className="inline-block text-base leading-none text-neutral-900">
                  Start free trial
                </S>
              </button>
              <button className="rounded-full border border-white/25 px-6 py-3">
                <S className="inline-block text-base leading-none text-white">
                  Watch demo
                </S>
              </button>
            </div>
          </div>
        </section>

        {/* trust row */}
        <section className="border-y border-white/10 py-10">
          <div className="flex flex-col items-center gap-5 px-6 md:px-12 lg:px-20">
            <S className="text-sm text-neutral-500">Trusted by teams at</S>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
              {["w-20", "w-24", "w-16", "w-20", "w-16"].map((w, i) => (
                <div key={i} className={`h-5 ${w} rounded bg-neutral-700`} />
              ))}
            </div>
          </div>
        </section>

        {/* features */}
        <section className="px-6 py-24 md:px-12 lg:px-20">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <div className="mb-4 flex justify-center">
              <S className="text-sm text-indigo-400">Why teams choose us</S>
            </div>
            <h2>
              <S className="text-3xl text-white">
                Everything you need to sound good
              </S>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Instant setup",
                body: "Drop in one line of code and you're live in minutes.",
              },
              {
                title: "Real vinyl physics",
                body: "Motor spin-up, needle drop, and scratch — simulated for real.",
              },
              {
                title: "Spotify built in",
                body: "Connect any track, album, or playlist straight from Spotify.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15">
                  <div className="h-5 w-5 rounded-full bg-orange-400" />
                </div>
                <S className="mb-2 block text-lg text-white">{card.title}</S>
                <p>
                  <S className="text-base leading-relaxed text-neutral-400">
                    {card.body}
                  </S>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* mid-page color band — glass-test zone 2, purely decorative */}
        <section className="relative isolate overflow-hidden px-6 py-32 text-center md:px-12 lg:px-20">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_35%,#22d3ee_0%,transparent_50%),radial-gradient(circle_at_75%_60%,#a3e635_0%,transparent_50%),radial-gradient(circle_at_50%_95%,#818cf8_0%,transparent_55%)]"
          />
          <S className="mx-auto block max-w-lg text-2xl text-white md:text-3xl">
            Built for every corner of the web
          </S>
        </section>

        {/* cta banner — glass-test zone 3, full width */}
        <section className="relative isolate overflow-hidden px-6 py-24 text-center md:px-12 lg:px-20">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,#f97316_0%,transparent_55%),radial-gradient(circle_at_20%_100%,#ec4899_0%,transparent_50%),radial-gradient(circle_at_85%_100%,#f43f5e_0%,transparent_50%)]"
          />
          <S className="mx-auto mb-4 block max-w-lg text-3xl text-white">
            Ready to add some sound?
          </S>
          <S className="mx-auto mb-8 block max-w-sm text-lg text-white/70">
            Free to start, no credit card required.
          </S>
          <button className="rounded-full bg-white px-7 py-3">
            <S className="inline-block text-base leading-none text-neutral-900">
              Create your widget
            </S>
          </button>
        </section>

        {/* footer */}
        <footer className="border-t border-white/10 py-16">
          <div className="grid grid-cols-2 gap-10 px-6 md:grid-cols-5 md:px-12 lg:px-20">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-3 h-8 w-8 rounded-lg bg-indigo-500" />
              <S className="block text-sm text-neutral-500">
                Sound for every site.
              </S>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog"] },
              { title: "Company", links: ["About", "Careers", "Contact"] },
              { title: "Resources", links: ["Docs", "Guides", "Support"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security"] },
            ].map((col) => (
              <div key={col.title} className="space-y-3">
                <S className="block text-base text-white">{col.title}</S>
                {col.links.map((link) => (
                  <S key={link} className="block text-sm text-neutral-500">
                    {link}
                  </S>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-between border-t border-white/10 px-6 pt-6 md:px-12 lg:px-20">
            <S className="text-sm text-neutral-500">
              © 2026 Amble. All rights reserved.
            </S>
            <div className="flex gap-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-7 w-7 rounded-full bg-white/10" />
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* ————————————————— the floating widget ————————————————— */}
      <div
        ref={host}
        data-playing={playing}
        data-variant={variant}
        onClick={toggle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`fixed bottom-6 right-6 z-30 w-44 cursor-pointer touch-none select-none rounded-[4.5%] [&_svg]:h-auto [&_svg]:w-full ${
          variant === "bare"
            ? ""
            : variant === "glass"
              ? "border border-white/25 bg-white/10 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
              : "shadow-2xl"
        }`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <audio ref={audioRef} src={DEFAULT_TRACK} preload="auto" loop />

      {/* ————————————————— dev controls (not part of the mock site) ————————————————— */}
      <div className="fixed left-4 top-4 z-40 w-72 space-y-2 rounded-2xl border border-white/10 bg-neutral-900/90 p-3 text-white shadow-xl backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Widget preview controls
        </p>
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {(["full", "bare", "glass"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`flex-1 rounded-full px-2 py-1 text-xs font-medium capitalize transition-colors ${
                variant === v ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={spotifyInput}
            onChange={(e) => setSpotifyInput(e.target.value)}
            placeholder="Spotify link(s)…"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:border-white/40"
          />
          <button
            onClick={connectSpotify}
            className="shrink-0 rounded-lg bg-[#1DB954] px-2.5 py-1.5 text-xs font-semibold text-black"
          >
            Go
          </button>
        </div>
        <div
          style={
            spotifyActive
              ? {
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  opacity: 0,
                  pointerEvents: "none",
                }
              : { display: "none" }
          }
        >
          <div ref={spotifyHostRef} />
        </div>
      </div>
    </>
  );
}
