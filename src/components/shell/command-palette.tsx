"use client";

import { Command } from "cmdk";
import { FileText, ListChecks, Monitor, Moon, Search, Sun, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useAssignments, useNotes, useSubjects } from "@/lib/data/hooks";
import { mainNav, secondaryNav } from "./nav";

const PaletteContext = createContext<(open: boolean) => void>(() => {});

export const useCommandPalette = () => use(PaletteContext);

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground";
const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground";

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { data: assignments = [] } = useAssignments();
  const { data: notes = [] } = useNotes();
  const { data: subjects = [] } = useSubjects();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name;

  return (
    <PaletteContext value={setOpen}>
      {children}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Search"
        overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        contentClassName="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 text-muted-foreground" />
          <Command.Input
            placeholder="Search assignments, notes, subjects or pages..."
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
            Nothing found.
          </Command.Empty>

          <Command.Group heading="Go to" className={groupClass}>
            {[...mainNav, ...secondaryNav].map((item) => (
              <Command.Item
                key={item.href}
                value={`page ${item.label} ${item.description}`}
                onSelect={() => run(() => router.push(item.href))}
                className={itemClass}
              >
                <item.icon /> {item.label}
                <span className="ml-auto text-xs text-muted-foreground">{item.description}</span>
              </Command.Item>
            ))}
          </Command.Group>

          {assignments.length > 0 && (
            <Command.Group heading="Assignments and exams" className={groupClass}>
              {assignments.map((a) => (
                <Command.Item
                  key={a.id}
                  value={`assignment ${a.title} ${subjectName(a.subjectId) ?? ""} ${a.id}`}
                  onSelect={() => run(() => router.push(`/assignments?focus=${a.id}`))}
                  className={itemClass}
                >
                  <ListChecks /> {a.title}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {subjectName(a.subjectId)}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {notes.length > 0 && (
            <Command.Group heading="Notes" className={groupClass}>
              {notes.map((n) => (
                <Command.Item
                  key={n.id}
                  value={`note ${n.title} ${n.content.slice(0, 200)} ${n.id}`}
                  onSelect={() => run(() => router.push(`/notes?focus=${n.id}`))}
                  className={itemClass}
                >
                  <FileText /> {n.title}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {subjectName(n.subjectId)}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {subjects.length > 0 && (
            <Command.Group heading="Subjects" className={groupClass}>
              {subjects.map((s) => (
                <Command.Item
                  key={s.id}
                  value={`subject ${s.name} ${s.teacher ?? ""} ${s.id}`}
                  onSelect={() => run(() => router.push(`/timetable?subject=${s.id}`))}
                  className={itemClass}
                >
                  <BookOpen style={{ color: s.color }} /> {s.name}
                  <span className="ml-auto text-xs text-muted-foreground">{s.teacher}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Theme" className={groupClass}>
            <Command.Item value="theme light" onSelect={() => run(() => setTheme("light"))} className={itemClass}>
              <Sun /> Light theme
            </Command.Item>
            <Command.Item value="theme dark" onSelect={() => run(() => setTheme("dark"))} className={itemClass}>
              <Moon /> Dark theme
            </Command.Item>
            <Command.Item value="theme system" onSelect={() => run(() => setTheme("system"))} className={itemClass}>
              <Monitor /> System theme
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </PaletteContext>
  );
}

export function SearchButton() {
  const setOpen = useCommandPalette();
  return (
    <button
      onClick={() => setOpen(true)}
      className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground transition hover:bg-muted"
    >
      <Search className="size-4" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="hidden rounded border px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
    </button>
  );
}
