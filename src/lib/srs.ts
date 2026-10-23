import { addDays, format } from "date-fns";
import type { Flashcard } from "@/lib/data/types";

export type Rating = "again" | "hard" | "good" | "easy";

const QUALITY: Record<Rating, number> = { again: 1, hard: 3, good: 4, easy: 5 };

export const todayKey = (date = new Date()) => format(date, "yyyy-MM-dd");

export const isDue = (card: Flashcard, date = new Date()) => card.dueOn <= todayKey(date);

/**
 * Next review for a card, SM-2 style: a failed card comes back today, and
 * each success pushes the next review further out by the card's ease.
 */
export function schedule(card: Flashcard, rating: Rating, now = new Date()) {
  const q = QUALITY[rating];
  const ease = Math.max(1.3, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  let intervalDays: number;
  if (rating === "again") intervalDays = 0;
  else if (card.intervalDays === 0) intervalDays = rating === "easy" ? 3 : 1;
  else {
    const factor = rating === "hard" ? 1.2 : rating === "easy" ? ease * 1.3 : ease;
    intervalDays = Math.max(card.intervalDays + 1, Math.round(card.intervalDays * factor));
  }

  return {
    ease: Math.round(ease * 100) / 100,
    intervalDays,
    dueOn: todayKey(addDays(now, intervalDays)),
  };
}

/** Human label for when a rating would show the card next. */
export function previewInterval(card: Flashcard, rating: Rating) {
  const days = schedule(card, rating).intervalDays;
  if (days === 0) return "<10m";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}
