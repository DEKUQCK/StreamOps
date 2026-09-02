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
    <div className="flex items-center justify-between gap-3 rounded-md bg-zinc-100 px-3 py-2">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {revealed ? (
        <button
          onClick={hide}
          className="rounded bg-white px-2 py-1 font-mono text-sm text-zinc-900 shadow-sm"
          title="Klicken zum Verbergen"
        >
          {value}
        </button>
      ) : (
        <button
          onClick={reveal}
          className="rounded border border-zinc-300 bg-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-300"
        >
          •••• anzeigen
        </button>
      )}
    </div>
  );
}
