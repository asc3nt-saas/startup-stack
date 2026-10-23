"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** One flip-card digit. The old value folds down to reveal the new one. */
function FlipDigit({ value, size }: { value: string; size: "lg" | "sm" }) {
  const [state, setState] = useState({ value, prev: value });
  if (state.value !== value) setState({ value, prev: state.value });
  const { prev } = state;

  const box =
    size === "lg"
      ? "h-28 w-20 text-[5.5rem] sm:h-40 sm:w-28 sm:text-[8rem]"
      : "h-10 w-7 text-3xl";

  const half = "absolute inset-x-0 h-1/2 overflow-hidden bg-card";
  const glyph = "absolute inset-x-0 flex h-[200%] items-center justify-center";

  return (
    <div className={cn("relative rounded-xl font-mono font-semibold tabular-nums shadow-lg [perspective:400px]", box)}>
      {/* Static: new value on top, old value on the bottom until the flap lands */}
      <div className={cn(half, "top-0 rounded-t-xl")}>
        <span className={cn(glyph, "top-0")}>{value}</span>
      </div>
      <div className={cn(half, "bottom-0 rounded-b-xl")}>
        <span className={cn(glyph, "bottom-0")}>{prev}</span>
      </div>
      {prev !== value && (
        <>
          <div key={`t-${value}`} className={cn(half, "animate-flip-top top-0 rounded-t-xl")}>
            <span className={cn(glyph, "top-0")}>{prev}</span>
          </div>
          <div key={`b-${value}`} className={cn(half, "animate-flip-bottom bottom-0 rounded-b-xl")}>
            <span className={cn(glyph, "bottom-0")}>{value}</span>
          </div>
        </>
      )}
      {/* The hinge line */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-px bg-black/25 dark:bg-black/60" />
    </div>
  );
}

export function FlipClock({ ms, size = "lg" }: { ms: number; size?: "lg" | "sm" }) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  const gap = size === "lg" ? "gap-2 sm:gap-3" : "gap-1";

  return (
    <div className={cn("flex items-center", size === "lg" ? "gap-3 sm:gap-5" : "gap-1.5")} aria-label={`${minutes}:${seconds}`} role="timer">
      <div className={cn("flex", gap)}>
        {minutes.split("").map((d, i) => (
          <FlipDigit key={`m${i}`} value={d} size={size} />
        ))}
      </div>
      <div className={cn("flex flex-col", size === "lg" ? "gap-4 sm:gap-6" : "gap-1.5")}>
        <span className={cn("rounded-full bg-muted-foreground/60", size === "lg" ? "size-3 sm:size-4" : "size-1.5")} />
        <span className={cn("rounded-full bg-muted-foreground/60", size === "lg" ? "size-3 sm:size-4" : "size-1.5")} />
      </div>
      <div className={cn("flex", gap)}>
        {seconds.split("").map((d, i) => (
          <FlipDigit key={`s${i}`} value={d} size={size} />
        ))}
      </div>
    </div>
  );
}
