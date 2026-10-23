import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Renders **bold** inside a line. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * The small slice of Markdown the AI is asked to write: paragraphs separated
 * by blank lines, "- " bullet lists and **bold**.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={cn("space-y-3 leading-relaxed", className)}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*[-*•]\s/.test(l))) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{inline(l.replace(/^\s*[-*•]\s/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        // A paragraph that leads into a list, e.g. "Example:\n- a\n- b".
        const firstBullet = lines.findIndex((l) => /^\s*[-*•]\s/.test(l));
        if (firstBullet > 0) {
          return (
            <div key={i} className="space-y-1.5">
              <p>{inline(lines.slice(0, firstBullet).join(" "))}</p>
              <RichText text={lines.slice(firstBullet).join("\n")} />
            </div>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
