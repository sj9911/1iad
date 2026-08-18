"use client";

import * as React from "react";

export function ThemeToggle() {
  const [dark, setDark] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="text-muted transition-all duration-300 hover:text-foreground active:scale-90"
    >
      {/* sun / moon, cross-fading */}
      <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden="true">
        {dark ? (
          <path d="M21.53 15.93a.75.75 0 0 0-.87-.36 8 8 0 0 1-9.98-9.98.75.75 0 0 0-.93-.93A9.5 9.5 0 1 0 21.9 16.8a.75.75 0 0 0-.37-.87Z" />
        ) : (
          <path d="M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 2Zm0 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 20Zm10-8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 22 12ZM4.25 12a.75.75 0 0 1-.75.75H2a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm14.7-6.95a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM7.17 16.83a.75.75 0 0 1 0 1.06L6.11 18.95a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm11.78 2.12a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06ZM7.17 7.17a.75.75 0 0 1-1.06 0L5.05 6.11a.75.75 0 0 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Z" />
        )}
      </svg>
    </button>
  );
}
