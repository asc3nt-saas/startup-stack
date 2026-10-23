import type { Metadata } from "next";
import { ChatView } from "@/components/chat/chat-view";

export const metadata: Metadata = { title: "Group chat" };

export default function ChatPage() {
  return <ChatView />;
}
