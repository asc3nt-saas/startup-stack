"use client";

import { FileText, ImageIcon, Loader2, Sparkles, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { SubjectSelect } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useSaveRoadmap } from "@/lib/data/hooks";
import type { GeneratedRoadmap } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const MAX_MB = 4;
const ACCEPT = ".pdf,.txt,.md,.png,.jpg,.jpeg,.webp";

const STEPS = [
  "Reading your file",
  "Finding the key ideas",
  "Writing the summary",
  "Building lessons",
  "Making quiz questions",
  "Almost there",
];

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export function CreateRoadmap({ onCreated }: { onCreated: (id: string) => void }) {
  const [mode, setMode] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const save = useSaveRoadmap();

  function pick(next: File | undefined) {
    if (!next) return;
    if (next.size > MAX_MB * 1024 * 1024) {
      toast.error(`That file is over ${MAX_MB} MB. Try a smaller one or paste the text.`);
      return;
    }
    setFile(next);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    setMode("file");
    pick(e.dataTransfer.files[0]);
  }

  const ready = mode === "file" ? Boolean(file) : text.trim().length >= 200;

  async function generate() {
    if (!ready || working) return;
    setWorking(true);
    try {
      const body = new FormData();
      if (mode === "file" && file) body.set("file", file);
      else body.set("text", text);
      const res = await fetch("/api/ai/roadmap", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as {
        roadmap?: GeneratedRoadmap;
        sample?: boolean;
        error?: string;
      };
      if (!res.ok || !json.roadmap) throw new Error(json.error ?? "Something went wrong. Try again.");

      const saved = await save.mutateAsync({
        generated: json.roadmap,
        subjectId,
        sourceName: mode === "file" ? (file?.name ?? null) : null,
      });
      if (json.sample) {
        toast.info("This is a sample roadmap", {
          description: "Add a Gemini API key to turn your own files into roadmaps.",
        });
      } else {
        toast.success("Your roadmap is ready!");
      }
      setFile(null);
      setText("");
      onCreated(saved.id);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-card shadow-xs"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_55%),radial-gradient(circle_at_100%_100%,color-mix(in_oklab,#f59e0b_12%,transparent),transparent_50%)]" />

      <div className="relative grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_1.2fr] md:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="size-3.5" /> Powered by Gemini
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Turn any file into a learning path</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload lecture slides, a textbook chapter or a photo of your notes. You get a clear summary, bite-sized
            lessons with quizzes, and flashcards to keep it fresh.
          </p>
        </div>

        <div className="space-y-3">
          <div className="inline-flex rounded-lg bg-muted p-1 text-sm">
            {(["file", "text"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 transition",
                  mode === m ? "bg-card font-medium shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "file" ? "Upload file" : "Paste text"}
              </button>
            ))}
          </div>

          {mode === "file" ? (
            file ? (
              <div className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  {file.type.startsWith("image/") ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove file" disabled={working}>
                  <X />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => input.current?.click()}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-background/60 px-4 py-7 text-center transition hover:border-primary/60 hover:bg-accent/40",
                  dragging && "border-primary bg-accent/60",
                )}
              >
                <Upload className="size-6 text-primary" />
                <span className="text-sm font-medium">Drop a file here or click to choose</span>
                <span className="text-xs text-muted-foreground">PDF, image or text, up to {MAX_MB} MB</span>
              </button>
            )
          ) : (
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your notes, an article or a textbook section (at least a couple of paragraphs)…"
              className="min-h-32 bg-background/60"
            />
          )}
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="sm:w-48">
              <SubjectSelect value={subjectId} onChange={setSubjectId} allowNone />
            </div>
            <Button className="h-10 flex-1" onClick={generate} disabled={!ready || working}>
              {working ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {working ? "Generating…" : "Generate roadmap"}
            </Button>
          </div>
          {mode === "text" && text.length > 0 && text.trim().length < 200 && (
            <p className="text-xs text-muted-foreground">Keep going: a bit more text gives better lessons.</p>
          )}
        </div>
      </div>

      <AnimatePresence>{working && <Working />}</AnimatePresence>
    </div>
  );
}

/** Covers the card while Gemini works, cycling through what it's doing. */
function Working() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-card/90 backdrop-blur-sm"
      role="status"
    >
      <div className="relative size-20">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <Sparkles className="size-9" />
        </motion.div>
      </div>
      <div className="h-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm font-medium"
          >
            {STEPS[step]}…
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((_, i) => (
          <span key={i} className={cn("h-1.5 w-6 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
    </motion.div>
  );
}
