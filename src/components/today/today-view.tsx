"use client";

import { format } from "date-fns";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Check,
  Flame,
  GraduationCap,
  MapPin,
  NotebookPen,
  Pin,
  Timer,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  dayKey,
  minutesOfDay,
  minutesSince,
  startOfWeek,
  studyStreak,
  todaysClasses,
  upcomingAssignments,
} from "@/lib/data/derive";
import {
  useAssignments,
  useNotes,
  useProfile,
  useSetAssignmentStatus,
  useStudySessions,
  useSubjects,
  useTimetable,
} from "@/lib/data/hooks";
import type { Assignment, Subject } from "@/lib/data/types";
import { dueTone, formatDue, noteText } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/** Midnight two weeks ago: stable all day, so it makes a steady query key. */
function twoWeeksBefore(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 14);
  return d.toISOString();
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function TodayView() {
  const now = useNow();
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const timetable = useTimetable();
  const assignments = useAssignments();
  const notes = useNotes();
  const sessions = useStudySessions(now ? twoWeeksBefore(now) : null);

  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s] as const)),
    [subjects],
  );

  if (!now) return <TodaySkeleton />;

  const classes = todaysClasses(timetable.data ?? [], now);
  const week = upcomingAssignments(assignments.data ?? [], 24 * 7, now);
  const exams = week.filter((a) => a.kind === "exam" || a.kind === "quiz");
  const streak = studyStreak(sessions.data ?? [], now);
  const weekMinutes = minutesSince(sessions.data ?? [], startOfWeek(now));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextClass = classes.find((c) => minutesOfDay(c.startsAt) > nowMinutes);
  const firstName = profile?.fullName?.split(" ")[0];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{format(now, "EEEE, d MMMM")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting(now.getHours())}
            {firstName ? `, ${firstName}` : ""} 👋
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/assignments?new=1">
              <CalendarClock /> Add deadline
            </Link>
          </Button>
          <Button asChild>
            <Link href="/study">
              <Timer /> Start focus session
            </Link>
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CalendarDays />}
          tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
          label="Classes today"
          value={String(classes.length)}
          hint={
            nextClass
              ? `Next: ${subjectById.get(nextClass.subjectId)?.name ?? "Class"} at ${nextClass.startsAt}`
              : classes.length
                ? "Done for today"
                : "Free day"
          }
        />
        <StatCard
          icon={<GraduationCap />}
          tone="bg-amber-500/10 text-amber-600 dark:text-amber-300"
          label="Due this week"
          value={String(week.length)}
          hint={exams.length ? `${exams.length} exam${exams.length > 1 ? "s" : ""} or quizzes` : "No exams this week"}
        />
        <StatCard
          icon={<Flame />}
          tone="bg-rose-500/10 text-rose-600 dark:text-rose-300"
          label="Study streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
          hint={`${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m studied this week`}
        >
          <WeekBars sessions={sessions.data ?? []} now={now} />
        </StatCard>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <motion.div variants={item} className="min-w-0 lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Today&apos;s schedule</CardTitle>
              <Link href="/timetable" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Full timetable <ArrowRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {timetable.isLoading ? (
                <ListSkeleton />
              ) : classes.length === 0 ? (
                <Empty text="No classes today. Enjoy the free time or get ahead on a deadline." />
              ) : (
                <ol className="relative space-y-2">
                  {classes.map((c) => {
                    const subject = subjectById.get(c.subjectId);
                    const start = minutesOfDay(c.startsAt);
                    const end = minutesOfDay(c.endsAt);
                    const live = nowMinutes >= start && nowMinutes < end;
                    const past = nowMinutes >= end;
                    return (
                      <li
                        key={c.id}
                        className={cn(
                          "relative flex items-center gap-4 overflow-hidden rounded-lg border p-3 transition",
                          past && "opacity-55",
                          live && "border-primary/50 bg-accent/50",
                        )}
                      >
                        <div className="w-14 shrink-0 text-right font-mono text-xs leading-5 text-muted-foreground">
                          <div className="font-medium text-foreground">{c.startsAt}</div>
                          <div>{c.endsAt}</div>
                        </div>
                        <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: subject?.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{subject?.name ?? "Class"}</div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="capitalize">{c.kind}</span>
                            {c.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" /> {c.room}
                              </span>
                            )}
                          </div>
                        </div>
                        {live && (
                          <Badge className="bg-primary text-primary-foreground">
                            <span className="size-1.5 animate-pulse rounded-full bg-current" /> Now
                          </Badge>
                        )}
                        {live && (
                          <span
                            className="absolute bottom-0 left-0 h-0.5 bg-primary"
                            style={{ width: `${((nowMinutes - start) / (end - start)) * 100}%` }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="min-w-0 lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Upcoming deadlines</CardTitle>
              <Link href="/assignments" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                All <ArrowRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {assignments.isLoading ? (
                <ListSkeleton />
              ) : week.length === 0 ? (
                <Empty text="Nothing due in the next 7 days. 🎉" />
              ) : (
                <ul className="space-y-1">
                  {week.map((a) => (
                    <DeadlineRow key={a.id} assignment={a} subject={subjectById.get(a.subjectId ?? "")} now={now} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Recent notes</CardTitle>
            <Link href="/notes" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              All notes <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {notes.isLoading ? (
              <ListSkeleton />
            ) : (notes.data ?? []).length === 0 ? (
              <Empty text="No notes yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...(notes.data ?? [])]
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
                  .slice(0, 3)
                  .map((n) => {
                    const subject = subjectById.get(n.subjectId ?? "");
                    return (
                      <Link
                        key={n.id}
                        href={`/notes?focus=${n.id}`}
                        className="group rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <NotebookPen className="size-3.5" style={{ color: subject?.color }} />
                          {subject?.name ?? "General"}
                          {n.pinned && <Pin className="ml-auto size-3.5" />}
                        </div>
                        <div className="font-medium group-hover:text-primary">{n.title}</div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{noteText(n.content)}</p>
                      </Link>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  hint,
  children,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
  hint: string;
  children?: ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("flex size-10 items-center justify-center rounded-xl [&_svg]:size-5", tone)}>{icon}</div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xs text-muted-foreground">{hint}</p>
        {children}
      </div>
    </Card>
  );
}

/** Seven tiny bars, Monday to Sunday, for minutes studied this week. */
function WeekBars({ sessions, now }: { sessions: { startedAt: string; minutes: number }[]; now: Date }) {
  const monday = startOfWeek(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
  const totals = days.map((d) =>
    sessions.filter((s) => dayKey(new Date(s.startedAt)) === dayKey(d)).reduce((sum, s) => sum + s.minutes, 0),
  );
  const max = Math.max(60, ...totals);
  const todayIndex = days.findIndex((d) => dayKey(d) === dayKey(now));

  return (
    <div className="flex h-8 items-end gap-1" aria-hidden>
      {totals.map((t, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(8, (t / max) * 100)}%` }}
          transition={{ delay: 0.3 + i * 0.04, duration: 0.4 }}
          className={cn(
            "w-1.5 rounded-full",
            t > 0 ? "bg-rose-500" : "bg-muted",
            i === todayIndex && "ring-2 ring-rose-500/30",
          )}
        />
      ))}
    </div>
  );
}

function DeadlineRow({ assignment: a, subject, now }: { assignment: Assignment; subject?: Subject; now: Date }) {
  const setStatus = useSetAssignmentStatus();
  const done = a.status === "done";
  const tone = dueTone(a.dueAt, now);

  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted">
      <button
        onClick={() => setStatus.mutate({ id: a.id, status: done ? "todo" : "done" })}
        className={cn(
          "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition",
          done ? "border-success bg-success text-white" : "border-muted-foreground/40 hover:border-success",
        )}
        aria-label={done ? "Mark as not done" : "Mark as done"}
      >
        {done && <Check className="size-3" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
          {a.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full" style={{ background: subject?.color }} />
          {subject?.name ?? "General"}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {(a.kind === "exam" || a.kind === "quiz") && (
          <Badge className="bg-amber-500/15 capitalize text-amber-700 dark:text-amber-300">{a.kind}</Badge>
        )}
        <span
          className={cn(
            "whitespace-nowrap text-xs",
            tone === "danger" && "text-danger",
            tone === "warning" && "font-medium text-warning",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {formatDue(a.dueAt, now)}
        </span>
      </div>
    </li>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-72" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-3" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
    </div>
  );
}
