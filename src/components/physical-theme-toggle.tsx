"use client";

import { useState } from "react";

export default function PhysicalThemeToggle() {
  const [night, setNight] = useState(false);

  const toggleTheme = (checked: boolean) => {
    setNight(checked);
    document.documentElement.classList.toggle("dark", checked);
  };

  return (
    <label className={`relative block rounded-[28px] p-6 transition-colors duration-200 ${night ? "bg-[#090b12]" : "bg-[#e9edf4]"}`}>
      <span className="sr-only">Toggle the miniature sky</span>
      <input
        checked={night}
        className="peer absolute inset-0 cursor-pointer appearance-none rounded-[28px]"
        onChange={(event) => toggleTheme(event.target.checked)}
        type="checkbox"
      />
      <span className="pointer-events-none relative flex h-16 w-32 items-center rounded-2xl bg-black/15 p-1.5 shadow-inner">
        <span className={`absolute left-5 text-xl transition-opacity duration-150 ${night ? "opacity-100" : "opacity-0"}`}>✦</span>
        <span className={`absolute right-4 text-xl transition-opacity duration-150 ${night ? "opacity-0" : "opacity-100"}`}>☀</span>
        <span className={`relative z-10 grid size-13 grid-cols-3 place-items-center rounded-xl bg-white shadow-[0_6px_18px_rgba(0,0,0,.25),inset_0_1px_0_white] transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] ${night ? "translate-x-16" : "translate-x-0"}`}>
          {Array.from({ length: 9 }, (_, index) => (
            <span className="size-1 rounded-full bg-black/20" key={index} />
          ))}
        </span>
      </span>
    </label>
  );
}
