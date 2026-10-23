"use client";

import { BookOpen, MapPin, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SubjectsManager } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { minutesOfDay, weekdayIndex } from "@/lib/data/derive";
import { useMutations, useSubjects, useTimetable } from "@/lib/data/hooks";
import type { Subject, TimetableEntry } from "@/lib/data/types";
import { useLocalState } from "@/lib/use-local-state";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { EntryDialog, WEEKDAYS, type EntryDraft } from "./entry-dialog";

const HOUR_HEIGHT = 64;
const SNAP = 15;

const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const snap = (minutes: number) => Math.round(minutes / SNAP) * SNAP;

type Placed = TimetableEntry & { lane: number; lanes: number };

/** Puts overlapping classes side by side instead of on top of each other. */
function layoutDay(entries: TimetableEntry[]): Placed[] {
  const sorted = [...entries].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    cluster.forEach((p) => (p.lanes = lanes));
    cluster = [];
  };

  for (const entry of sorted) {
    const start = minutesOfDay(entry.startsAt);
    if (start >= clusterEnd) flush();
    const taken = new Set(
      cluster.filter((p) => minutesOfDay(p.endsAt) > start).map((p) => p.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane++;
    const item = { ...entry, lane, lanes: 1 };
    cluster.push(item);
    placed.push(item);
    clusterEnd = Math.max(clusterEnd, minutesOfDay(entry.endsAt));
  }
  flush();
  return placed;
}

type DragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  dayDelta: number;
  minuteDelta: number;
  moved: boolean;
};

export function TimetableView() {
  const timetable = useTimetable();
  const { data: subjects = [] } = useSubjects();
  const { update } = useMutations("timetable");
  const now = useNow();
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [showWeekend, setShowWeekend] = useLocalState("timetable-weekend", true);
  const [hours, setHours] = useLocalState("timetable-hours", { from: 8, to: 18 });
  const [mobileDay, setMobileDay] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s] as const)), [subjects]);
  const entries = useMemo(() => timetable.data ?? [], [timetable.data]);

  // Grow the visible range so no class is ever hidden outside it.
  const range = useMemo(() => {
    let from = hours.from;
    let to = hours.to;
    for (const e of entries) {
      from = Math.min(from, Math.floor(minutesOfDay(e.startsAt) / 60));
      to = Math.max(to, Math.ceil(minutesOfDay(e.endsAt) / 60));
    }
    return { from, to };
  }, [entries, hours]);

  const hasWeekendClasses = entries.some((e) => e.weekday >= 5);
  const dayCount = showWeekend || hasWeekendClasses ? 7 : 5;
  const days = Array.from({ length: dayCount }, (_, i) => i);
  const today = now ? weekdayIndex(now) : -1;
  const selectedDay = mobileDay ?? (today >= 0 && today < dayCount ? today : 0);

  useEffect(() => {
    // Opened from search with ?subject=..., highlight that subject's classes.
    const subject = new URLSearchParams(window.location.search).get("subject");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (subject) setHighlight(subject);
  }, []);

  function startDrag(e: ReactPointerEvent, entry: TimetableEntry, mode: DragState["mode"]) {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id: entry.id, mode, startX: e.clientX, startY: e.clientY, dayDelta: 0, minuteDelta: 0, moved: false });
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!drag || !gridRef.current) return;
    const columnWidth = gridRef.current.getBoundingClientRect().width / dayCount;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const moved = drag.moved || Math.abs(dx) > 4 || Math.abs(dy) > 4;
    setDrag({
      ...drag,
      moved,
      minuteDelta: snap((dy / HOUR_HEIGHT) * 60),
      dayDelta: drag.mode === "move" ? Math.round(dx / columnWidth) : 0,
    });
  }

  function endDrag() {
    if (!drag) return;
    const entry = entries.find((x) => x.id === drag.id);
    setDrag(null);
    if (!entry) return;
    if (!drag.moved) {
      setDraft(entry);
      return;
    }
    const patch = applyDrag(entry, drag, dayCount);
    if (patch.startsAt !== entry.startsAt || patch.endsAt !== entry.endsAt || patch.weekday !== entry.weekday) {
      update.mutate({ id: entry.id, patch });
    }
  }

  function addAt(weekday: number, e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = range.from * 60 + Math.floor(((e.clientY - rect.top) / HOUR_HEIGHT) * 2) * 30;
    setDraft({ weekday, startsAt: toHHMM(minutes) });
  }

  const hourOptions = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Click an empty slot to add a class. Drag a class to move it, or drag its bottom edge to resize.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
            <Select
              aria-label="Day starts at"
              value={hours.from}
              onChange={(e) => setHours({ ...hours, from: Math.min(Number(e.target.value), hours.to - 1) })}
              className="h-9 w-24"
            >
              {hourOptions.map((h) => (
                <option key={h} value={h}>
                  {toHHMM(h * 60)}
                </option>
              ))}
            </Select>
            to
            <Select
              aria-label="Day ends at"
              value={hours.to}
              onChange={(e) => setHours({ ...hours, to: Math.max(Number(e.target.value), hours.from + 1) })}
              className="h-9 w-24"
            >
              {hourOptions.slice(1).map((h) => (
                <option key={h} value={h}>
                  {toHHMM(h * 60)}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowWeekend(!showWeekend)}
            disabled={hasWeekendClasses}
            title={hasWeekendClasses ? "You have weekend classes" : undefined}
            className="hidden md:inline-flex"
          >
            {dayCount === 7 ? "Hide weekend" : "Show weekend"}
          </Button>
          <SubjectsManager
            trigger={
              <Button variant="outline">
                <BookOpen /> Subjects
              </Button>
            }
          />
          <Button onClick={() => setDraft({ weekday: selectedDay, startsAt: "09:00" })}>
            <Plus /> Add class
          </Button>
        </div>
      </div>

      {highlight && (
        <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          Showing {subjectById.get(highlight)?.name ?? "subject"}
          <button className="ml-auto cursor-pointer text-xs underline" onClick={() => setHighlight(null)}>
            Show all
          </button>
        </div>
      )}

      {timetable.isLoading ? (
        <Skeleton className="h-[600px]" />
      ) : (
        <>
          {/* Desktop and tablet: weekly grid */}
          <Card className="hidden overflow-hidden md:block">
            <div className="flex border-b" style={{ paddingLeft: 56 }}>
              {days.map((d) => (
                <div
                  key={d}
                  className={cn(
                    "flex-1 py-3 text-center text-sm font-medium",
                    d === today ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className={cn("rounded-full px-3 py-1", d === today && "bg-accent")}>
                    {WEEKDAYS[d].slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative flex select-none" onPointerMove={onPointerMove} onPointerUp={endDrag}>
              <div className="w-14 shrink-0">
                {Array.from({ length: range.to - range.from }, (_, i) => (
                  <div key={i} className="relative" style={{ height: HOUR_HEIGHT }}>
                    <span className="absolute -top-2 right-2 font-mono text-[11px] text-muted-foreground">
                      {i === 0 ? "" : toHHMM((range.from + i) * 60)}
                    </span>
                  </div>
                ))}
              </div>
              <div ref={gridRef} className="relative flex flex-1">
                {days.map((d) => (
                  <div
                    key={d}
                    className={cn("relative flex-1 border-l", d === today && "bg-accent/30")}
                    style={{ height: (range.to - range.from) * HOUR_HEIGHT }}
                    onPointerUp={(e) => {
                      if (!drag && e.target === e.currentTarget) addAt(d, e);
                    }}
                  >
                    {Array.from({ length: range.to - range.from }, (_, i) => (
                      <div
                        key={i}
                        className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/70"
                        style={{ top: i * HOUR_HEIGHT }}
                      />
                    ))}
                    {d === today && now && <NowLine now={now} from={range.from} to={range.to} />}
                    {layoutDay(entries.filter((e) => e.weekday === d)).map((entry) => {
                      const shown = drag?.id === entry.id ? { ...entry, ...applyDrag(entry, drag, dayCount) } : entry;
                      return (
                        <EntryBlock
                          key={entry.id}
                          entry={shown}
                          lane={entry.lane}
                          lanes={entry.lanes}
                          dayOffset={shown.weekday - d}
                          from={range.from}
                          subject={subjectById.get(entry.subjectId)}
                          dimmed={highlight !== null && entry.subjectId !== highlight}
                          dragging={drag?.id === entry.id && drag.moved}
                          onMoveStart={(e) => startDrag(e, entry, "move")}
                          onResizeStart={(e) => startDrag(e, entry, "resize")}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Phones: one day at a time */}
          <div className="space-y-4 md:hidden">
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
              {WEEKDAYS.map((name, d) => (
                <button
                  key={name}
                  onClick={() => setMobileDay(d)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition",
                    d === selectedDay ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                    d === today && d !== selectedDay && "text-primary",
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
            <ul className="space-y-2">
              {entries
                .filter((e) => e.weekday === selectedDay)
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                .map((entry) => {
                  const subject = subjectById.get(entry.subjectId);
                  return (
                    <li key={entry.id}>
                      <button
                        onClick={() => setDraft(entry)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-4 rounded-xl border bg-card p-4 text-left",
                          highlight && entry.subjectId !== highlight && "opacity-40",
                        )}
                      >
                        <div className="w-12 font-mono text-xs leading-5 text-muted-foreground">
                          <div className="font-medium text-foreground">{entry.startsAt}</div>
                          <div>{entry.endsAt}</div>
                        </div>
                        <span className="h-10 w-1 rounded-full" style={{ background: subject?.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{subject?.name}</div>
                          <div className="flex gap-3 text-xs capitalize text-muted-foreground">
                            {entry.kind}
                            {entry.room && (
                              <span className="flex items-center gap-1 normal-case">
                                <MapPin className="size-3" /> {entry.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              {entries.every((e) => e.weekday !== selectedDay) && (
                <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No classes on {WEEKDAYS[selectedDay]}.
                </li>
              )}
            </ul>
          </div>
        </>
      )}

      <EntryDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}

function applyDrag(entry: TimetableEntry, drag: DragState, dayCount: number) {
  const start = minutesOfDay(entry.startsAt);
  const end = minutesOfDay(entry.endsAt);
  if (drag.mode === "resize") {
    const newEnd = Math.min(24 * 60 - 5, Math.max(start + SNAP, end + drag.minuteDelta));
    return { weekday: entry.weekday, startsAt: entry.startsAt, endsAt: toHHMM(newEnd) };
  }
  const length = end - start;
  const newStart = Math.min(24 * 60 - length, Math.max(0, start + drag.minuteDelta));
  const weekday = Math.min(dayCount - 1, Math.max(0, entry.weekday + drag.dayDelta));
  return { weekday, startsAt: toHHMM(newStart), endsAt: toHHMM(newStart + length) };
}

function EntryBlock({
  entry,
  lane,
  lanes,
  dayOffset,
  from,
  subject,
  dimmed,
  dragging,
  onMoveStart,
  onResizeStart,
}: {
  entry: TimetableEntry;
  lane: number;
  lanes: number;
  dayOffset: number;
  from: number;
  subject?: Subject;
  dimmed: boolean;
  dragging: boolean;
  onMoveStart: (e: ReactPointerEvent) => void;
  onResizeStart: (e: ReactPointerEvent) => void;
}) {
  const start = minutesOfDay(entry.startsAt) - from * 60;
  const length = minutesOfDay(entry.endsAt) - minutesOfDay(entry.startsAt);
  const color = subject?.color ?? "#64748b";
  const compact = length < 50;

  return (
    <div
      onPointerDown={onMoveStart}
      className={cn(
        "group absolute cursor-grab overflow-hidden rounded-lg border-l-[3px] px-2 py-1.5 text-xs transition-[opacity,box-shadow] active:cursor-grabbing",
        dragging && "z-20 shadow-xl ring-2 ring-primary/40",
        dimmed && "opacity-30",
      )}
      style={{
        top: (start / 60) * HOUR_HEIGHT + 1,
        height: Math.max((length / 60) * HOUR_HEIGHT - 2, 18),
        left: `calc(${dayOffset * 100}% + ${(lane / lanes) * 100}% + 3px)`,
        width: `calc(${100 / lanes}% - 6px)`,
        borderColor: color,
        background: `color-mix(in oklab, ${color} 16%, var(--card))`,
      }}
    >
      <div className={cn("font-semibold", compact ? "truncate" : "line-clamp-2")} style={{ color: `color-mix(in oklab, ${color} 70%, var(--foreground))` }}>
        {subject?.name ?? "Class"}
      </div>
      {!compact && (
        <div className="mt-0.5 truncate text-muted-foreground">
          {entry.startsAt}–{entry.endsAt}
          {entry.room ? ` · ${entry.room}` : ""}
        </div>
      )}
      <div
        onPointerDown={onResizeStart}
        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
        aria-label="Resize"
      >
        <div className="mx-auto mt-0.5 h-1 w-6 rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

function NowLine({ now, from, to }: { now: Date; from: number; to: number }) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < from * 60 || minutes > to * 60) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top: ((minutes - from * 60) / 60) * HOUR_HEIGHT }}
    >
      <span className="-ml-1 size-2 rounded-full bg-danger" />
      <span className="h-0.5 flex-1 bg-danger" />
    </div>
  );
}
