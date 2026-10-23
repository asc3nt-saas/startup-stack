import {
  CalendarDays,
  Layers,
  ListChecks,
  MessagesSquare,
  NotebookPen,
  Settings,
  Sheet,
  Sparkles,
  Sun,
  Timer,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const mainNav: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun, description: "Your day at a glance" },
  { href: "/timetable", label: "Timetable", icon: CalendarDays, description: "Your weekly classes" },
  { href: "/assignments", label: "Assignments", icon: ListChecks, description: "Homework, projects and exams" },
  { href: "/notes", label: "Notes", icon: NotebookPen, description: "Write and organise notes" },
  { href: "/grades", label: "Grades", icon: Sheet, description: "Track scores and GPA" },
  { href: "/flashcards", label: "Flashcards", icon: Layers, description: "Review with spaced repetition" },
  { href: "/study", label: "Study timer", icon: Timer, description: "Focus sessions and streaks" },
  { href: "/chat", label: "Group chat", icon: MessagesSquare, description: "Chat with classmates" },
  { href: "/ai", label: "AI roadmap", icon: Sparkles, description: "Summarise files into a learning path" },
];

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, description: "Profile, reminders and theme" },
];
