"use client";

import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft, Layers, Pencil, Play, Plus, Trash2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SubjectSelect } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCards, useDecks, useMutations, useSubjects } from "@/lib/data/hooks";
import type { Flashcard, FlashcardDeck } from "@/lib/data/types";
import { isDue, todayKey } from "@/lib/srs";
import { cn } from "@/lib/utils";
import { StudySession } from "./study-session";

const newCard = (deckId: string, front: string, back: string) => ({
  deckId,
  front,
  back,
  ease: 2.5,
  intervalDays: 0,
  dueOn: todayKey(),
});

export function FlashcardsView() {
  const decks = useDecks();
  const cards = useCards();
  const [deckId, setDeckId] = useState<string | null>(null);
  const [studying, setStudying] = useState<Flashcard[] | null>(null);
  const [editingDeck, setEditingDeck] = useState<Partial<FlashcardDeck> | null>(null);

  const deck = decks.data?.find((d) => d.id === deckId) ?? null;
  // Ignore cards whose deck was just deleted (the database removes them too).
  const allCards = useMemo(() => {
    const ids = new Set((decks.data ?? []).map((d) => d.id));
    return (cards.data ?? []).filter((c) => ids.has(c.deckId));
  }, [cards.data, decks.data]);
  const deckCards = useMemo(() => allCards.filter((c) => c.deckId === deckId), [allCards, deckId]);

  // ?deck=<id> opens a deck directly.
  useEffect(() => {
    if (!decks.data) return;
    const id = new URLSearchParams(window.location.search).get("deck");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id && decks.data.some((d) => d.id === id)) setDeckId(id);
  }, [decks.data]);

  if (deck && studying) {
    return <StudySession deck={deck} cards={studying} onExit={() => setStudying(null)} />;
  }

  return (
    <>
      {deck ? (
        <DeckDetail
          deck={deck}
          cards={deckCards}
          onBack={() => setDeckId(null)}
          onStudy={setStudying}
          onEdit={() => setEditingDeck(deck)}
        />
      ) : (
        <DeckList
          loading={decks.isLoading || cards.isLoading}
          decks={decks.data ?? []}
          cards={allCards}
          onOpen={setDeckId}
          onNew={() => setEditingDeck({})}
          onStudyAll={(due) => {
            if (!due.length) return;
            setDeckId(due[0].deckId);
            setStudying(due.filter((c) => c.deckId === due[0].deckId));
          }}
        />
      )}
      <DeckDialog
        draft={editingDeck}
        onClose={() => setEditingDeck(null)}
        onCreated={(id) => setDeckId(id)}
        onDeleted={() => setDeckId(null)}
      />
    </>
  );
}

function DeckList({
  loading,
  decks,
  cards,
  onOpen,
  onNew,
  onStudyAll,
}: {
  loading: boolean;
  decks: FlashcardDeck[];
  cards: Flashcard[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onStudyAll: (due: Flashcard[]) => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const due = cards.filter((c) => isDue(c));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Flashcards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Spaced repetition shows each card right before you&apos;d forget it.
          </p>
        </div>
        <div className="flex gap-2">
          {due.length > 0 && (
            <Button variant="outline" onClick={() => onStudyAll(due)}>
              <Play /> Review next deck
            </Button>
          )}
          <Button onClick={onNew}>
            <Plus /> New deck
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Decks</p>
          <p className="mt-1 text-2xl font-semibold">{decks.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Cards</p>
          <p className="mt-1 text-2xl font-semibold">{cards.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Due today</p>
          <p className={cn("mt-1 text-2xl font-semibold", due.length && "text-primary")}>{due.length}</p>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Layers className="mx-auto size-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">Create your first deck to start reviewing.</p>
          <Button className="mt-4" onClick={onNew}>
            <Plus /> New deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d, i) => {
            const inDeck = cards.filter((c) => c.deckId === d.id);
            const dueCount = inDeck.filter((c) => isDue(c)).length;
            const subject = subjects.find((s) => s.id === d.subjectId);
            const color = subject?.color ?? "#6366f1";
            return (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpen(d.id)}
                className="group relative cursor-pointer text-left"
              >
                {/* Stacked-cards look */}
                <span className="absolute inset-x-3 -bottom-1.5 h-full rounded-xl border bg-card/60" />
                <span className="absolute inset-x-1.5 -bottom-0.5 h-full rounded-xl border bg-card/80" />
                <div className="relative rounded-xl border bg-card p-5 shadow-xs transition group-hover:-translate-y-1 group-hover:shadow-md">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: color }} />
                    {subject?.name ?? "General"}
                  </div>
                  <div className="mt-2 line-clamp-2 min-h-12 text-lg font-semibold leading-snug">{d.title}</div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {inDeck.length} {inDeck.length === 1 ? "card" : "cards"}
                    </span>
                    {dueCount > 0 ? (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                        {dueCount} due
                      </span>
                    ) : (
                      <span className="text-xs text-success">All caught up ✓</span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeckDetail({
  deck,
  cards,
  onBack,
  onStudy,
  onEdit,
}: {
  deck: FlashcardDeck;
  cards: Flashcard[];
  onBack: () => void;
  onStudy: (cards: Flashcard[]) => void;
  onEdit: () => void;
}) {
  const { create, update, remove } = useMutations("cards");
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const due = cards.filter((c) => isDue(c));

  function addCard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const front = String(data.get("front")).trim();
    const back = String(data.get("back")).trim();
    if (!front || !back) return;
    create.mutate(newCard(deck.id, front, back));
    form.reset();
    form.querySelector<HTMLTextAreaElement>("[name=front]")?.focus();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="All decks">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{deck.title}</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} {cards.length === 1 ? "card" : "cards"} · {due.length} due today
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit deck">
          <Pencil />
        </Button>
        <Button variant="outline" onClick={() => cards.length && onStudy(cards)} disabled={!cards.length}>
          Practice all
        </Button>
        <Button onClick={() => due.length && onStudy(due)} disabled={!due.length}>
          <Play /> Study {due.length || ""} due
        </Button>
      </div>

      <Card className="p-4">
        <form onSubmit={addCard} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Front (question)">
            <Textarea name="front" rows={2} className="min-h-0" placeholder="e.g. What is the derivative of sin x?" />
          </Field>
          <Field label="Back (answer)">
            <Textarea name="back" rows={2} className="min-h-0" placeholder="cos x" />
          </Field>
          <div className="flex gap-2">
            <Button type="submit">
              <Plus /> Add
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => setImporting(true)} title="Import many">
              <Upload />
            </Button>
          </div>
        </form>
      </Card>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No cards yet. Add one above, or import a list.
        </p>
      ) : (
        <Card className="divide-y">
          {cards.map((c) =>
            editingId === c.id ? (
              <form
                key={c.id}
                className="grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto]"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  update.mutate({
                    id: c.id,
                    patch: { front: String(data.get("front")).trim(), back: String(data.get("back")).trim() },
                  });
                  setEditingId(null);
                }}
              >
                <Textarea name="front" defaultValue={c.front} rows={2} className="min-h-0" autoFocus />
                <Textarea name="back" defaultValue={c.back} rows={2} className="min-h-0" />
                <div className="flex gap-1 sm:flex-col">
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div key={c.id} className="group grid items-center gap-x-4 gap-y-1 p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                <div className="text-sm font-medium">{c.front}</div>
                <div className="text-sm text-muted-foreground">{c.back}</div>
                <div className="text-xs text-muted-foreground">
                  {isDue(c) ? (
                    <span className="text-primary">Due now</span>
                  ) : (
                    `In ${formatDistanceToNowStrict(parseISO(c.dueOn))}`
                  )}
                </div>
                <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(c.id)} aria-label="Edit card">
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(c.id)} aria-label="Delete card">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ),
          )}
        </Card>
      )}

      <ImportDialog open={importing} deckId={deck.id} onClose={() => setImporting(false)} />
    </div>
  );
}

/** Paste one card per line: "question ; answer" (tab or " - " also work). */
function parseImport(text: string) {
  return text
    .split("\n")
    .map((line) => line.split(/\t| ; |;| - | — /))
    .filter((parts) => parts.length >= 2 && parts[0].trim() && parts.slice(1).join(" ").trim())
    .map((parts) => ({ front: parts[0].trim(), back: parts.slice(1).join(" ").trim() }));
}

function ImportDialog({ open, deckId, onClose }: { open: boolean; deckId: string; onClose: () => void }) {
  const { create } = useMutations("cards");
  const [text, setText] = useState("");
  const parsed = parseImport(text);

  async function importAll() {
    for (const card of parsed) await create.mutateAsync(newCard(deckId, card.front, card.back));
    toast.success(`Imported ${parsed.length} cards`);
    setText("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Import cards" description="One card per line, with the question and answer separated by a semicolon, a tab or a dash.">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"Capital of France ; Paris\nH2O ; Water\nPi to 2 decimals ; 3.14"}
          className="font-mono text-xs"
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{parsed.length} cards found</span>
          <Button onClick={importAll} disabled={!parsed.length || create.isPending}>
            Import {parsed.length || ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeckDialog({
  draft,
  onClose,
  onCreated,
  onDeleted,
}: {
  draft: Partial<FlashcardDeck> | null;
  onClose: () => void;
  onCreated: (id: string) => void;
  onDeleted: () => void;
}) {
  const { create, update, remove } = useMutations("decks");
  const editing = Boolean(draft?.id);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    const data = new FormData(e.currentTarget);
    const values = { title: String(data.get("title")).trim(), subjectId: String(data.get("subjectId")) || null };
    if (draft.id) update.mutate({ id: draft.id, patch: values });
    else onCreated((await create.mutateAsync(values)).id);
    onClose();
  }

  return (
    <Dialog open={draft !== null} onOpenChange={(o) => !o && onClose()}>
      {draft && (
        <DialogContent title={editing ? "Edit deck" : "New deck"}>
          <form key={draft.id ?? "new"} onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <Input name="title" defaultValue={draft.title} placeholder="e.g. Organic chemistry" required autoFocus />
            </Field>
            <Field label="Subject">
              <SubjectSelect name="subjectId" value={draft.subjectId} allowNone />
            </Field>
            <div className="flex items-center gap-2 pt-2">
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => {
                    if (!confirm("Delete this deck and all its cards?")) return;
                    remove.mutate(draft.id!);
                    onDeleted();
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
                <Button type="submit">{editing ? "Save" : "Create deck"}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
