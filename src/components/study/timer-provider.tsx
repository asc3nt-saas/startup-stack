"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAddStudySession } from "@/lib/data/hooks";

export type Preset = { id: string; label: string; focus: number; rest: number };

export const PRESETS: Preset[] = [
  { id: "pomodoro", label: "Pomodoro", focus: 25, rest: 5 },
  { id: "deep", label: "Deep focus", focus: 50, rest: 10 },
  { id: "quick", label: "Quick sprint", focus: 15, rest: 3 },
];

type Phase = "focus" | "rest";
type Status = "idle" | "running" | "paused";

type TimerState = {
  preset: Preset;
  phase: Phase;
  status: Status;
  /** Epoch ms when the running phase ends. */
  endsAt: number | null;
  /** Time left while paused or idle. */
  remainingMs: number;
  /** When the current focus phase first started, for the session log. */
  startedAt: string | null;
  subjectId: string | null;
  /** Focus phases finished in a row, for "round 2 of 4". */
  rounds: number;
};

const STORAGE_KEY = "studyhub-timer";

const fresh = (preset: Preset, subjectId: string | null = null, rounds = 0): TimerState => ({
  preset,
  phase: "focus",
  status: "idle",
  endsAt: null,
  remainingMs: preset.focus * 60_000,
  startedAt: null,
  subjectId,
  rounds,
});

/** A short two-note chime made with the Web Audio API (no sound files needed). */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.65);
    });
  } catch {}
}

type TimerContextValue = TimerState & {
  /** Milliseconds left in the current phase. */
  remaining: number;
  /** Total length of the current phase in ms. */
  phaseMs: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  /** Ends the focus phase now and logs the minutes studied so far. */
  finishEarly: () => void;
  skipRest: () => void;
  setPreset: (preset: Preset) => void;
  setSubject: (id: string | null) => void;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const ctx = use(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
}

/**
 * Lives in the app shell so the timer keeps running while you move between
 * pages, and survives a reload because the end time is saved.
 */
export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>(() => fresh(PRESETS[0]));
  const [now, setNow] = useState(0);
  const loaded = useRef(false);
  const addSession = useAddStudySession();
  const logSession = addSession.mutate;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Restoring a running timer after mount keeps hydration consistent.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setState(JSON.parse(saved) as TimerState);
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    if (state.status !== "running") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.status]);

  const phaseMs = (state.phase === "focus" ? state.preset.focus : state.preset.rest) * 60_000;
  // Until the first tick after starting, `now` can be stale, so never show more than was left.
  const remaining =
    state.status === "running" && state.endsAt
      ? Math.max(0, Math.min(state.remainingMs, state.endsAt - now))
      : state.remainingMs;

  const log = useCallback(
    (minutes: number, s: TimerState) => {
      if (minutes < 1) return;
      logSession({
        subjectId: s.subjectId,
        startedAt: s.startedAt ?? new Date(Date.now() - minutes * 60_000).toISOString(),
        minutes,
      });
    },
    [logSession],
  );

  // Phase finished.
  useEffect(() => {
    if (state.status !== "running" || !state.endsAt || now < state.endsAt) return;
    chime();
    if (state.phase === "focus") {
      log(state.preset.focus, state);
      toast.success(`Nice work! ${state.preset.focus} minutes logged. Time for a break.`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((s) => ({
        ...s,
        phase: "rest",
        status: "running",
        endsAt: Date.now() + s.preset.rest * 60_000,
        remainingMs: s.preset.rest * 60_000,
        startedAt: null,
        rounds: s.rounds + 1,
      }));
    } else {
      toast("Break's over. Ready for the next round?");
      setState((s) => ({ ...fresh(s.preset, s.subjectId, s.rounds) }));
    }
  }, [now, state, log]);

  // Show the countdown in the browser tab.
  useEffect(() => {
    if (state.status === "idle") return;
    const original = document.title;
    const total = Math.ceil(remaining / 1000);
    const label = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    document.title = `${label} · ${state.phase === "focus" ? "Focus" : "Break"}`;
    return () => {
      document.title = original;
    };
  }, [remaining, state.status, state.phase]);

  const value = useMemo<TimerContextValue>(
    () => ({
      ...state,
      remaining,
      phaseMs,
      start: () =>
        setState((s) => ({
          ...s,
          status: "running",
          endsAt: Date.now() + s.remainingMs,
          startedAt: s.phase === "focus" ? (s.startedAt ?? new Date().toISOString()) : s.startedAt,
        })),
      pause: () =>
        setState((s) => ({
          ...s,
          status: "paused",
          endsAt: null,
          remainingMs: s.endsAt ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs,
        })),
      reset: () => setState((s) => fresh(s.preset, s.subjectId, s.rounds)),
      finishEarly: () => {
        const left = state.status === "running" && state.endsAt ? state.endsAt - Date.now() : state.remainingMs;
        const minutes = Math.floor((state.preset.focus * 60_000 - left) / 60_000);
        if (minutes >= 1) {
          log(minutes, state);
          toast.success(`${minutes} ${minutes === 1 ? "minute" : "minutes"} logged`);
        } else {
          toast("Less than a minute, so nothing was logged");
        }
        setState((s) => fresh(s.preset, s.subjectId, s.rounds));
      },
      skipRest: () => setState((s) => fresh(s.preset, s.subjectId, s.rounds)),
      setPreset: (preset) => setState((s) => fresh(preset, s.subjectId, 0)),
      setSubject: (subjectId) => setState((s) => ({ ...s, subjectId })),
    }),
    [state, remaining, phaseMs, log],
  );

  return <TimerContext value={value}>{children}</TimerContext>;
}
