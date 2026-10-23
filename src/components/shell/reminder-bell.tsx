"use client";

import { Bell, BellRing } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { upcomingAssignments } from "@/lib/data/derive";
import { useAssignments, useProfile, useSubjects } from "@/lib/data/hooks";
import { dueTone, formatDue } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const NOTIFIED_KEY = "studyhub-notified";

function readNotified(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Lists open assignments and exams due within the student's reminder window
 * and, once allowed, sends one browser notification per item per day.
 */
export function ReminderBell() {
  const { data: assignments = [] } = useAssignments();
  const { data: subjects = [] } = useSubjects();
  const { data: profile } = useProfile();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const now = useNow();

  const due = useMemo(
    () => (now ? upcomingAssignments(assignments, profile?.reminderHours ?? 24, now) : []),
    [assignments, profile?.reminderHours, now],
  );

  useEffect(() => {
    // Reading browser-only state once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    if (permission !== "granted" || due.length === 0) return;
    const today = new Date().toDateString();
    const notified = readNotified();
    for (const a of due) {
      if (notified[a.id] === today) continue;
      new Notification(a.kind === "exam" ? `Exam: ${a.title}` : a.title, {
        body: formatDue(a.dueAt),
        icon: "/icon.svg",
        tag: a.id,
      });
      notified[a.id] = today;
    }
    try {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
    } catch {}
  }, [permission, due]);

  async function enableNotifications() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") toast.success("Reminders turned on");
    else toast.error("Notifications are blocked in your browser settings");
  }

  const subject = (id: string | null) => subjects.find((s) => s.id === id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Reminders (${due.length})`}>
          {due.length > 0 ? <BellRing /> : <Bell />}
          {due.length > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
              {due.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          Due in the next {profile?.reminderHours ?? 24} hours
        </DropdownMenuLabel>
        {due.length === 0 && (
          <p className="px-2 pb-3 pt-1 text-sm text-muted-foreground">You&apos;re all caught up.</p>
        )}
        {due.map((a) => (
          <DropdownMenuItem key={a.id} asChild>
            <Link href={`/assignments?focus=${a.id}`} className="items-start">
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full"
                style={{ background: subject(a.subjectId)?.color ?? "var(--muted-foreground)" }}
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{a.title}</span>
                <span
                  className={cn(
                    "text-xs",
                    dueTone(a.dueAt, now ?? undefined) === "danger" ? "text-danger" : "text-muted-foreground",
                  )}
                >
                  {formatDue(a.dueAt, now ?? undefined)}
                </span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        {permission === "default" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={enableNotifications} className="text-primary">
              <BellRing className="!text-primary" /> Turn on browser reminders
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
