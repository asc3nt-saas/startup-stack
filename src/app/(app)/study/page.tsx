import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[6];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={3}
      features={[
        "Pomodoro and custom timers with a flip clock",
        "Daily streaks, XP and weekly stats",
        "Log study time per subject",
      ]}
    />
  );
}
