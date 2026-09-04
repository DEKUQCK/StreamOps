"use client";

import { useEffect, useRef, useState } from "react";

const AUTO_HIDE_MS = 8000;

/**
 * "Stream-Proof Mode": the value stays masked until the viewer clicks to
 * reveal it, and re-hides immediately on window blur (screen-share/alt-tab)
 * or after a short timeout — so a background window never leaks it.
 */
export function SensitiveField({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function hide() {
    setRevealed(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }

  function reveal() {
    setRevealed(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hide, AUTO_HIDE_MS);
  }

  useEffect(() => {
    if (!revealed) return;
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [revealed]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
      <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {revealed ? (
        <button
          onClick={hide}
          className="shrink-0 rounded-md bg-card px-2.5 py-1 font-mono text-sm shadow-sm"
          title="Klicken zum Verbergen"
        >
          {value}
        </button>
      ) : (
        <button
          onClick={reveal}
          className="shrink-0 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-card"
        >
          •••• anzeigen
        </button>
      )}
    </div>
  );
}
