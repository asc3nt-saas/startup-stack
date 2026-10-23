import type { Metadata } from "next";
import { AiView } from "@/components/ai/ai-view";

export const metadata: Metadata = { title: "AI roadmap" };

export default function AiPage() {
  return <AiView />;
}
