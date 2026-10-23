import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[5];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={3}
      features={[
        "Decks per subject with flip animations",
        "Spaced repetition so you review at the right time",
        "Generate cards from notes or files with AI",
      ]}
    />
  );
}
