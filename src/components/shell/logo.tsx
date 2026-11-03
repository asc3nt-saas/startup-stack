import Link from "next/link";
import { cn } from "@/lib/utils";

/** The QuizStack mark and wordmark: "Quiz" heavy, "Stack" lighter, like the brand logo. */
export function Logo({ href = "/today", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="QuizStack home"
      className={cn("flex items-center gap-2 text-[#22126b] dark:text-foreground", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="size-9 shrink-0" />
      <span className="text-[19px] leading-none tracking-[-0.03em]">
        <span className="font-extrabold">Quiz</span>
        <span className="font-medium">Stack</span>
      </span>
    </Link>
  );
}
