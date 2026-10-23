import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[1];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={2}
      features={[
        "Weekly grid with drag to move and resize classes",
        "Colour-coded subjects, rooms and teachers",
        "Import from Google Calendar or an .ics file",
      ]}
    />
  );
}
