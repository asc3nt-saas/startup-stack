"use client";

import { ArrowLeft, PartyPopper, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutations } from "@/lib/data/hooks";
import type { Flashcard, FlashcardDeck } from "@/lib/data/types";
import { previewInterval, schedule, type Rating } from "@/lib/srs";
import { cn } from "@/lib/utils";

const RATINGS: { rating: Rating; label: string; key: string; className: string }[] = [
  { rating: "again", label: "Again", key: "1", className: "border-danger/40 text-danger hover:bg-danger/10" },
  { rating: "hard", label: "Hard", key: "2", className: "border-warning/50 text-warning hover:bg-warning/10" },
  { rating: "good", label: "Good", key: "3", className: "border-primary/40 text-primary hover:bg-primary/10" },
  { rating: "easy", label: "Easy", key: "4", className: "border-success/40 text-success hover:bg-success/10" },
];

/**
 * Reviews a queue of cards. "Again" sends a card to the back of the queue so
 * it comes up once more before the session ends.
 */
export function StudySession({
  deck,
  cards,
  onExit,
}: {
  deck: FlashcardDeck;
  cards: Flashcard[];
  onExit: () => void;
}) {
  const { update } = useMutations("cards");
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [results, setResults] = useState<Record<Rating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const total = cards.length;
  const card = queue[0];
  const done = !card;

  const rate = useCallback(
    (rating: Rating) => {
      if (!card || !flipped) return;
      const next = schedule(card, rating);
      update.mutate({ id: card.id, patch: next });
      setResults((r) => ({ ...r, [rating]: r[rating] + 1 }));
      setReviewed((n) => n + 1);
      setFlipped(false);
      setQueue(([, ...rest]) => (rating === "again" ? [...rest, { ...card, ...next }] : rest));
    },
    [card, flipped, update],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      const match = RATINGS.find((r) => r.key === e.key);
      if (match) rate(match.rating);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rate]);

  const remaining = queue.length;
  const progress = total ? ((total - Math.min(remaining, total)) / total) * 100 : 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onExit} aria-label="Back to deck">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{deck.title}</h1>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {Math.min(total - remaining + 1, total)}/{total}
        </span>
      </div>

      {done ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border bg-card p-10 text-center shadow-sm"
        >
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success"
          >
            <PartyPopper className="size-8" />
          </motion.div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Session complete!</h2>
          <p className="mt-1 text-muted-foreground">
            You reviewed {reviewed} {reviewed === 1 ? "card" : "cards"}.
          </p>
          <div className="mt-6 grid grid-cols-4 gap-2 text-sm">
            {RATINGS.map((r) => (
              <div key={r.rating} className="rounded-lg bg-muted p-3">
                <div className="text-xl font-semibold tabular-nums">{results[r.rating]}</div>
                <div className="text-xs text-muted-foreground">{r.label}</div>
              </div>
            ))}
          </div>
          <Button className="mt-8" onClick={onExit}>
            Back to deck
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="[perspective:1600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${card.id}-${reviewed}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={() => setFlipped((f) => !f)}
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="relative block h-80 w-full cursor-pointer [transform-style:preserve-3d]"
                  aria-label={flipped ? "Show question" : "Show answer"}
                >
                  <CardFace label="Question" text={card.front} />
                  <CardFace label="Answer" text={card.back} back />
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>

          {flipped ? (
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.rating}
                  onClick={() => rate(r.rating)}
                  className={cn(
                    "flex cursor-pointer flex-col items-center rounded-xl border bg-card py-3 text-sm font-medium transition active:scale-95",
                    r.className,
                  )}
                >
                  {r.label}
                  <span className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                    {previewInterval(card, r.rating)} · {r.key}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Button size="lg" className="w-full" onClick={() => setFlipped(true)}>
              <RotateCcw /> Show answer
              <kbd className="ml-2 rounded bg-white/20 px-1.5 text-xs">Space</kbd>
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function CardFace({ label, text, back }: { label: string; text: string; back?: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border p-8 text-center shadow-lg [backface-visibility:hidden]",
        back
          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white [transform:rotateY(180deg)]"
          : "bg-card",
      )}
    >
      <span
        className={cn(
          "absolute left-5 top-4 text-xs font-medium uppercase tracking-wide",
          back ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <p className="whitespace-pre-wrap text-xl font-medium leading-relaxed sm:text-2xl">{text}</p>
      {!back && <span className="absolute bottom-4 text-xs text-muted-foreground">Click or press Space to flip</span>}
    </div>
  );
}
