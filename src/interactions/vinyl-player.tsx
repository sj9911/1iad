"use client";

/**
 * 1IAD Day 7 — Vinyl Player
 *
 * A tactile record player with motor spin-up, needle-drop timing, a tonearm
 * that tracks the groove, and direct-manipulation scratching. Supply your own
 * SVG chassis via `svgUrl`; the SVG needs `.platter`, `.disc-static`, and
 * `.tonearm` groups (the Day 7 reference asset is included on 1iad.com).
 */

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

// CC0 performance of Beethoven's Bagatelle No. 25 (Für Elise), hosted by
// Wikimedia Commons. The cover is Beethoven's public-domain autograph sketch
// for the piece, rather than a third-party album sleeve.
const DEFAULT_TRACK =
  "https://upload.wikimedia.org/wikipedia/commons/7/7b/FurElise.ogg";
const DEFAULT_ARTWORK =
  "https://upload.wikimedia.org/wikipedia/commons/c/c3/Beethoven_BH_116_Detail.jpg";
const DEFAULT_SVG = "/tmp/vinyl-ref.svg";

export type VinylVariant = "full" | "bare" | "glass";

type SpotifyController = {
  play: () => void;
  pause: () => void;
  loadUri: (uri: string) => void;
};

function toSpotifyUri(url: string) {
  const match = url.match(
    /open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/,
  );
  return match ? `spotify:${match[1]}:${match[2]}` : null;
}

export function VinylPlayer({
  className = "w-[min(76vw,560px)]",
  svgUrl = DEFAULT_SVG,
  audioUrl = DEFAULT_TRACK,
  variant = "full",
  artworkUrl,
  spotifyUrl,
}: {
  className?: string;
  svgUrl?: string;
  audioUrl?: string;
  variant?: VinylVariant;
  artworkUrl?: string;
  spotifyUrl?: string;
}) {
  const [svg, setSvg] = React.useState("");
  const [playing, setPlaying] = React.useState(false);
  const host = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const playingRef = React.useRef(false);
  const playStart = React.useRef(0);
  const angle = React.useRef(0);
  // The groove ring and the album-art label are sibling SVG groups; they
  // must share a transform or the record appears to spin around static art.
  const platters = React.useRef<NodeListOf<SVGGElement> | null>(null);
  const tonearm = React.useRef<SVGGElement | null>(null);
  const spotify = React.useRef<SpotifyController | null>(null);
  const spotifyHost = React.useRef<HTMLDivElement>(null);
  const spotifyActive = React.useRef(false);
  const scratchContext = React.useRef<AudioContext | null>(null);
  const scratchBuffers = React.useRef<
    { forward: AudioBuffer; reverse: AudioBuffer } | "loading" | null
  >(null);
  const scratchSource = React.useRef<{
    node: AudioBufferSourceNode;
    direction: 1 | -1;
  } | null>(null);
  const drag = React.useRef({
    active: false,
    angle: 0,
    velocity: 0,
    moved: 0,
  });

  React.useEffect(() => {
    let cancelled = false;
    fetch(svgUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${svgUrl}`);
        return response.text();
      })
      .then((source) => {
        if (cancelled) return;
        platters.current = null;
        tonearm.current = null;
        setSvg(source);
      })
      .catch(() => setSvg(""));
    return () => {
      cancelled = true;
    };
  }, [svgUrl]);

  // Artwork is intentionally injected after the chassis SVG loads so a user
  // can try an image URL without replacing the component's source asset.
  React.useEffect(() => {
    host.current?.querySelector("image")?.setAttribute("href", artworkUrl || DEFAULT_ARTWORK);
  }, [artworkUrl, svg]);

  React.useEffect(() => {
    const uri = spotifyUrl ? toSpotifyUri(spotifyUrl) : null;
    spotifyActive.current = Boolean(uri);
    if (!uri || !spotifyHost.current) return;
    audioRef.current?.pause();
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl!)}`)
      .then((response) => response.json())
      .then((data: { thumbnail_url?: string }) => {
        if (!artworkUrl && data.thumbnail_url) {
          host.current?.querySelector("image")?.setAttribute("href", data.thumbnail_url);
        }
      })
      .catch(() => {});
    if (spotify.current) {
      spotify.current.loadUri(uri);
      return;
    }
    // Official Spotify IFrame API. The iframe remains visually hidden; the
    // turntable is the control surface and stays accessible to the user.
    const ready = (api: { createController: (el: HTMLElement, options: { uri: string; width: string; height: number }, callback: (controller: SpotifyController) => void) => void }) => {
      if (!spotifyHost.current) return;
      api.createController(spotifyHost.current, { uri, width: "100%", height: 80 }, (controller) => {
        spotify.current = controller;
      });
    };
    (window as typeof window & { onSpotifyIframeApiReady?: typeof ready }).onSpotifyIframeApiReady = ready;
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://open.spotify.com/embed/iframe-api/v1"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [artworkUrl, spotifyUrl]);

  React.useEffect(() => {
    if (!spotifyActive.current || !spotify.current) return;
    if (playing) {
      const timer = window.setTimeout(() => spotify.current?.play(), NEEDLE_DROP_MS);
      return () => window.clearTimeout(timer);
    }
    spotify.current.pause();
  }, [playing]);

  function stopScratch() {
    try {
      scratchSource.current?.node.stop();
    } catch {}
    scratchSource.current = null;
  }

  function prepareScratch() {
    if (scratchBuffers.current) return;
    scratchBuffers.current = "loading";
    scratchContext.current ??= new AudioContext();
    fetch(audioUrl)
      .then((response) => response.arrayBuffer())
      .then((buffer) => scratchContext.current!.decodeAudioData(buffer))
      .then((forward) => {
        const reverse = scratchContext.current!.createBuffer(
          forward.numberOfChannels,
          forward.length,
          forward.sampleRate,
        );
        for (let channel = 0; channel < forward.numberOfChannels; channel++) {
          const source = forward.getChannelData(channel);
          const target = reverse.getChannelData(channel);
          for (let i = 0; i < source.length; i++) target[i] = source[source.length - 1 - i];
        }
        scratchBuffers.current = { forward, reverse };
      })
      .catch(() => {
        scratchBuffers.current = null;
      });
  }

  React.useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let velocity = 0;
    let armAngle = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = (now: number) => {
      const elapsed = Math.min(now - last, 50);
      last = now;
      const needleDown =
        playingRef.current && now - playStart.current >= NEEDLE_DROP_MS;

      if (drag.current.active) {
        drag.current.velocity *= Math.exp(-elapsed / 80);
        velocity = drag.current.velocity;
      } else {
        const target = needleDown && !reduced ? DEG_PER_MS : 0;
        const tau = target > velocity ? SPIN_UP_TAU : COAST_DOWN_TAU;
        velocity += (target - velocity) * (1 - Math.exp(-elapsed / tau));
        if (target === 0 && Math.abs(velocity) < DEG_PER_MS * 0.08) velocity = 0;
      }

      if (!drag.current.active) angle.current = (angle.current + velocity * elapsed) % 360;
      platters.current ??=
        host.current?.querySelectorAll<SVGGElement>(".platter") ?? null;
      platters.current?.forEach((platter) => {
        platter.style.setProperty("transform", `rotate(${angle.current}deg)`);
      });

      const audio = audioRef.current;
      if (audio && !spotifyActive.current) {
        if (drag.current.active) {
          if (audio.duration) {
            const delta = (velocity * elapsed * SECONDS_PER_REV) / 360;
            audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
          }
          if (!audio.paused) audio.pause();
          const buffers = scratchBuffers.current;
          if (buffers && buffers !== "loading" && scratchContext.current && audio.duration) {
            const ratio = velocity / DEG_PER_MS;
            const direction = ratio > 0.02 ? 1 : ratio < -0.02 ? -1 : 0;
            if (direction === 0) {
              stopScratch();
            } else if (!scratchSource.current || scratchSource.current.direction !== direction) {
              stopScratch();
              const node = scratchContext.current.createBufferSource();
              node.buffer = direction === 1 ? buffers.forward : buffers.reverse;
              node.playbackRate.value = Math.max(0.05, Math.min(6, Math.abs(ratio)));
              node.connect(scratchContext.current.destination);
              const offset = direction === 1
                ? audio.currentTime
                : Math.max(0, buffers.forward.duration - audio.currentTime);
              try {
                node.start(0, Math.min(offset, node.buffer.duration - 0.01));
              } catch {}
              node.onended = () => {
                if (scratchSource.current?.node === node) scratchSource.current = null;
              };
              scratchSource.current = { node, direction };
            } else {
              scratchSource.current.node.playbackRate.value = Math.max(0.05, Math.min(6, Math.abs(ratio)));
            }
          }
        } else {
          if (scratchSource.current) stopScratch();
          const ratio = velocity / DEG_PER_MS;
          if (ratio > 0.07) {
            audio.playbackRate = Math.max(0.07, Math.min(1, ratio));
            if (audio.paused) void audio.play().catch(() => {});
          } else if (!audio.paused) {
            audio.pause();
          }
        }
      }

      const progress = audio?.duration ? audio.currentTime / audio.duration : 0;
      const targetArm = playingRef.current
        ? ARM_START_DEG + (ARM_END_DEG - ARM_START_DEG) * Math.min(1, progress)
        : 0;
      armAngle += (targetArm - armAngle) * (1 - Math.exp(-elapsed / ARM_TAU));
      const tremble = armAngle > ARM_START_DEG * 0.8
        ? Math.min(1, Math.abs(velocity) / DEG_PER_MS) *
          (Math.sin((angle.current * Math.PI) / 180) * 0.14 + Math.sin(now * 0.019) * 0.05)
        : 0;
      tonearm.current ??=
        host.current?.querySelector<SVGGElement>(".tonearm") ?? null;
      tonearm.current?.style.setProperty("transform", `rotate(${armAngle + tremble}deg)`);

      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      stopScratch();
    };
  }, [audioUrl]);

  function pointerAngle(event: React.PointerEvent) {
    const svgElement = host.current?.querySelector("svg");
    if (!svgElement) return null;
    const rect = svgElement.getBoundingClientRect();
    const scale = 1064 / rect.width;
    const x = (event.clientX - rect.left) * scale - CX;
    const y = (event.clientY - rect.top) * scale - CY;
    if (Math.hypot(x, y) > 380) return null;
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function onPointerDown(event: React.PointerEvent) {
    const nextAngle = pointerAngle(event);
    if (nextAngle === null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { active: true, angle: nextAngle, velocity: 0, moved: 0 };
    prepareScratch();
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!drag.current.active) return;
    const nextAngle = pointerAngle(event);
    if (nextAngle === null) return;
    let delta = nextAngle - drag.current.angle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    drag.current.angle = nextAngle;
    drag.current.moved += Math.abs(delta);
    drag.current.velocity = drag.current.velocity * 0.5 + (delta / 16.7) * 0.5;
    angle.current = (angle.current + delta) % 360;
  }

  function endDrag() {
    drag.current.active = false;
    stopScratch();
  }

  function toggle() {
    if (drag.current.moved > 4) {
      drag.current.moved = 0;
      return;
    }
    setPlaying((current) => {
      const next = !current;
      playingRef.current = next;
      if (next) {
        playStart.current = performance.now();
        prepareScratch();
      }
      return next;
    });
  }

  return (
    <div className={className}>
      <style>{`
        [data-vinyl-player] .tonearm { transform-box: view-box; transform-origin: 936px 127px; will-change: transform; }
        [data-vinyl-player] .platter { transform-box: view-box; transform-origin: ${CX}px ${CY}px; will-change: transform; }
        [data-vinyl-player] .disc-static { transform-box: view-box; will-change: transform; }
        [data-vinyl-player][data-variant="bare"] .chassis-body,
        [data-vinyl-player][data-variant="bare"] .chassis-controls { display: none; }
        [data-vinyl-player][data-variant="glass"] .chassis-body { opacity: 0; }
      `}</style>
      <div
        ref={host}
        data-vinyl-player
        data-playing={playing}
        data-variant={variant}
        role="button"
        tabIndex={0}
        aria-label={playing ? "Pause the record" : "Play the record"}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`relative cursor-grab touch-none select-none rounded-[4.5%] outline-none focus-visible:ring-2 focus-visible:ring-[var(--oiad-blue)] focus-visible:ring-offset-4 active:cursor-grabbing [&_svg]:h-auto [&_svg]:w-full ${variant === "glass" ? "border border-white/25 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl backdrop-saturate-150" : ""}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <audio ref={audioRef} src={audioUrl} preload="auto" loop />
      <div className="absolute size-px overflow-hidden opacity-0 pointer-events-none">
        <div ref={spotifyHost} />
      </div>
    </div>
  );
}
