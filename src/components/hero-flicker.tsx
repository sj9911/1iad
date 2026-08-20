"use client";

// v2 hero: the typeset composition flickers to the handwritten one and back.
// "One" and "A Day" are the only parts that differ, so swapping whole
// compositions reads as just those words flickering.

import * as React from "react";

const SWAP_MS = 800;

export type HeroArt = { viewBox: string; inner: string };

export function HeroFlicker({ art }: { art: [HeroArt, HeroArt] }) {
  const [hand, setHand] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setHand((h) => !h), SWAP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full">
      {art.map((a, i) => (
        <svg
          key={i}
          viewBox={a.viewBox}
          className={`w-full ${i === 0 ? "" : "absolute inset-0"} ${
            (i === 1) === hand ? "visible" : "invisible"
          }`}
          dangerouslySetInnerHTML={{ __html: a.inner }}
        />
      ))}
    </div>
  );
}
