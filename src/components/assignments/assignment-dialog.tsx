"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { SubjectSelect } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutations } from "@/lib/data/hooks";
import type { Assignment, AssignmentKind, AssignmentStatus } from "@/lib/data/types";

export const KIND_LABELS: Record<AssignmentKind, string> = {
  assignment: "Assignment",
  exam: "Exam",
  quiz: "Quiz",
  project: "Project",
};

export const STATUS_LABELS: Record<AssignmentStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS = { 1: "Low", 2: "Medium", 3: "High" } as const;

export type AssignmentDraft = Partial<Assignment>;

function tomorrowAt2359() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

export function AssignmentDialog({ draft, onClose }: { draft: AssignmentDraft | null; onClose: () => void }) {
  const { create, update, remove } = useMutations("assignments");
  const editing = Boolean(draft?.id);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    const form = new FormData(e.currentTarget);
    const values = {
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim() || null,
      subjectId: String(form.get("subjectId")) || null,
      kind: String(form.get("kind")) as AssignmentKind,
      dueAt: new Date(String(form.get("dueAt"))).toISOString(),
      priority: Number(form.get("priority")) as 1 | 2 | 3,
      status: String(form.get("status")) as AssignmentStatus,
    };
    if (draft.id) update.mutate({ id: draft.id, patch: values });
    else create.mutate(values);
    onClose();
  }

  const due = draft ? format(new Date(draft.dueAt ?? tomorrowAt2359()), "yyyy-MM-dd'T'HH:mm") : "";

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      {draft && (
        <DialogContent title={editing ? "Edit deadline" : "New deadline"}>
          <form key={draft.id ?? "new"} onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <Input name="title" defaultValue={draft.title} placeholder="e.g. Problem set 5" required autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select name="kind" defaultValue={draft.kind ?? "assignment"}>
                  {Object.entries(KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject">
                <SubjectSelect name="subjectId" value={draft.subjectId} allowNone />
              </Field>
            </div>
            <Field label="Due">
              <Input name="dueAt" type="datetime-local" defaultValue={due} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <Select name="priority" defaultValue={draft.priority ?? 2}>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue={draft.status ?? "todo"}>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Details">
              <Textarea name="description" defaultValue={draft.description ?? ""} placeholder="Optional notes, chapters, links..." />
            </Field>
            <div className="flex items-center gap-2 pt-2">
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => {
                    remove.mutate(draft.id!);
                    onClose();
                  }}
                >
                  <Trash2 /> Delete
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">{editing ? "Save" : "Add deadline"}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
