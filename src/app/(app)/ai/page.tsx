import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[8];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={4}
      features={[
        "Upload a PDF, slides or notes",
        "Get a clear summary powered by Gemini",
        "A Duolingo-style roadmap with lessons, quizzes and XP",
      ]}
    />
  );
}
