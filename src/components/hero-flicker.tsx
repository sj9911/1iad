"use client";

// v2 hero: decorative SVG pieces + real text, composited in the poster's
// 738x386 coordinate space. Each word slot blinks to its handwritten SVG
// on its own random clock.

import * as React from "react";

const W = 738;
const H = 386;

export type Piece = {
  viewBox: string;
  inner: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function PieceSvg({ piece }: { piece: Piece }) {
  return (
    <svg
      viewBox={piece.viewBox}
      className="absolute"
      style={{
        left: `${(piece.x / W) * 100}%`,
        top: `${(piece.y / H) * 100}%`,
        width: `${(piece.w / W) * 100}%`,
        height: `${(piece.h / H) * 100}%`,
      }}
      dangerouslySetInnerHTML={{ __html: piece.inner }}
    />
  );
}

// shows the real-text `print` normally; every 2-4s blinks to the
// handwritten SVG pieces for 200-350ms
function WordSlot({
  print,
  hand,
}: {
  print: React.ReactNode;
  hand: Piece[];
}) {
  const [showHand, setShowHand] = React.useState(false);

  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setShowHand(true);
        t = setTimeout(() => {
          setShowHand(false);
          schedule();
        }, 200 + Math.random() * 150);
      }, 2000 + Math.random() * 2000);
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <span className={showHand ? "invisible" : ""}>{print}</span>
      <span className={showHand ? "" : "invisible"}>
        {hand.map((p, i) => (
          <PieceSvg key={i} piece={p} />
        ))}
      </span>
    </>
  );
}

export function HeroFlicker({
  statics,
  children,
  slots,
}: {
  statics: Piece[];
  children?: React.ReactNode; // static real-text layers
  slots: { print: React.ReactNode; hand: Piece[] }[];
}) {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size" }}
    >
      {statics.map((p, i) => (
        <PieceSvg key={i} piece={p} />
      ))}
      {children}
      {slots.map((slot, i) => (
        <WordSlot key={i} print={slot.print} hand={slot.hand} />
      ))}
    </div>
  );
}
