"use client";

import { BookOpen, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { SubjectsManager } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrades, useMutations, useSubjects } from "@/lib/data/hooks";
import type { GradeItem, Subject } from "@/lib/data/types";
import {
  gradeTone,
  itemPercent,
  letterGrade,
  neededForTarget,
  weightTotals,
  weightedAverage,
} from "@/lib/grades";
import { useLocalState } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";

const fmt = (n: number | null, digits = 1) => (n === null ? "–" : n.toFixed(digits));

export function GradesView() {
  const grades = useGrades();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const [tab, setTab] = useState<string>("overview");

  const bySubject = useMemo(() => {
    const map = new Map<string, GradeItem[]>();
    for (const g of grades.data ?? []) map.set(g.subjectId, [...(map.get(g.subjectId) ?? []), g]);
    return map;
  }, [grades.data]);

  const averages = subjects
    .map((s) => ({ subject: s, average: weightedAverage(bySubject.get(s.id) ?? []) }))
    .filter((x): x is { subject: Subject; average: number } => x.average !== null);
  const overall = averages.length ? averages.reduce((sum, x) => sum + x.average, 0) / averages.length : null;
  const gpa = averages.length ? averages.reduce((sum, x) => sum + letterGrade(x.average).gpa, 0) / averages.length : null;
  const best = [...averages].sort((a, b) => b.average - a.average)[0];
  const current = subjects.find((s) => s.id === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter scores like a spreadsheet. Averages are weighted and update instantly.
          </p>
        </div>
        <SubjectsManager
          trigger={
            <Button variant="outline">
              <BookOpen /> Subjects
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Overall average" value={overall === null ? "–" : `${fmt(overall)}%`} tone={gradeTone(overall)} />
        <SummaryCard label="GPA (4.0 scale)" value={fmt(gpa, 2)} />
        <SummaryCard label="Letter grade" value={overall === null ? "–" : letterGrade(overall).letter} />
        <SummaryCard label="Strongest subject" value={best?.subject.name ?? "–"} small />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabButton>
        {subjects.map((s) => (
          <TabButton key={s.id} active={tab === s.id} onClick={() => setTab(s.id)}>
            <span
              className={cn("size-2 rounded-full", tab === s.id && "ring-2 ring-primary-foreground")}
              style={{ background: s.color }}
            />
            {s.name}
          </TabButton>
        ))}
      </div>

      {grades.isLoading || subjectsLoading ? (
        <Skeleton className="h-96" />
      ) : subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Add your subjects first, then track grades for each one.
        </div>
      ) : current ? (
        <SubjectSheet key={current.id} subject={current} items={bySubject.get(current.id) ?? []} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, i) => (
            <SubjectCard key={s.id} subject={s} items={bySubject.get(s.id) ?? []} index={i} onOpen={() => setTab(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone, small }: { label: string; value: string; tone?: string; small?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate font-semibold tracking-tight", small ? "text-lg" : "text-2xl", tone)}>{value}</p>
    </Card>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function SubjectCard({
  subject,
  items,
  index,
  onOpen,
}: {
  subject: Subject;
  items: GradeItem[];
  index: number;
  onOpen: () => void;
}) {
  const average = weightedAverage(items);
  const { total, graded } = weightTotals(items);
  // Weights are percentages of the course, so measure against 100 even before every item is entered.
  const progress = (graded / Math.max(total, 100)) * 100;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onOpen}
      className="cursor-pointer rounded-xl border bg-card p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="size-2.5 rounded-full" style={{ background: subject.color }} />
        {subject.name}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className={cn("text-3xl font-semibold tracking-tight", gradeTone(average))}>
            {average === null ? "–" : `${fmt(average)}%`}
          </span>
          {average !== null && (
            <span className="ml-2 text-sm text-muted-foreground">{letterGrade(average).letter}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ background: subject.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, delay: 0.2 + index * 0.05 }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{fmt(progress, 0)}% of the course graded</p>
    </motion.button>
  );
}

type Column = {
  key: "name" | "category" | "score" | "maxScore" | "weight" | "gradedOn";
  label: string;
  type: "text" | "number" | "date";
  className: string;
};

const COLUMNS: Column[] = [
  { key: "name", label: "Item", type: "text", className: "min-w-44" },
  { key: "category", label: "Category", type: "text", className: "min-w-28" },
  { key: "score", label: "Score", type: "number", className: "w-24" },
  { key: "maxScore", label: "Out of", type: "number", className: "w-24" },
  { key: "weight", label: "Weight %", type: "number", className: "w-24" },
  { key: "gradedOn", label: "Date", type: "date", className: "w-40" },
];

function parseCell(column: Column, raw: string): GradeItem[Column["key"]] {
  const value = raw.trim();
  if (column.type === "number") {
    if (value === "") return column.key === "score" ? null : 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (column.key === "name") return value || "Untitled";
  return value || null;
}

/** Enter moves down a row, like a spreadsheet. */
function onCellKeyDown(e: KeyboardEvent<HTMLInputElement>, row: number, col: number) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const next = document.querySelector<HTMLInputElement>(`[data-cell="${row + (e.shiftKey ? -1 : 1)}-${col}"]`);
  if (next) next.focus();
  else e.currentTarget.blur();
}

function SubjectSheet({ subject, items }: { subject: Subject; items: GradeItem[] }) {
  const { create, update, remove } = useMutations("grades");
  const [target, setTarget] = useLocalState(`grade-target-${subject.id}`, 90);
  const average = weightedAverage(items);
  const totals = weightTotals(items);
  const needed = neededForTarget(items, target);

  function addRow() {
    create.mutate({
      subjectId: subject.id,
      name: `Item ${items.length + 1}`,
      category: null,
      score: null,
      maxScore: 100,
      weight: 10,
      gradedOn: null,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="w-8 px-3 py-2.5 font-medium">#</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={cn("px-1 py-2.5 font-medium", c.className)}>
                    <span className="px-2">{c.label}</span>
                  </th>
                ))}
                <th className="w-20 px-3 py-2.5 text-right font-medium">%</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, row) => {
                const pct = itemPercent(item);
                return (
                  <tr key={item.id} className="group border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 font-mono text-xs text-muted-foreground">{row + 1}</td>
                    {COLUMNS.map((column, col) => (
                      <td key={column.key} className="px-1 py-0.5">
                        <input
                          key={`${item.id}-${String(item[column.key])}`}
                          data-cell={`${row}-${col}`}
                          type={column.type}
                          step="any"
                          defaultValue={item[column.key] ?? ""}
                          placeholder={column.key === "score" ? "–" : undefined}
                          onKeyDown={(e) => onCellKeyDown(e, row, col)}
                          onBlur={(e) => {
                            const value = parseCell(column, e.target.value);
                            if (value !== item[column.key]) update.mutate({ id: item.id, patch: { [column.key]: value } });
                          }}
                          className={cn(
                            "h-9 w-full rounded-md bg-transparent px-2 outline-none transition focus:bg-card focus:ring-2 focus:ring-ring",
                            column.type === "number" && "text-right tabular-nums",
                          )}
                        />
                      </td>
                    ))}
                    <td className={cn("px-3 text-right font-medium tabular-nums", gradeTone(pct))}>{fmt(pct)}</td>
                    <td className="pr-2">
                      <button
                        onClick={() => remove.mutate(item.id)}
                        className="cursor-pointer rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-danger group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30 text-sm">
                <td />
                <td colSpan={4} className="px-3 py-3">
                  <Button variant="ghost" size="sm" onClick={addRow}>
                    <Plus /> Add row
                  </Button>
                </td>
                <td className={cn("px-3 text-right text-xs tabular-nums", totals.total !== 100 ? "text-warning" : "text-muted-foreground")}>
                  {fmt(totals.total, 0)}%
                  {totals.total !== 100 && <div className="text-[10px]">should total 100</div>}
                </td>
                <td />
                <td className={cn("px-3 text-right font-semibold tabular-nums", gradeTone(average))}>{fmt(average)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" /> Current standing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className={cn("text-4xl font-semibold tracking-tight", gradeTone(average))}>
                {average === null ? "–" : `${fmt(average)}%`}
              </span>
              {average !== null && <span className="pb-1 text-muted-foreground">{letterGrade(average).letter}</span>}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Based on {fmt(totals.graded, 0)}% of the course graded so far.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" /> What do I need?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              I want to finish with
              <Input
                type="number"
                min={0}
                max={100}
                value={target}
                onChange={(e) => setTarget(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="h-8 w-20 text-right"
              />
              %
            </label>
            <NeededMessage needed={needed} remaining={totals.remaining} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NeededMessage({ needed, remaining }: { needed: number | null; remaining: number }) {
  if (needed === null) {
    return <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Everything is graded already.</p>;
  }
  if (needed > 100) {
    return (
      <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
        You would need {fmt(needed)}% on the remaining {fmt(remaining, 0)}% of the course, which isn&apos;t possible.
        Try a lower target.
      </p>
    );
  }
  if (needed <= 0) {
    return (
      <p className="rounded-lg bg-success/10 p-3 text-sm text-success">
        You&apos;ve already secured it, even with zero on what&apos;s left. 🎉
      </p>
    );
  }
  return (
    <p className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
      You need an average of <strong>{fmt(needed)}%</strong> on the remaining {fmt(remaining, 0)}% of the course.
    </p>
  );
}
