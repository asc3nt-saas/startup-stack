"use client";

import { useEffect, useState } from "react";

/**
 * The current time, refreshed every minute. It is null during prerendering
 * and the first client render, so time-based UI never mismatches on hydration.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // The clock is browser-only state, so it is set after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
