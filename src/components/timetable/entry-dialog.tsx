"use client";

import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SubjectsManager, SubjectSelect } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutations, useSubjects } from "@/lib/data/hooks";
import type { TimetableEntry } from "@/lib/data/types";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const KINDS = ["lecture", "seminar", "lab", "tutorial", "practice", "other"];

export type EntryDraft = Partial<TimetableEntry> & { weekday: number; startsAt: string };

export function EntryDialog({
  draft,
  onClose,
}: {
  /** An existing entry (has id) or a new one with weekday and start time prefilled. */
  draft: EntryDraft | null;
  onClose: () => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const { create, update, remove } = useMutations("timetable");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const editing = Boolean(draft?.id);
  const chosenSubject = subjectId ?? draft?.subjectId ?? null;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    const form = new FormData(e.currentTarget);
    const startsAt = String(form.get("startsAt"));
    const endsAt = String(form.get("endsAt"));
    if (endsAt <= startsAt) {
      toast.error("The class must end after it starts");
      return;
    }
    const values = {
      subjectId: String(form.get("subjectId")),
      weekday: Number(form.get("weekday")),
      startsAt,
      endsAt,
      kind: String(form.get("kind")),
      room: String(form.get("room")).trim() || null,
    };
    if (draft.id) update.mutate({ id: draft.id, patch: values });
    else create.mutate(values);
    onClose();
  }

  const defaultEnd = () => {
    if (draft?.endsAt) return draft.endsAt;
    const [h, m] = (draft?.startsAt ?? "09:00").split(":").map(Number);
    return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <Dialog
      open={draft !== null}
      onOpenChange={(open) => {
        if (!open) {
          setSubjectId(null);
          onClose();
        }
      }}
    >
      {draft && (
        <DialogContent title={editing ? "Edit class" : "Add class"}>
          {subjects.length === 0 ? (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">Add a subject first, then you can put it on your timetable.</p>
              <SubjectsManager trigger={<Button className="w-full">Add a subject</Button>} />
            </div>
          ) : (
            <form key={draft.id ?? `${draft.weekday}-${draft.startsAt}`} onSubmit={onSubmit} className="space-y-4">
              <Field label="Subject">
                <SubjectSelect
                  name="subjectId"
                  required
                  value={chosenSubject}
                  onChange={setSubjectId}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Day" className="col-span-2 sm:col-span-1">
                  <Select name="weekday" defaultValue={draft.weekday}>
                    {WEEKDAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Starts">
                  <Input name="startsAt" type="time" step={300} defaultValue={draft.startsAt} required />
                </Field>
                <Field label="Ends">
                  <Input name="endsAt" type="time" step={300} defaultValue={defaultEnd()} required />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select name="kind" defaultValue={draft.kind ?? "lecture"} className="capitalize">
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k[0].toUpperCase() + k.slice(1)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Room">
                  <Input
                    name="room"
                    key={chosenSubject ?? "none"}
                    defaultValue={draft.room ?? subjects.find((s) => s.id === chosenSubject)?.room ?? ""}
                    placeholder="Optional"
                  />
                </Field>
              </div>
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
                  <Button type="submit">{editing ? "Save" : "Add class"}</Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
