"use client";

// v2 hero: the typeset composition flickers to the handwritten one and back.
// "One" and "A Day" are the only parts that differ, so swapping whole
// compositions reads as just those words flickering.

import * as React from "react";

export type HeroArt = { viewBox: string; inner: string };

export function HeroFlicker({ art }: { art: [HeroArt, HeroArt] }) {
  const [hand, setHand] = React.useState(false);

  // mostly typeset; every 2-4s the handwritten version blinks in briefly
  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setHand(true);
        t = setTimeout(() => {
          setHand(false);
          schedule();
        }, 200 + Math.random() * 150);
      }, 2000 + Math.random() * 2000);
    };
    schedule();
    return () => clearTimeout(t);
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
