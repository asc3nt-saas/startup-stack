"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ArrowLeft, Check, Loader2, NotebookPen, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SubjectSelect } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutations, useNotes, useSubjects } from "@/lib/data/hooks";
import type { Note } from "@/lib/data/types";
import { noteText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NoteEditor } from "./note-editor";

const SAVE_DELAY = 600;

export function NotesView() {
  const notes = useNotes();
  const { data: subjects = [] } = useSubjects();
  const { create, remove } = useMutations("notes");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s] as const)), [subjects]);

  const list = useMemo(
    () =>
      [...(notes.data ?? [])]
        .filter((n) => !subjectFilter || n.subjectId === subjectFilter)
        .filter((n) => {
          if (!query) return true;
          const q = query.toLowerCase();
          return n.title.toLowerCase().includes(q) || noteText(n.content).toLowerCase().includes(q);
        })
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)),
    [notes.data, query, subjectFilter],
  );

  const selected = notes.data?.find((n) => n.id === selectedId) ?? null;

  // ?focus=<id> from search or the Today view opens that note.
  useEffect(() => {
    if (!notes.data) return;
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (focus && notes.data.some((n) => n.id === focus)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(focus);
      window.history.replaceState(null, "", "/notes");
    }
  }, [notes.data]);

  async function newNote() {
    const note = await create.mutateAsync({
      title: "Untitled",
      content: "",
      subjectId: subjectFilter,
      pinned: false,
    });
    setSelectedId(note.id);
  }

  return (
    <div className="-my-2 grid gap-6 md:grid-cols-[18rem_1fr]">
      <aside className={cn("space-y-3", selected && "hidden md:block")}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <Button size="sm" onClick={newNote} disabled={create.isPending}>
            <Plus /> New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="h-9 pl-9" />
        </div>
        <div className="[&_select]:h-9">
          <SubjectSelect value={subjectFilter} onChange={setSubjectFilter} allowNone noneLabel="All subjects" />
        </div>
        {notes.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {query || subjectFilter ? "No matching notes." : "No notes yet."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {list.map((n) => {
              const subject = subjectById.get(n.subjectId ?? "");
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setSelectedId(n.id)}
                    className={cn(
                      "w-full cursor-pointer rounded-lg border p-3 text-left transition",
                      n.id === selectedId ? "border-primary/50 bg-accent/60" : "bg-card hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate text-sm font-medium">{n.title || "Untitled"}</span>
                      {n.pinned && <Pin className="size-3.5 text-muted-foreground" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {noteText(n.content) || "Empty note"}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="size-1.5 rounded-full" style={{ background: subject?.color ?? "var(--muted-foreground)" }} />
                      {subject?.name ?? "General"}
                      <span className="ml-auto">{formatDistanceToNowStrict(new Date(n.updatedAt))} ago</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className={cn("min-w-0", !selected && "hidden md:block")}>
        {selected ? (
          <NotePane
            key={selected.id}
            note={selected}
            onBack={() => setSelectedId(null)}
            onDelete={() => {
              if (!confirm("Delete this note?")) return;
              remove.mutate(selected.id);
              setSelectedId(null);
            }}
          />
        ) : (
          <div className="flex h-full min-h-[60dvh] flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <NotebookPen className="size-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">Pick a note or create a new one.</p>
            <Button className="mt-4" variant="outline" onClick={newNote}>
              <Plus /> New note
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function NotePane({ note, onBack, onDelete }: { note: Note; onBack: () => void; onDelete: () => void }) {
  const { update } = useMutations("notes");
  const [title, setTitle] = useState(note.title);
  const [saving, setSaving] = useState<"idle" | "pending" | "saved">("idle");
  const pending = useRef<Partial<Note>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mutate = update.mutate;

  function flush() {
    clearTimeout(timer.current);
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return;
    mutate({ id: note.id, patch }, { onSuccess: () => setSaving("saved") });
  }

  function queue(patch: Partial<Note>) {
    pending.current = { ...pending.current, ...patch };
    setSaving("pending");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  }

  // Save anything still pending when switching notes or leaving the page.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => () => flushRef.current(), []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to notes">
          <ArrowLeft />
        </Button>
        <div className="w-44 [&_select]:h-9">
          <SubjectSelect value={note.subjectId} onChange={(subjectId) => update.mutate({ id: note.id, patch: { subjectId } })} allowNone />
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {saving === "pending" && (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving
            </>
          )}
          {saving === "saved" && (
            <>
              <Check className="size-3" /> Saved
            </>
          )}
        </span>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => update.mutate({ id: note.id, patch: { pinned: !note.pinned } })}
            aria-label={note.pinned ? "Unpin" : "Pin"}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? <PinOff /> : <Pin />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete note" title="Delete">
            <Trash2 />
          </Button>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          queue({ title: e.target.value || "Untitled" });
        }}
        placeholder="Untitled"
        className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
      />
      <NoteEditor content={note.content} onChange={(content) => queue({ content })} />
    </div>
  );
}
