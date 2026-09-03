"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/error-screen";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorScreen reset={reset} homeHref="/" homeLabel="Zur Startseite" />;
}
