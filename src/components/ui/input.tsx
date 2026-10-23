import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
