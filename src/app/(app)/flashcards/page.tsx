import type { Metadata } from "next";
import { FlashcardsView } from "@/components/flashcards/flashcards-view";

export const metadata: Metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  return <FlashcardsView />;
}
