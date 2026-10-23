"use client";

import { ArrowLeft, Check, ChevronDown, FileText, Layers, Lock, Map as MapIcon, Star, Trash2, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutations, useRoadmapNodes, useRoadmaps, useSubjects } from "@/lib/data/hooks";
import type { Roadmap, RoadmapNode } from "@/lib/data/types";
import { todayKey } from "@/lib/srs";
import { cn } from "@/lib/utils";
import { CreateRoadmap } from "./create-roadmap";
import { LessonPlayer } from "./lesson-player";

export function AiView() {
  const roadmaps = useRoadmaps();
  const nodes = useRoadmapNodes();
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const { update } = useMutations("roadmapNodes");

  const roadmap = roadmaps.data?.find((r) => r.id === roadmapId) ?? null;
  const nodesByRoadmap = useMemo(() => {
    const map: Record<string, RoadmapNode[]> = {};
    for (const n of nodes.data ?? []) (map[n.roadmapId] ??= []).push(n);
    for (const list of Object.values(map)) list.sort((a, b) => a.position - b.position);
    return map;
  }, [nodes.data]);
  const lessons = roadmap ? (nodesByRoadmap[roadmap.id] ?? []) : [];
  const lesson = lessons.find((n) => n.id === lessonId);

  // ?roadmap=<id> opens a roadmap directly.
  useEffect(() => {
    if (!roadmaps.data) return;
    const id = new URLSearchParams(window.location.search).get("roadmap");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id && roadmaps.data.some((r) => r.id === id)) setRoadmapId(id);
  }, [roadmaps.data]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [roadmapId, lessonId]);

  if (roadmap && lesson) {
    return (
      <LessonPlayer
        key={lesson.id}
        node={lesson}
        number={lessons.indexOf(lesson) + 1}
        onExit={() => setLessonId(null)}
        onComplete={() => {
          if (!lesson.completedAt) update.mutate({ id: lesson.id, patch: { completedAt: new Date().toISOString() } });
          setLessonId(null);
        }}
      />
    );
  }

  if (roadmap) {
    return (
      <RoadmapDetail
        roadmap={roadmap}
        lessons={lessons}
        onBack={() => setRoadmapId(null)}
        onStart={setLessonId}
      />
    );
  }

  const loading = roadmaps.isLoading || nodes.isLoading;
  const all = roadmaps.data ?? [];
  const totalXp = (nodes.data ?? []).filter((n) => n.completedAt).reduce((sum, n) => sum + n.xp, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI roadmap</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Summaries and step-by-step lessons made from your own study material.
          </p>
        </div>
        {totalXp > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <Zap className="size-4 fill-current" /> {totalXp} XP earned
          </div>
        )}
      </div>

      <CreateRoadmap onCreated={setRoadmapId} />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Your roadmaps</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : all.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <MapIcon className="mx-auto size-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Upload your first file above and your roadmaps will show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {all.map((r, i) => (
              <RoadmapCard key={r.id} roadmap={r} lessons={nodesByRoadmap[r.id] ?? []} index={i} onOpen={() => setRoadmapId(r.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoadmapCard({
  roadmap,
  lessons,
  index,
  onOpen,
}: {
  roadmap: Roadmap;
  lessons: RoadmapNode[];
  index: number;
  onOpen: () => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const subject = subjects.find((s) => s.id === roadmap.subjectId);
  const done = lessons.filter((n) => n.completedAt).length;
  const pct = lessons.length ? (done / lessons.length) * 100 : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border bg-card p-5 text-left shadow-xs transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 rounded-full" style={{ background: subject?.color ?? "var(--primary)" }} />
        {subject?.name ?? "General"}
        {done === lessons.length && lessons.length > 0 && (
          <span className="ml-auto flex items-center gap-1 font-medium text-amber-500">
            <Trophy className="size-3.5" /> Complete
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 min-h-12 text-lg font-semibold leading-snug">{roadmap.title}</p>
      {roadmap.sourceName && (
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <FileText className="size-3 shrink-0" /> <span className="truncate">{roadmap.sourceName}</span>
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {done}/{lessons.length}
        </span>
      </div>
    </motion.button>
  );
}

// Duolingo-style zigzag: how far each node sits from the centre line.
const OFFSETS = [0, 1, 1.6, 1, 0, -1, -1.6, -1];

function RoadmapDetail({
  roadmap,
  lessons,
  onBack,
  onStart,
}: {
  roadmap: Roadmap;
  lessons: RoadmapNode[];
  onBack: () => void;
  onStart: (id: string) => void;
}) {
  const router = useRouter();
  const { data: subjects = [] } = useSubjects();
  const roadmaps = useMutations("roadmaps");
  const decks = useMutations("decks");
  const cards = useMutations("cards");
  const [selected, setSelected] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [making, setMaking] = useState(false);

  const subject = subjects.find((s) => s.id === roadmap.subjectId);
  const done = lessons.filter((n) => n.completedAt).length;
  const current = lessons.findIndex((n) => !n.completedAt);
  const xp = lessons.filter((n) => n.completedAt).reduce((sum, n) => sum + n.xp, 0);
  const maxXp = lessons.reduce((sum, n) => sum + n.xp, 0);
  const finished = lessons.length > 0 && current === -1;

  async function makeFlashcards() {
    if (making || !roadmap.cards.length) return;
    setMaking(true);
    try {
      const deck = await decks.create.mutateAsync({ title: roadmap.title, subjectId: roadmap.subjectId });
      for (const c of roadmap.cards) {
        await cards.create.mutateAsync({
          deckId: deck.id,
          front: c.front,
          back: c.back,
          ease: 2.5,
          intervalDays: 0,
          dueOn: todayKey(),
        });
      }
      toast.success(`Deck created with ${roadmap.cards.length} cards`, {
        action: { label: "Open", onClick: () => router.push(`/flashcards?deck=${deck.id}`) },
      });
    } finally {
      setMaking(false);
    }
  }

  function remove() {
    if (!confirm(`Delete "${roadmap.title}"? Your progress on it will be lost.`)) return;
    roadmaps.remove.mutate(roadmap.id);
    onBack();
  }

  const summary = (
    <>
      <p className="text-sm leading-relaxed text-muted-foreground">{roadmap.summary}</p>
      {roadmap.keyPoints.length > 0 && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key points</p>
          <ul className="mt-2 space-y-2">
            {roadmap.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {point}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="All roadmaps">
          <ArrowLeft />
        </Button>
        <span className="text-sm text-muted-foreground">All roadmaps</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          {/* Unit banner */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_5px_0_0_rgba(0,0,0,0.18)]"
            style={{ background: subject?.color ?? "var(--primary)" }}
          >
            <div className="pointer-events-none absolute -right-6 -top-10 size-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 right-16 size-32 rounded-full bg-white/10" />
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">
              {subject?.name ?? "Roadmap"} · {lessons.length} lessons
            </p>
            <h1 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">{roadmap.title}</h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/20">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${lessons.length ? (done / lessons.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {done}/{lessons.length}
              </span>
            </div>
          </div>

          {/* Summary, collapsible on small screens */}
          <Card className="mt-4 lg:hidden">
            <button
              onClick={() => setShowSummary((s) => !s)}
              className="flex w-full cursor-pointer items-center justify-between p-4 text-sm font-semibold"
              aria-expanded={showSummary}
            >
              Summary and key points
              <ChevronDown className={cn("size-4 transition", showSummary && "rotate-180")} />
            </button>
            {showSummary && <div className="px-4 pb-4">{summary}</div>}
          </Card>

          <div className="relative mx-auto flex max-w-sm flex-col items-center py-10" onClick={() => setSelected(null)}>
            {lessons.map((node, i) => {
              const state = node.completedAt ? "done" : i === current ? "current" : "locked";
              return (
                <PathNode
                  key={node.id}
                  node={node}
                  number={i + 1}
                  state={state}
                  offset={OFFSETS[i % OFFSETS.length]}
                  color={subject?.color}
                  open={selected === node.id}
                  onToggle={() => setSelected((s) => (s === node.id ? null : node.id))}
                  onStart={() => onStart(node.id)}
                />
              );
            })}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "mt-4 flex size-24 items-center justify-center rounded-full",
                finished
                  ? "bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-[0_7px_0_0_#c2410c]"
                  : "bg-muted text-muted-foreground/60 shadow-[0_7px_0_0_var(--border)]",
              )}
              title={finished ? "Roadmap complete" : "Finish every lesson to earn the trophy"}
            >
              <Trophy className="size-11" />
            </motion.div>
            <p className={cn("mt-4 text-sm font-semibold", finished ? "text-amber-500" : "text-muted-foreground")}>
              {finished ? "Roadmap complete! 🎉" : "Finish every lesson to earn the trophy"}
            </p>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <div className="flex items-baseline justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Zap className="size-4 fill-amber-400 text-amber-400" /> {xp} XP
              </p>
              <p className="text-xs text-muted-foreground">of {maxXp}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${maxXp ? (xp / maxXp) * 100 : 0}%` }}
              />
            </div>
            {roadmap.sourceName && (
              <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <FileText className="size-3.5 shrink-0" /> <span className="truncate">{roadmap.sourceName}</span>
              </p>
            )}
          </Card>

          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>{summary}</CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            {roadmap.cards.length > 0 && (
              <Button variant="outline" onClick={makeFlashcards} disabled={making}>
                <Layers /> {making ? "Creating deck…" : `Make ${roadmap.cards.length} flashcards`}
              </Button>
            )}
            <Button variant="ghost" className="text-muted-foreground hover:text-danger" onClick={remove}>
              <Trash2 /> Delete roadmap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PathNode({
  node,
  number,
  state,
  offset,
  color,
  open,
  onToggle,
  onStart,
}: {
  node: RoadmapNode;
  number: number;
  state: "done" | "current" | "locked";
  offset: number;
  color?: string;
  open: boolean;
  onToggle: () => void;
  onStart: () => void;
}) {
  const accent = color ?? "var(--primary)";
  const Icon = state === "done" ? Check : state === "current" ? Star : Lock;

  return (
    <div
      className={cn("relative flex flex-col items-center pb-7", state === "current" && "mt-8", open && "z-30")}
      style={{ transform: `translateX(${offset * 3}rem)` }}
      onClick={(e) => e.stopPropagation()}
    >
      {state === "current" && !open && (
        <motion.div
          className="absolute -top-11 z-10 rounded-xl border-2 bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-sm"
          style={{ color: accent, borderColor: "var(--border)" }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          Start
          <span className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 bg-card" />
        </motion.div>
      )}

      <div className="relative">
        {state === "current" && (
          <motion.span
            className="absolute -inset-2.5 rounded-full border-4"
            style={{ borderColor: accent }}
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
        <motion.button
          onClick={onToggle}
          whileTap={{ y: 5 }}
          aria-label={`Lesson ${number}: ${node.title}${state === "locked" ? " (locked)" : ""}`}
          className={cn(
            "relative flex size-[4.5rem] cursor-pointer items-center justify-center rounded-full transition",
            state === "done" && "bg-amber-400 text-white shadow-[0_6px_0_0_#d97706]",
            state === "current" && "text-white",
            state === "locked" && "bg-muted text-muted-foreground/60 shadow-[0_6px_0_0_var(--border)]",
          )}
          style={
            state === "current"
              ? { background: accent, boxShadow: `0 6px 0 0 color-mix(in oklab, ${accent} 65%, black)` }
              : undefined
          }
        >
          <span className="absolute left-3 right-5 top-2 h-2 rounded-full bg-white/25" />
          <Icon className={cn("size-8", state !== "locked" && "drop-shadow-sm", state === "current" && "fill-white")} />
        </motion.button>
      </div>

      <p
        className={cn(
          "mt-3 max-w-36 text-center text-xs font-medium leading-tight",
          state === "locked" ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {node.title}
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            className="absolute top-[6.5rem] z-20 w-64 rounded-2xl p-4 text-white shadow-xl"
            style={{
              background: state === "locked" ? "var(--muted-foreground)" : state === "done" ? "#f59e0b" : accent,
            }}
          >
            <span
              className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45"
              style={{ background: "inherit" }}
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Lesson {number}</p>
            <p className="mt-0.5 font-bold leading-snug">{node.title}</p>
            {state === "locked" ? (
              <p className="mt-2 text-sm text-white/85">Finish the lessons before this one to unlock it.</p>
            ) : (
              <button
                onClick={onStart}
                className="mt-3 w-full cursor-pointer rounded-xl bg-white py-2 text-sm font-bold uppercase tracking-wide shadow-[0_4px_0_0_rgba(0,0,0,0.15)] transition active:translate-y-0.5 active:shadow-none"
                style={{ color: state === "done" ? "#d97706" : accent }}
              >
                {state === "done" ? "Practice again" : `Start +${node.xp} XP`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
