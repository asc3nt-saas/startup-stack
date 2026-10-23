import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[2];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={2}
      features={[
        "Board and list views for homework, projects, quizzes and exams",
        "Priorities, due dates and progress status",
        "Reminders before each deadline",
      ]}
    />
  );
}
