import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { mainNav } from "@/components/shell/nav";

const item = mainNav[7];

export const metadata: Metadata = { title: item.label };

export default function Page() {
  return (
    <ComingSoon
      item={item}
      step={3}
      features={[
        "Group chats per class or study group",
        "Join with an invite code",
        "Real-time messages",
      ]}
    />
  );
}
