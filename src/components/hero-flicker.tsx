"use client";

// v2 hero, composited from individual pieces so "One" and "A Day" can
// each blink to their handwritten version on their own random clocks.

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

function PieceSvg({ piece }: { piece: Piece }) {
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

// shows `print` normally; every 2-4s blinks to `hand` for 200-350ms
function WordSlot({ print, hand }: { print: Piece[]; hand: Piece[] }) {
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
      <span className={showHand ? "invisible" : ""}>
        {print.map((p, i) => (
          <PieceSvg key={i} piece={p} />
        ))}
      </span>
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
  slots,
}: {
  statics: Piece[];
  slots: { print: Piece[]; hand: Piece[] }[];
}) {
  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      {statics.map((p, i) => (
        <PieceSvg key={i} piece={p} />
      ))}
      {slots.map((slot, i) => (
        <WordSlot key={i} print={slot.print} hand={slot.hand} />
      ))}
    </div>
  );
}
