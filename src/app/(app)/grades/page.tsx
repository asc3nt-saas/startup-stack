import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[4];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={2}
      features={[
        "Spreadsheet-style table with weights and categories",
        "Live GPA and average per subject",
        '"What do I need on the final?" calculator',
      ]}
    />
  );
}
