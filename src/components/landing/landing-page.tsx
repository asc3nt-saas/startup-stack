import {
  ArrowRight,
  CalendarDays,
  Check,
  FileUp,
  Layers,
  ListChecks,
  Map as MapIcon,
  MessagesSquare,
  NotebookPen,
  Sheet,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isDemoMode, siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

/** A product screenshot in a browser frame, with a light and a dark version. */
function Screen({ name, alt, priority, className }: { name: string; alt: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/10", className)}>
      <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      <Image
        src={`/screens/${name}-light.jpg`}
        alt={alt}
        width={1920}
        height={1200}
        priority={priority}
        sizes="(min-width: 1024px) 1100px, 100vw"
        className="block h-auto w-full dark:hidden"
      />
      <Image
        src={`/screens/${name}-dark.jpg`}
        alt={alt}
        width={1920}
        height={1200}
        sizes="(min-width: 1024px) 1100px, 100vw"
        className="hidden h-auto w-full dark:block"
      />
    </div>
  );
}

const FEATURES: { icon: LucideIcon; title: string; text: string; color: string }[] = [
  { icon: CalendarDays, title: "Timetable", text: "A clean weekly grid. Drag and resize classes to fit your week.", color: "#6366f1" },
  { icon: ListChecks, title: "Assignments and exams", text: "Every deadline in one list, with reminders before it's due.", color: "#f59e0b" },
  { icon: NotebookPen, title: "Notes", text: "Rich notes organised by subject, searchable with Ctrl+K.", color: "#10b981" },
  { icon: Sheet, title: "Grades", text: "A spreadsheet-style gradebook that works out your average for you.", color: "#0ea5e9" },
  { icon: Layers, title: "Flashcards", text: "Spaced repetition shows each card right before you'd forget it.", color: "#8b5cf6" },
  { icon: Timer, title: "Study timer", text: "A flip clock with Pomodoro presets, streaks and XP.", color: "#ef4444" },
  { icon: MessagesSquare, title: "Group chat", text: "Study rooms with invite codes and live messages.", color: "#14b8a6" },
  { icon: Sparkles, title: "AI roadmap", text: "Upload a file and get a summary plus bite-sized lessons.", color: "#d946ef" },
];

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes. Every tool is free for students. We plan to add optional extras later, but the core dashboard stays free.",
  },
  {
    q: "Where is my data stored?",
    a: "In a secure Postgres database. Row level security means each student can only ever read their own data.",
  },
  {
    q: "Which files can the AI read?",
    a: "PDFs (including exported slides), photos of your notes, and plain text. It writes the summary and lessons in the same language as your file.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Every page is designed for phones as well as laptops, and you can add it to your home screen like an app.",
  },
];

function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-wider text-primary">{children}</p>;
}

function Showcase({
  eyebrow,
  title,
  text,
  points,
  screen,
  alt,
  flip,
}: {
  eyebrow: string;
  title: string;
  text: string;
  points: string[];
  screen: string;
  alt: string;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[2fr_3fr]">
      <div className={cn(flip && "lg:order-2")}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
        <p className="mt-3 text-muted-foreground">{text}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-3.5" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <Screen name={screen} alt={alt} />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="size-8" />
            <span>{siteConfig.name}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#ai" className="hover:text-foreground">
              AI roadmap
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/today">
                Open the app <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]" />
        <Section className="relative pt-16 text-center sm:pt-24">
          <div className="animate-[rise_0.6s_ease-out_both]">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <Sparkles className="size-3.5 text-primary" /> 8 study tools, one login, free for students
            </span>
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl animate-[rise_0.6s_0.08s_ease-out_both] text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Your whole student life in{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              one place
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl animate-[rise_0.6s_0.16s_ease-out_both] text-lg text-muted-foreground text-balance">
            {siteConfig.name} brings your timetable, deadlines, notes, grades, flashcards, study timer and group chats
            together, and turns your lecture files into Duolingo-style lessons with AI.
          </p>
          <div className="mt-8 flex animate-[rise_0.6s_0.24s_ease-out_both] flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/today">
                {isDemoMode ? "Try it now, no sign-up" : "Get started free"} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">See what&apos;s inside</a>
            </Button>
          </div>
        </Section>

        <Section className="relative mt-14 sm:mt-20">
          <div className="animate-[rise_0.8s_0.3s_ease-out_both]">
            <Screen name="today" alt="The Today dashboard with classes, deadlines and a study streak" priority />
          </div>
          {/* Floating highlights */}
          <div className="absolute -left-2 top-1/3 hidden animate-[float_5s_ease-in-out_infinite] rounded-xl border bg-card p-3 shadow-xl lg:block">
            <p className="text-xs text-muted-foreground">Study streak</p>
            <p className="text-lg font-bold">🔥 5 days</p>
          </div>
          <div className="absolute -right-2 bottom-16 hidden animate-[float_6s_1s_ease-in-out_infinite] rounded-xl border bg-card p-3 shadow-xl lg:block">
            <p className="text-xs text-muted-foreground">Lesson complete</p>
            <p className="text-lg font-bold text-amber-500">+10 XP ⚡</p>
          </div>
        </Section>
      </div>

      {/* Problem */}
      <Section className="mt-24 text-center sm:mt-32">
        <p className="mx-auto max-w-3xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Stop juggling a calendar app, a notes app, a flashcard app, a spreadsheet and three group chats.{" "}
          <span className="text-muted-foreground">Everything you need to keep on top of school now lives on one screen.</span>
        </p>
      </Section>

      {/* Features */}
      <Section id="features" className="mt-24 scroll-mt-20 sm:mt-32">
        <div className="text-center">
          <Eyebrow>Everything in one dashboard</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Eight tools that work together</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <span
                className="flex size-10 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: f.color }}
              >
                <f.icon className="size-5" />
              </span>
              <p className="mt-4 font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* AI */}
      <div id="ai" className="mt-24 scroll-mt-20 bg-gradient-to-b from-accent/50 to-transparent py-20 sm:mt-32 sm:py-28">
        <Section>
          <div className="text-center">
            <Eyebrow>AI roadmap</Eyebrow>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Turn a long lecture into a path you&apos;ll actually finish
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Upload slides, a chapter or a photo of your notes. Gemini reads it and builds a learning path with short
              lessons, quizzes and XP, just like a language app.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: FileUp, title: "1. Upload", text: "Drop in a PDF, an image or paste text." },
              { icon: Sparkles, title: "2. Summarise", text: "Get a clear summary and the key points." },
              { icon: MapIcon, title: "3. Learn", text: "Work through lessons and quizzes, earn XP, then turn it into flashcards." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border bg-card p-5">
                <s.icon className="size-6 text-primary" />
                <p className="mt-3 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <Screen name="roadmap" alt="An AI-generated learning roadmap about derivatives" className="mt-12" />
        </Section>
      </div>

      {/* Tour */}
      <Section className="mt-12 space-y-24 sm:space-y-32">
        <Showcase
          eyebrow="Plan"
          title="A timetable that fits your week"
          text="Add classes once and see your whole week at a glance. Today's view shows what's next, so you never walk into the wrong room."
          points={["Colour-coded subjects", "Rooms, teachers and class types", "Reminders before every deadline"]}
          screen="timetable"
          alt="The weekly timetable"
        />
        <Showcase
          eyebrow="Track"
          title="Know your grade before the teacher does"
          text="Enter scores like a spreadsheet. Weighted averages, letter grades and the score you need on the final are worked out for you."
          points={["Weights and categories", "What do I need on the final?", "Averages across every subject"]}
          screen="grades"
          alt="The grades spreadsheet"
          flip
        />
        <Showcase
          eyebrow="Focus"
          title="Study sessions that feel like a game"
          text="Start a Pomodoro on the flip clock and keep going while you switch pages. Every minute earns XP and keeps your streak alive."
          points={["Pomodoro, deep focus and custom timers", "Daily streaks and levels", "A weekly chart of your study time"]}
          screen="study"
          alt="The flip clock study timer"
        />
        <Showcase
          eyebrow="Remember"
          title="Flashcards that schedule themselves"
          text="Spaced repetition shows each card right before you'd forget it, so ten minutes a day beats a night of cramming."
          points={["Flip cards with keyboard shortcuts", "Paste a list to import a whole deck", "Make a deck from any AI roadmap"]}
          screen="flashcards"
          alt="Reviewing a flashcard"
          flip
        />
        <Showcase
          eyebrow="Together"
          title="Group chats built for studying"
          text="Create a room for your class or project team and share the invite code. Messages arrive instantly."
          points={["Invite codes, no phone numbers needed", "Live messages", "Rooms for every class and project"]}
          screen="chat"
          alt="A study group chat"
        />
      </Section>

      {/* FAQ */}
      <Section id="faq" className="mt-24 max-w-3xl scroll-mt-20 sm:mt-32">
        <h2 className="text-center text-3xl font-bold tracking-tight">Questions</h2>
        <div className="mt-8 divide-y rounded-2xl border bg-card">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.q}
                <span className="text-xl leading-none text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="mt-24 sm:mt-32">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 px-6 py-14 text-center text-white sm:py-20">
          <div className="pointer-events-none absolute -left-10 -top-10 size-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -right-6 size-64 rounded-full bg-white/10" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Ready to get organised?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/85">
            {isDemoMode
              ? "Open the demo and click around. No sign-up needed, and your data stays in your browser."
              : "Create a free account in seconds with email or Google."}
          </p>
          <Button asChild size="lg" className="relative mt-8 bg-white text-indigo-700 hover:bg-white/90">
            <Link href="/today">
              Open {siteConfig.name} <ArrowRight />
            </Link>
          </Button>
        </div>
      </Section>

      <footer className="mt-24 border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {siteConfig.name}. {siteConfig.tagline}
          </p>
          <div className="flex gap-5">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
