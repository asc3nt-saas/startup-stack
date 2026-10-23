"use client";

import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutations, useSubjects } from "@/lib/data/hooks";
import type { Subject } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const SUBJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#f59e0b", "#10b981", "#14b8a6", "#0ea5e9", "#64748b",
];

function SubjectForm({ subject, onDone }: { subject?: Subject; onDone: () => void }) {
  const { create, update } = useMutations("subjects");
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = {
      name: String(form.get("name")).trim(),
      teacher: String(form.get("teacher")).trim() || null,
      room: String(form.get("room")).trim() || null,
      color,
    };
    if (subject) update.mutate({ id: subject.id, patch: values });
    else create.mutate(values);
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name">
        <Input name="name" defaultValue={subject?.name} placeholder="e.g. Calculus" required autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Teacher">
          <Input name="teacher" defaultValue={subject?.teacher ?? ""} placeholder="Optional" />
        </Field>
        <Field label="Room">
          <Input name="room" defaultValue={subject?.room ?? ""} placeholder="Optional" />
        </Field>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground">Colour</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-white transition hover:scale-110"
              style={{ background: c }}
              aria-label={`Colour ${c}`}
            >
              {color === c && <Check className="size-4" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{subject ? "Save" : "Add subject"}</Button>
      </div>
    </form>
  );
}

/** Lists subjects with inline add, edit and delete. */
export function SubjectsManager({ trigger }: { trigger: React.ReactNode }) {
  const { data: subjects = [] } = useSubjects();
  const { remove } = useMutations("subjects");
  const [editing, setEditing] = useState<Subject | "new" | null>(null);

  return (
    <Dialog onOpenChange={(open) => !open && setEditing(null)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={editing === "new" ? "New subject" : editing ? `Edit ${editing.name}` : "Subjects"}
        description={editing ? undefined : "Subjects colour-code your timetable, deadlines, notes and grades."}
      >
        {editing ? (
          <SubjectForm subject={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        ) : (
          <div className="space-y-3">
            <ul className="divide-y rounded-lg border">
              {subjects.length === 0 && (
                <li className="p-4 text-center text-sm text-muted-foreground">No subjects yet.</li>
              )}
              {subjects.map((s) => (
                <li key={s.id} className="flex items-center gap-3 p-3">
                  <span className="size-3 rounded-full" style={{ background: s.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[s.teacher, s.room].filter(Boolean).join(" · ") || "No details"}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete ${s.name}? Its classes and grades are deleted too.`)) remove.mutate(s.id);
                    }}
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="outline" onClick={() => setEditing("new")}>
              <Plus /> Add subject
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SubjectSelect({
  value,
  onChange,
  allowNone = false,
  noneLabel = "No subject",
  name,
  required,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
  allowNone?: boolean;
  /** Label for the empty option, e.g. "All subjects" when used as a filter. */
  noneLabel?: string;
  name?: string;
  required?: boolean;
}) {
  const { data: subjects = [] } = useSubjects();
  return (
    <Select
      name={name}
      required={required}
      value={onChange ? (value ?? "") : undefined}
      defaultValue={onChange ? undefined : (value ?? "")}
      onChange={onChange ? (e) => onChange(e.target.value || null) : undefined}
    >
      {(allowNone || !value) && <option value="">{allowNone ? noneLabel : "Choose a subject"}</option>}
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </Select>
  );
}

export function SubjectDot({ subject, className }: { subject?: Subject; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ background: subject?.color ?? "var(--muted-foreground)" }}
    />
  );
}
