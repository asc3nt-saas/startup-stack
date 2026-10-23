"use client";

import { format } from "date-fns";
import { Coffee, Flag, Flame, Pause, Play, RotateCcw, SkipForward, Timer } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { SubjectSelect } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { dayKey, startOfWeek, studyStreak } from "@/lib/data/derive";
import { useStudySessions, useSubjects } from "@/lib/data/hooks";
import type { StudySession } from "@/lib/data/types";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { FlipClock } from "./flip-clock";
import { PRESETS, useTimer } from "./timer-provider";

function fourWeeksBefore(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 28);
  return d.toISOString();
}

export function StudyView() {
  const timer = useTimer();
  const now = useNow();
  const sessions = useStudySessions(now ? fourWeeksBefore(now) : null);
  const { data: subjects = [] } = useSubjects();
  const [custom, setCustom] = useState({ focus: 30, rest: 5 });

  const focusing = timer.phase === "focus";
  const progress = 1 - timer.remaining / timer.phaseMs;
  const subject = subjects.find((s) => s.id === timer.subjectId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Card className="relative overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-60 transition-colors duration-700",
            focusing
              ? "bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_60%)]"
              : "bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--success)_20%,transparent),transparent_60%)]",
          )}
        />
        <div className="relative flex flex-col items-center gap-8 px-4 py-10 sm:py-14">
          <div className="flex flex-wrap justify-center gap-1.5">
            {PRESETS.map((p) => (
              <PresetChip
                key={p.id}
                active={timer.preset.id === p.id}
                disabled={timer.status === "running"}
                onClick={() => timer.setPreset(p)}
              >
                {p.label} <span className="opacity-60">{p.focus}/{p.rest}</span>
              </PresetChip>
            ))}
            <PresetChip
              active={timer.preset.id === "custom"}
              disabled={timer.status === "running"}
              onClick={() => timer.setPreset({ id: "custom", label: "Custom", ...custom })}
            >
              Custom
            </PresetChip>
          </div>

          {timer.preset.id === "custom" && timer.status === "idle" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Input
                type="number"
                min={1}
                max={180}
                value={custom.focus}
                onChange={(e) => {
                  const next = { ...custom, focus: Math.max(1, Math.min(180, Number(e.target.value) || 1)) };
                  setCustom(next);
                  timer.setPreset({ id: "custom", label: "Custom", ...next });
                }}
                className="h-8 w-16 text-right"
                aria-label="Focus minutes"
              />
              min focus,
              <Input
                type="number"
                min={1}
                max={60}
                value={custom.rest}
                onChange={(e) => {
                  const next = { ...custom, rest: Math.max(1, Math.min(60, Number(e.target.value) || 1)) };
                  setCustom(next);
                  timer.setPreset({ id: "custom", label: "Custom", ...next });
                }}
                className="h-8 w-16 text-right"
                aria-label="Break minutes"
              />
              min break
            </div>
          )}

          <motion.div
            key={timer.phase}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium",
              focusing ? "bg-accent text-accent-foreground" : "bg-success/15 text-success",
            )}
          >
            {focusing ? <Timer className="size-4" /> : <Coffee className="size-4" />}
            {focusing ? (subject ? `Focusing on ${subject.name}` : "Focus time") : "Break time"}
          </motion.div>

          <FlipClock ms={timer.remaining} />

          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-[width] duration-300", focusing ? "bg-primary" : "bg-success")}
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {timer.status === "running" ? (
              <Button size="lg" variant="secondary" onClick={timer.pause} className="min-w-36">
                <Pause /> Pause
              </Button>
            ) : (
              <Button size="lg" onClick={timer.start} className="min-w-36">
                <Play /> {timer.status === "paused" ? "Resume" : focusing ? "Start focus" : "Start break"}
              </Button>
            )}
            {focusing && timer.status !== "idle" && (
              <Button size="lg" variant="outline" onClick={timer.finishEarly}>
                <Flag /> Finish
              </Button>
            )}
            {!focusing && (
              <Button size="lg" variant="outline" onClick={timer.skipRest}>
                <SkipForward /> Skip break
              </Button>
            )}
            <Button size="lg" variant="ghost" onClick={timer.reset} aria-label="Reset">
              <RotateCcw />
            </Button>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-1.5">
            <span className="text-center text-xs text-muted-foreground">Studying for</span>
            <SubjectSelect value={timer.subjectId} onChange={timer.setSubject} allowNone noneLabel="No particular subject" />
          </div>

          {timer.rounds > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${timer.rounds} rounds done`}>
              {Array.from({ length: Math.max(4, timer.rounds) }, (_, i) => (
                <span key={i} className={cn("size-2.5 rounded-full", i < timer.rounds ? "bg-primary" : "bg-muted")} />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                {timer.rounds} {timer.rounds === 1 ? "round" : "rounds"} today
              </span>
            </div>
          )}
        </div>
      </Card>

      <StudyStats sessions={sessions.data ?? []} now={now} />
    </div>
  );
}

function PresetChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function StudyStats({ sessions, now }: { sessions: StudySession[]; now: Date | null }) {
  const { data: subjects = [] } = useSubjects();

  const stats = useMemo(() => {
    if (!now) return null;
    const today = dayKey(now);
    const todays = sessions.filter((s) => dayKey(new Date(s.startedAt)) === today);
    const monday = startOfWeek(now);
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const minutes = sessions
        .filter((s) => dayKey(new Date(s.startedAt)) === dayKey(d))
        .reduce((sum, s) => sum + s.minutes, 0);
      return { label: format(d, "EEEEE"), minutes, isToday: dayKey(d) === today };
    });
    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
    return {
      todays,
      todayMinutes: todays.reduce((sum, s) => sum + s.minutes, 0),
      week,
      weekMinutes: week.reduce((sum, d) => sum + d.minutes, 0),
      streak: studyStreak(sessions, now),
      // 1 XP per minute; every level needs 60 more XP than the last.
      xp: totalMinutes,
    };
  }, [sessions, now]);

  if (!stats) return <div />;

  let level = 1;
  let need = 60;
  let xp = stats.xp;
  while (xp >= need) {
    xp -= need;
    level++;
    need += 60;
  }
  const max = Math.max(60, ...stats.week.map((d) => d.minutes));
  const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="mt-1 text-2xl font-semibold">{fmt(stats.todayMinutes)}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-rose-500" /> Streak
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {stats.streak} {stats.streak === 1 ? "day" : "days"}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold">Level {level}</p>
          <p className="text-xs text-muted-foreground">
            {xp}/{need} XP
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${(xp / need) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Earn 1 XP for every minute of focus.</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <span className="text-xs text-muted-foreground">{fmt(stats.weekMinutes)}</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            {stats.week.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-24 w-full items-end">
                  <motion.div
                    className={cn("w-full rounded-md", d.minutes ? "bg-primary" : "bg-muted", d.isToday && "ring-2 ring-primary/30")}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(4, (d.minutes / max) * 100)}%` }}
                    transition={{ delay: i * 0.04 }}
                    title={`${d.minutes} min`}
                  />
                </div>
                <span className={cn("text-[11px]", d.isToday ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.todays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet today. Start one!</p>
          ) : (
            <ul className="space-y-2">
              {stats.todays.map((s) => {
                const subject = subjects.find((x) => x.id === s.subjectId);
                return (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="size-2 rounded-full" style={{ background: subject?.color ?? "var(--muted-foreground)" }} />
                    <span className="flex-1 truncate">{subject?.name ?? "General"}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(s.startedAt), "HH:mm")}</span>
                    <span className="w-12 text-right font-medium tabular-nums">{s.minutes}m</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
