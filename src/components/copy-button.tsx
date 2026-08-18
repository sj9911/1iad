"use client";

import * as React from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-black focus-visible:outline-2 focus-visible:outline-accent active:scale-95"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
