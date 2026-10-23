"use client";

import { Coffee, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTimer } from "./timer-provider";

/** Small countdown in the top bar while a timer runs on another page. */
export function StudyTimerChip() {
  const timer = useTimer();
  const pathname = usePathname();
  if (timer.status === "idle" || pathname === "/study") return null;
  const total = Math.ceil(timer.remaining / 1000);
  const label = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return (
    <Link
      href="/study"
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm font-medium tabular-nums transition hover:brightness-95",
        timer.phase === "focus" ? "bg-accent text-accent-foreground" : "bg-success/15 text-success",
        timer.status === "paused" && "opacity-60",
      )}
    >
      {timer.phase === "focus" ? <Timer className="size-3.5" /> : <Coffee className="size-3.5" />}
      {label}
    </Link>
  );
}
