"use client";

// TEMPORARY reference page for building the Day 7 vinyl player against the
// original mockup. Delete this route (and public/tmp/vinyl-ref.svg) once
// the real interaction is built.
//
// Everything mechanical is one rAF loop driving two composited transforms
// (.platter and .tonearm) — CSS transitions proved too coarse (they smooth
// the wobble away) and per-frame transforms on multiple filtered subtrees
// re-rasterize SVG filters (feTurbulence grain, drop shadows) off the GPU.
//
// Audio: default is a CC-licensed lofi track (Anitek — So Far, Dusted Wax
// Kingdom netlabel). playbackRate follows platter velocity (motor warble).
// Drag the record to scratch: the platter follows your pointer, audio
// scrubs with it, and the motor re-engages when you let go.
// Spotify: paste a URL — official iFrame Embed API, tonearm drives
// play/pause. Dragging scrubs via controller.seek() (throttled — the
// iframe is a postMessage bridge, not raw audio, so no buffer-based
// scratch tone; the real jump-cut as you seek is the closest we get).
// Its iframe stays mounted but visually hidden (not display:none —
// that can suspend embedded media in some browsers); our SVG is the
// only player chrome the user sees.

import * as React from "react";

const DEG_PER_MS = 360 / 1800; // 33 1/3 RPM
const SECONDS_PER_REV = 1.8;
const NEEDLE_DROP_MS = 1050;
const SPIN_UP_TAU = 450;
const COAST_DOWN_TAU = 320;
// tonearm sweep: lead-in groove (outer edge) to run-out groove (label edge).
// Records play OUTSIDE-IN, so the arm travels inward as the track progresses.
const ARM_START_DEG = 15;
const ARM_END_DEG = 37.5;
const ARM_TAU = 260; // arm swing easing
// record center in viewBox units
const CX = 472;
const CY = 485.5;
// track-change swap: pull the record off to the side, swap it while
// off-stage, slide the new one back in. SWAP_OFFSTAGE_X only needs to clear
// the record's own radius past x=0 — the SVG's default overflow:hidden does
// the rest, no clip-path needed.
const SWAP_SLIDE_TAU = 160;
const SWAP_OFFSTAGE_X = -900;
const SWAP_PAUSE_MS = 220;
// double-tap-to-skip only makes sense once a real playlist is loaded — a
// single track has nothing to skip to, so a lone tap should toggle instantly
// with no added latency
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

export default function VinylRefPage() {
  const [svg, setSvg] = React.useState("");
  const [variant, setVariant] = React.useState<"full" | "bare" | "glass">(
    "full",
  );
  const [playing, setPlaying] = React.useState(false);
  const [spotifyInput, setSpotifyInput] = React.useState("");
  const [spotifyActive, setSpotifyActive] = React.useState(false);
  const host = React.useRef<HTMLDivElement>(null);
  const playingRef = React.useRef(false);
  const playStart = React.useRef(0);
  const angle = React.useRef(0); // persists across play/stop, like a real one
  const platters = React.useRef<NodeListOf<Element> | null>(null);
  const discStatic = React.useRef<NodeListOf<Element> | null>(null);
  const tonearm = React.useRef<SVGGElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const spotifyRef = React.useRef<SpotifyController | null>(null);
  const spotifyHostRef = React.useRef<HTMLDivElement>(null);
  const spotifyActiveRef = React.useRef(false);
  const spotifyProgress = React.useRef({ pos: 0, dur: 0 }); // ms
  const lastSpotifySeek = React.useRef(0);
  // track-change swap: idle | out (sliding away) | waiting (off-stage, art
  // not resolved yet) | paused (empty-platter beat) | in (sliding back)
  const swapPhase = React.useRef<"idle" | "out" | "waiting" | "paused" | "in">(
    "idle",
  );
  const recordSlideX = React.useRef(0);
  const pendingTrack = React.useRef<{ uri: string; art?: string } | null>(
    null,
  );
  const swapPauseUntil = React.useRef(0);
  // playlist: an ordered list of track urls the widget owner provides.
  // double-tap advances through it — Spotify's embed API has no native
  // "skip" call, so this is just us re-loading the next url ourselves.
  const playlist = React.useRef<string[]>([]);
  const playlistIndex = React.useRef(0);
  const lastTapTime = React.useRef(0);
  const pendingToggleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // scratch audio: Web Audio buffers (an <audio> element can't play in
  // reverse). fwd + a sample-reversed copy; sources spawn per direction.
  const actx = React.useRef<AudioContext | null>(null);
  const scratchBufs = React.useRef<
    { fwd: AudioBuffer; rev: AudioBuffer } | "loading" | null
  >(null);
  const scratchSrc = React.useRef<{
    node: AudioBufferSourceNode;
    dir: 1 | -1;
  } | null>(null);
  // scratching: pointer angle tracking while dragging the record
  const drag = React.useRef({
    active: false,
    lastPointerAngle: 0,
    vel: 0, // deg/ms, signed
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__scratchDir = 0; // debug hook for tests
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__scratchReady = true; // debug hook for tests
      })
      .catch(() => {
        scratchBufs.current = null; // fall back to silent scrub
      });
  }

  // the one loop: platter velocity (motor / inertia / scratch), audio
  // coupling, arm swing + groove tracking + tremble
  React.useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let vel = 0; // platter deg/ms (signed while scratching)
    let armAngle = 0;
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;

      // frozen during a track-change swap — nothing's driving it once it's
      // lifted off, and it shouldn't already be spinning when it lands
      const needleDown =
        playingRef.current &&
        swapPhase.current === "idle" &&
        now - playStart.current >= NEEDLE_DROP_MS;

      if (drag.current.active) {
        // hand on the record: velocity comes from the pointer; decay it so
        // a held-still finger stops the platter
        drag.current.vel *= Math.exp(-dt / 80);
        vel = drag.current.vel;
      } else {
        const target = needleDown ? DEG_PER_MS : 0;
        const tau = target > vel ? SPIN_UP_TAU : COAST_DOWN_TAU;
        vel += (target - vel) * (1 - Math.exp(-dt / tau));
        // static friction: exponential decay never truly ends, a real platter does
        if (target === 0 && Math.abs(vel) < DEG_PER_MS * 0.08) vel = 0;
      }

      // track-change swap: pull the record off, swap it while hidden past
      // the viewBox edge, slide the new one back in. the needleDown gate
      // above already coasts the motor to a stop the instant this starts,
      // so the disc is at rest by the time it's off-stage and stays that
      // way until it lands and spins back up on its own.
      if (swapPhase.current === "out") {
        recordSlideX.current +=
          (SWAP_OFFSTAGE_X - recordSlideX.current) *
          (1 - Math.exp(-dt / SWAP_SLIDE_TAU));
        if (Math.abs(SWAP_OFFSTAGE_X - recordSlideX.current) < 4) {
          recordSlideX.current = SWAP_OFFSTAGE_X;
          swapPhase.current = "waiting";
        }
      } else if (swapPhase.current === "waiting") {
        // hold off-stage until the new track's uri/art has actually
        // resolved — a slow oEmbed fetch shouldn't cut the swap short
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
          playStart.current = now; // fresh needle-drop timing for the new track
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
        // the disc's own highlight/shadow/label rings — travel with it but
        // never rotate (they're the record's fixed sheen, not printed grooves)
        if (!discStatic.current?.length) {
          discStatic.current = host.current?.querySelectorAll(".disc-static") ?? null;
        }
        discStatic.current?.forEach((el) => {
          (el as SVGGElement).style.transform = `translateX(${recordSlideX.current}px)`;
        });
      }

      // spotify scrub: no raw audio to scratch, but dragging seeks the
      // real playback position (throttled — seek() crosses a postMessage
      // bridge, not a free property write) so the record still scrubs the
      // song. update spotifyProgress optimistically so the arm/UI track
      // the drag immediately instead of waiting on the next server echo.
      if (drag.current.active && spotifyActiveRef.current && spotifyRef.current) {
        const { pos, dur } = spotifyProgress.current;
        if (dur > 0) {
          const deltaMs = (vel * dt * SECONDS_PER_REV * 1000) / 360;
          const nextPos = Math.max(0, Math.min(dur, pos + deltaMs));
          spotifyProgress.current = { pos: nextPos, dur };
          if (now - lastSpotifySeek.current > 120) {
            lastSpotifySeek.current = now;
            spotifyRef.current.seek(nextPos / 1000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).__lastSpotifySeek = nextPos / 1000; // debug hook for tests
          }
        }
      }

      // audio follows the platter (archive mode only)
      const audio = audioRef.current;
      if (audio && !spotifyActiveRef.current) {
        if (drag.current.active) {
          // scratching: scrub the groove by hand (1 revolution = 1.8s)
          if (audio.duration) {
            const deltaSec = (vel * dt * SECONDS_PER_REV) / 360;
            audio.currentTime = Math.max(
              0,
              Math.min(audio.duration, audio.currentTime + deltaSec),
            );
          }
          if (!audio.paused) audio.pause();

          // audible scratch: spawn/steer a buffer source in the drag direction
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
              const rec = { node, dir } as const;
              node.onended = () => {
                if (scratchSrc.current?.node === node) scratchSrc.current = null;
              };
              scratchSrc.current = { node, dir };
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).__scratchDir = rec.dir; // debug hook for tests
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

      // tonearm: swing target (0 at rest, groove position while playing),
      // eased in JS, plus a once-per-revolution tremble phase-locked to the
      // platter and a faint faster tremor — all on ONE composited transform
      let progress = 0;
      if (spotifyActiveRef.current) {
        const { pos, dur } = spotifyProgress.current;
        if (dur > 0) progress = pos / dur;
      } else if (audio?.duration) {
        progress = audio.currentTime / audio.duration;
      }
      const armTarget =
        swapPhase.current !== "idle"
          ? 0 // lifted clear of the platter for the whole swap
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

  // pointer angle around the record center, in viewBox space
  function pointerAngle(e: React.PointerEvent): number | null {
    const svgEl = host.current?.querySelector("svg");
    if (!svgEl) return null;
    const r = svgEl.getBoundingClientRect();
    const scale = 1064 / r.width;
    const x = (e.clientX - r.left) * scale - CX;
    const y = (e.clientY - r.top) * scale - CY;
    if (Math.hypot(x, y) > 380) return null; // outside the record
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (swapPhase.current !== "idle") return; // record's mid-swap, nothing to grab
    const a = pointerAngle(e);
    if (a === null) return; // off the record: click will toggle play/pause
    e.currentTarget.setPointerCapture(e.pointerId);
    if (spotifyActiveRef.current) {
      // holding the record stops the motor — otherwise spotify keeps
      // playing underneath the drag and its own position updates fight
      // our scrub every time one arrives
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
    // instantaneous velocity, lightly smoothed
    drag.current.vel = drag.current.vel * 0.5 + (delta / 16.7) * 0.5;
    angle.current = (angle.current + delta) % 360;
  }

  function endDrag() {
    drag.current.active = false;
    stopScratchSrc();
    if (spotifyActiveRef.current && spotifyRef.current) {
      // land on the exact scrubbed position — the in-loop seek is
      // throttled — then let go of the record and the motor resumes
      spotifyRef.current.seek(spotifyProgress.current.pos / 1000);
      if (playingRef.current) spotifyRef.current.play();
    }
  }

  function toggle() {
    if (swapPhase.current !== "idle") return; // ignore clicks mid-swap
    // a scratch gesture shouldn't also toggle play/pause
    if (drag.current.moved > 4) {
      drag.current.moved = 0;
      return;
    }
    // double-tap to skip — only worth the disambiguation delay once there's
    // an actual playlist to skip through; a single track toggles instantly
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
        // decode the scratch buffers now, so the first grab is audible
        if (!spotifyActiveRef.current) ensureScratchBuffers();
      }
      // spotify has no rate control; sync play/pause to the needle instead
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

    // real album art for the record label — same oEmbed endpoint Spotify
    // uses for link unfurls, public + CORS-open, no auth needed
    const artPromise = fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
    )
      .then((r) => r.json())
      .then((d: { thumbnail_url?: string }) => d.thumbnail_url)
      .catch(() => undefined);

    // already got a record on the platter — animate the change instead of
    // an instant swap. the actual loadUri()/art update happens once the
    // record's off-stage (see the "waiting" phase in the rAF loop).
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
    // paste one link, or several (newline/comma separated) for a playlist —
    // double-tap advances through it once there's more than one
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
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-neutral-900 p-10">
      {/* purely for previewing the "glass" variant — real backdrop-blur has
          nothing to show against a flat color */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_35%_40%,#ff6b6b_0%,transparent_50%),radial-gradient(circle_at_70%_35%,#4d7cff_0%,transparent_50%),radial-gradient(circle_at_50%_75%,#ffb347_0%,transparent_55%)] opacity-90"
      />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex gap-1 rounded-full border border-white/15 bg-white/5 p-1">
          {(["full", "bare", "glass"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                variant === v
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        /* both moving parts are JS-driven single composited transforms;
           will-change keeps their SVG filters (grain, shadows) rasterized
           once instead of re-running on CPU every frame */
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
        /* three display variants — mechanics (rAF loop, drag, spotify) never
           change, only which chassis pieces render and how the body paints */
        [data-variant="bare"] .chassis-body,
        [data-variant="bare"] .chassis-controls {
          display: none;
        }
        [data-variant="glass"] .chassis-body {
          /* the SVG's own opaque body disappears; the host div's own
             backdrop-filter (below) shows through in its place, so
             whatever's behind the widget blurs like real glass. the
             buttons/knobs stay in .chassis-controls, fully opaque. */
          opacity: 0;
        }
      `}</style>
      {/* 50% of the SVG's native 1064px width */}
      <div
        ref={host}
        data-playing={playing}
        data-variant={variant}
        onClick={toggle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`w-[532px] max-w-full cursor-pointer touch-none select-none rounded-[4.5%] [&_svg]:h-auto [&_svg]:w-full ${
          variant === "glass"
            ? "border border-white/25 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150"
            : ""
        }`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <audio ref={audioRef} src={DEFAULT_TRACK} preload="auto" loop />

      {/* spotify hookup */}
      <div className="w-[532px] max-w-full space-y-3">
        <div className="flex gap-2">
          <input
            value={spotifyInput}
            onChange={(e) => setSpotifyInput(e.target.value)}
            placeholder="Paste a Spotify link — comma-separate a few for a playlist…"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/40"
          />
          <button
            onClick={connectSpotify}
            className="rounded-xl bg-[#1DB954] px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-85"
          >
            Connect
          </button>
        </div>
        <p className="text-xs text-white/40">
          Default: “So Far” — Anitek, Luna LP (CC BY-NC-ND, Dusted Wax
          Kingdom via Internet Archive). Drag the record to scratch. Spotify
          plays via the official embed; the tonearm drives play/pause.
          Comma-separate multiple links to make a playlist — double-tap the
          record to skip to the next track.
        </p>
        {/* the turntable is the player UI — Spotify's createController
            REPLACES the ref div with its raw iframe (same trick YouTube's
            IFrame API uses), so styling has to live on a wrapper it never
            touches. Visually hidden, not display:none — that can suspend
            embedded media in some browsers. */}
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
    </main>
  );
}
