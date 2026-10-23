import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[3];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={2}
      features={[
        "Rich text notes organised by subject",
        "Pin, search and link notes",
        "Turn any note into AI flashcards",
      ]}
    />
  );
}
