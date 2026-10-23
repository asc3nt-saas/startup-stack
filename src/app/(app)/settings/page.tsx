import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { secondaryNav } from "@/components/shell/nav";

const item = secondaryNav[0];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={2}
      features={[
        "Edit your name, school and avatar",
        "Choose reminder timing and grading scale",
        "Language: English, O'zbekcha, Русский",
      ]}
    />
  );
}
