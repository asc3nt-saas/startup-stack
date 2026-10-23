"use client";

import { differenceInCalendarDays } from "date-fns";
import { Check, Flag, Kanban, List, Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { SubjectSelect } from "@/components/subjects/subject-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignments, useMutations, useSetAssignmentStatus, useSubjects } from "@/lib/data/hooks";
import type { Assignment, AssignmentKind, AssignmentStatus, Subject } from "@/lib/data/types";
import { dueTone, formatDueFor } from "@/lib/format";
import { useLocalState } from "@/lib/use-local-state";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { AssignmentDialog, KIND_LABELS, STATUS_LABELS, type AssignmentDraft } from "./assignment-dialog";

const KIND_FILTERS: (AssignmentKind | "all")[] = ["all", "assignment", "exam", "quiz", "project"];
const STATUSES: AssignmentStatus[] = ["todo", "in_progress", "done"];

function groupOf(a: Assignment, now: Date) {
  if (a.status === "done") return "Completed";
  const due = new Date(a.dueAt);
  if (due < now) return "Overdue";
  const days = differenceInCalendarDays(due, now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return "This week";
  return "Later";
}

const GROUP_ORDER = ["Overdue", "Today", "Tomorrow", "This week", "Later", "Completed"];

export function AssignmentsView() {
  const assignments = useAssignments();
  const { data: subjects = [] } = useSubjects();
  const now = useNow();
  const [view, setView] = useLocalState<"list" | "board">("assignments-view", "list");
  const [draft, setDraft] = useState<AssignmentDraft | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<AssignmentKind | "all">("all");

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s] as const)), [subjects]);
  const all = useMemo(() => assignments.data ?? [], [assignments.data]);

  // Deep links: ?focus=<id> opens that item, ?new=1 opens a blank form.
  useEffect(() => {
    if (!assignments.data) return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    const found = focus && assignments.data.find((a) => a.id === focus);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (found) setDraft(found);
    else if (params.get("new")) setDraft({});
    if (focus || params.get("new")) window.history.replaceState(null, "", "/assignments");
  }, [assignments.data]);

  const filtered = all
    .filter((a) => kindFilter === "all" || a.kind === kindFilter)
    .filter((a) => !subjectFilter || a.subjectId === subjectFilter)
    .filter((a) => !query || a.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const open = all.filter((a) => a.status !== "done");
  const overdue = now ? open.filter((a) => new Date(a.dueAt) < now).length : 0;
  const thisWeek = now
    ? open.filter((a) => {
        const d = new Date(a.dueAt);
        return d >= now && differenceInCalendarDays(d, now) < 7;
      }).length
    : 0;
  const exams = open.filter((a) => a.kind === "exam" || a.kind === "quiz").length;
  const completion = all.length ? Math.round(((all.length - open.length) / all.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assignments and exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every deadline in one place.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border bg-card p-0.5">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-sm capitalize transition",
                  view === v ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {v === "list" ? <List className="size-4" /> : <Kanban className="size-4" />} {v}
              </button>
            ))}
          </div>
          <Button onClick={() => setDraft({})}>
            <Plus /> New deadline
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Overdue" value={overdue} tone={overdue ? "text-danger" : undefined} />
        <Stat label="Due in 7 days" value={thisWeek} />
        <Stat label="Exams and quizzes ahead" value={exams} />
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="mt-1 text-2xl font-semibold">{completion}%</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-success"
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="h-9 pl-9" />
        </div>
        <div className="w-full sm:w-48 [&_select]:h-9">
          <SubjectSelect value={subjectFilter} onChange={setSubjectFilter} allowNone noneLabel="All subjects" />
        </div>
        <div className="flex flex-wrap gap-1">
          {KIND_FILTERS.map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition",
                kindFilter === k ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {k === "all" ? "All" : `${KIND_LABELS[k]}s`}
            </button>
          ))}
        </div>
      </div>

      {assignments.isLoading || !now ? (
        <Skeleton className="h-96" />
      ) : view === "list" ? (
        <ListView items={filtered} now={now} subjectById={subjectById} onOpen={setDraft} />
      ) : (
        <BoardView items={filtered} now={now} subjectById={subjectById} onOpen={setDraft} />
      )}

      <AssignmentDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", tone)}>{value}</p>
    </Card>
  );
}

type ViewProps = {
  items: Assignment[];
  now: Date;
  subjectById: Map<string, Subject>;
  onOpen: (a: Assignment) => void;
};

function ListView({ items, now, subjectById, onOpen }: ViewProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        Nothing here. Add a deadline to get started.
      </div>
    );
  }
  const groups = GROUP_ORDER.map((name) => ({
    name,
    items: items.filter((a) => groupOf(a, now) === name),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.name}>
          <h2
            className={cn(
              "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              group.name === "Overdue" && "text-danger",
            )}
          >
            {group.name} <span className="font-normal">{group.items.length}</span>
          </h2>
          <Card className="divide-y overflow-hidden">
            <AnimatePresence initial={false}>
              {(group.name === "Completed" ? [...group.items].reverse() : group.items).map((a) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AssignmentRow assignment={a} subject={subjectById.get(a.subjectId ?? "")} now={now} onOpen={onOpen} />
                </motion.div>
              ))}
            </AnimatePresence>
          </Card>
        </section>
      ))}
    </div>
  );
}

function CheckButton({ assignment: a }: { assignment: Assignment }) {
  const setStatus = useSetAssignmentStatus();
  const done = a.status === "done";
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setStatus.mutate({ id: a.id, status: done ? "todo" : "done" });
      }}
      className={cn(
        "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition",
        done ? "border-success bg-success text-white" : "border-muted-foreground/40 hover:border-success",
      )}
      aria-label={done ? "Mark as not done" : "Mark as done"}
    >
      {done && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

function KindBadge({ kind }: { kind: AssignmentKind }) {
  if (kind === "assignment") return null;
  return (
    <Badge
      className={cn(
        kind === "exam" && "bg-rose-500/15 text-rose-700 dark:text-rose-300",
        kind === "quiz" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        kind === "project" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
      )}
    >
      {KIND_LABELS[kind]}
    </Badge>
  );
}

function AssignmentRow({
  assignment: a,
  subject,
  now,
  onOpen,
}: {
  assignment: Assignment;
  subject?: Subject;
  now: Date;
  onOpen: (a: Assignment) => void;
}) {
  const done = a.status === "done";
  const tone = dueTone(a.dueAt, now);
  return (
    <div
      onClick={() => onOpen(a)}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
    >
      <CheckButton assignment={a} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
            {a.title}
          </span>
          <KindBadge kind={a.kind} />
          {a.status === "in_progress" && <Badge>In progress</Badge>}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full" style={{ background: subject?.color ?? "var(--muted-foreground)" }} />
          {subject?.name ?? "General"}
        </div>
      </div>
      {a.priority === 3 && !done && <Flag className="size-4 shrink-0 text-danger" aria-label="High priority" />}
      <span
        className={cn(
          "hidden whitespace-nowrap text-xs sm:block",
          done ? "text-muted-foreground" : tone === "danger" ? "text-danger" : tone === "warning" ? "font-medium text-warning" : "text-muted-foreground",
        )}
      >
        {formatDueFor(a, now)}
      </span>
    </div>
  );
}

function BoardView({ items, now, subjectById, onOpen }: ViewProps) {
  const { update } = useMutations("assignments");
  const [over, setOver] = useState<AssignmentStatus | null>(null);

  function onDrop(e: DragEvent, status: AssignmentStatus) {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const item = items.find((a) => a.id === id);
    if (item && item.status !== status) update.mutate({ id, patch: { status } });
  }

  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
      {STATUSES.map((status) => {
        const column = items.filter((a) => a.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => onDrop(e, status)}
            className={cn(
              "flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-muted/60 p-3 transition sm:w-auto",
              over === status && "bg-accent ring-2 ring-primary/40",
            )}
          >
            <div className="flex items-center justify-between px-1 pb-1 text-sm font-semibold">
              {STATUS_LABELS[status]}
              <span className="text-xs font-normal text-muted-foreground">{column.length}</span>
            </div>
            {column.map((a) => {
              const subject = subjectById.get(a.subjectId ?? "");
              const tone = dueTone(a.dueAt, now);
              return (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                  onClick={() => onOpen(a)}
                  className="cursor-grab rounded-lg border bg-card p-3 shadow-xs transition hover:shadow-md active:cursor-grabbing"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: subject?.color ?? "var(--muted-foreground)" }} />
                    <span className={cn("flex-1 text-sm font-medium", a.status === "done" && "text-muted-foreground line-through")}>
                      {a.title}
                    </span>
                    {a.priority === 3 && a.status !== "done" && <Flag className="size-3.5 text-danger" />}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">{subject?.name ?? "General"}</span>
                    <KindBadge kind={a.kind} />
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-xs",
                      a.status === "done" ? "text-muted-foreground" : tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-muted-foreground",
                    )}
                  >
                    {formatDueFor(a, now)}
                  </div>
                </div>
              );
            })}
            {column.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                Drop here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
