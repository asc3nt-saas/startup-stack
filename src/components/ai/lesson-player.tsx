"use client";

import { BookOpen, Check, Star, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion, RoadmapNode } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";

function tone(freqs: number[]) {
  try {
    const ctx = new AudioContext();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.12;
      osc.frequency.value = freq;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch {}
}

type Step = { kind: "read" } | { kind: "question"; question: QuizQuestion; retry: boolean };

/**
 * One lesson, Duolingo style: read a short explanation, then answer the quiz.
 * A question you miss comes back once at the end.
 */
export function LessonPlayer({
  node,
  number,
  onExit,
  onComplete,
}: {
  node: RoadmapNode;
  number: number;
  onExit: () => void;
  onComplete: (result: { correct: number; total: number }) => void;
}) {
  const [steps, setSteps] = useState<Step[]>(() => [
    { kind: "read" },
    ...node.quiz.map((question) => ({ kind: "question" as const, question, retry: false })),
  ]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [done, setDone] = useState(false);

  const step = steps[index];
  const total = node.quiz.length;
  const correct = step?.kind === "question" && choice === step.question.answer;
  const progress = done ? 100 : (index / steps.length) * 100;

  const advance = useCallback(() => {
    if (index + 1 >= steps.length) {
      setDone(true);
      tone([523, 659, 784, 1047]);
      return;
    }
    setIndex(index + 1);
    setChoice(null);
    setChecked(false);
  }, [index, steps.length]);

  const check = useCallback(() => {
    if (step?.kind !== "question" || choice === null || checked) return;
    setChecked(true);
    if (choice === step.question.answer) {
      tone([660, 880]);
      if (!step.retry) setFirstTry((n) => n + 1);
    } else {
      tone([220, 180]);
      if (!step.retry) setSteps((s) => [...s, { ...step, retry: true }]);
    }
  }, [step, choice, checked]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (step?.kind === "question" && !checked) {
        const n = Number(e.key);
        if (n >= 1 && n <= step.question.options.length) setChoice(n - 1);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (step?.kind === "read" || checked) advance();
        else check();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, checked, done, advance, check]);

  if (done) {
    return (
      <LessonComplete
        xp={node.xp}
        correct={firstTry}
        total={total}
        onContinue={() => onComplete({ correct: firstTry, total })}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-2xl flex-col">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onExit} aria-label="Leave lesson">
          <X />
        </Button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="relative h-full rounded-full bg-success"
            animate={{ width: `${Math.max(4, progress)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <span className="absolute inset-x-2 top-0.5 h-1 rounded-full bg-white/30" />
          </motion.div>
        </div>
      </div>

      <div className="flex-1 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {step.kind === "read" ? (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <BookOpen className="size-3.5" /> Lesson {number}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">{node.title}</h2>
                <RichText text={node.content} className="mt-5 text-[15px] text-muted-foreground" />
              </div>
            ) : (
              <QuestionStep
                step={step}
                choice={choice}
                checked={checked}
                onChoose={(i) => !checked && setChoice(i)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "sticky bottom-0 -mx-4 border-t px-4 py-4 transition-colors sm:mx-0 sm:rounded-2xl sm:border",
          checked ? (correct ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10") : "bg-background",
        )}
      >
        {checked && step.kind === "question" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex gap-3">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-white",
                correct ? "bg-success" : "bg-danger",
              )}
            >
              {correct ? <Check className="size-5" /> : <X className="size-5" />}
            </span>
            <div className="text-sm">
              <p className={cn("font-semibold", correct ? "text-success" : "text-danger")}>
                {correct ? "Nice work!" : `Correct answer: ${step.question.options[step.question.answer]}`}
              </p>
              {step.question.explanation && <p className="mt-0.5 text-muted-foreground">{step.question.explanation}</p>}
            </div>
          </motion.div>
        )}
        {step.kind === "read" ? (
          <Button size="lg" className="w-full" onClick={advance}>
            Start quiz
          </Button>
        ) : checked ? (
          <Button
            size="lg"
            className={cn("w-full text-white", correct ? "bg-success" : "bg-danger")}
            onClick={advance}
          >
            Continue
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={check} disabled={choice === null}>
            Check
          </Button>
        )}
      </div>
    </div>
  );
}

function QuestionStep({
  step,
  choice,
  checked,
  onChoose,
}: {
  step: Extract<Step, { kind: "question" }>;
  choice: number | null;
  checked: boolean;
  onChoose: (i: number) => void;
}) {
  const { question } = step;
  return (
    <div>
      {step.retry && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-warning">Let&apos;s try that again</p>
      )}
      <h2 className="text-xl font-bold leading-snug tracking-tight sm:text-2xl">{question.question}</h2>
      <div className="mt-6 grid gap-2.5">
        {question.options.map((option, i) => {
          const selected = choice === i;
          const isAnswer = i === question.answer;
          return (
            <motion.button
              key={i}
              onClick={() => onChoose(i)}
              animate={checked && selected && !isAnswer ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
              disabled={checked}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-b-4 bg-card p-3.5 text-left transition active:translate-y-0.5 active:border-b-2 disabled:cursor-default",
                !checked && selected && "border-primary bg-accent",
                !checked && !selected && "hover:bg-muted",
                checked && isAnswer && "border-success bg-success/10",
                checked && selected && !isAnswer && "border-danger bg-danger/10",
                checked && !selected && !isAnswer && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold text-muted-foreground",
                  selected && !checked && "border-primary text-primary",
                )}
              >
                {i + 1}
              </span>
              <span className="text-[15px]">{option}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function LessonComplete({
  xp,
  correct,
  total,
  onContinue,
}: {
  xp: number;
  correct: number;
  total: number;
  onContinue: () => void;
}) {
  const accuracy = total ? Math.round((correct / total) * 100) : 100;
  const sparks = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ angle: (i / 12) * Math.PI * 2, distance: 70 + (i % 3) * 18 })),
    [],
  );

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-md flex-col items-center justify-center text-center">
      <div className="relative">
        {sparks.map((s, i) => (
          <motion.span
            key={i}
            className={cn("absolute left-1/2 top-1/2 size-2.5 rounded-full", ["bg-amber-400", "bg-primary", "bg-success"][i % 3])}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: Math.cos(s.angle) * s.distance, y: Math.sin(s.angle) * s.distance, opacity: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
          />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-[0_8px_0_0_#c2410c]"
        >
          <Star className="size-14 fill-white" />
        </motion.div>
      </div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-3xl font-bold tracking-tight"
      >
        Lesson complete!
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-8 grid w-full grid-cols-2 gap-3"
      >
        <div className="overflow-hidden rounded-2xl border-2 border-amber-400">
          <p className="bg-amber-400 py-1 text-xs font-bold uppercase text-white">Total XP</p>
          <p className="flex items-center justify-center gap-1.5 py-3 text-2xl font-bold text-amber-500">
            <Zap className="size-5 fill-current" /> {xp}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border-2 border-success">
          <p className="bg-success py-1 text-xs font-bold uppercase text-white">Accuracy</p>
          <p className="flex items-center justify-center gap-1.5 py-3 text-2xl font-bold text-success">
            <Check className="size-5" /> {accuracy}%
          </p>
        </div>
      </motion.div>
      <Button size="lg" className="mt-10 w-full" onClick={onContinue} autoFocus>
        Continue
      </Button>
    </div>
  );
}
