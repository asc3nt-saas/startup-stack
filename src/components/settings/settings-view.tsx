"use client";

import { BookOpen, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { FormEvent } from "react";
import { SubjectsManager } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { isDemoMode } from "@/lib/config";
import { useProfile, useSubjects, useUpdateProfile } from "@/lib/data/hooks";
import { useIsHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

const REMINDER_OPTIONS = [
  [3, "3 hours before"],
  [12, "12 hours before"],
  [24, "1 day before"],
  [48, "2 days before"],
  [72, "3 days before"],
  [168, "1 week before"],
] as const;

export function SettingsView() {
  const { data: profile, isLoading } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const save = useUpdateProfile();
  const { theme: storedTheme, setTheme } = useTheme();
  // The saved theme is only known in the browser.
  const theme = useIsHydrated() ? storedTheme : undefined;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      fullName: String(form.get("fullName")).trim() || null,
      reminderHours: Number(form.get("reminderHours")),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isDemoMode ? "Demo mode: changes are saved in this browser." : profile?.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile and reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !profile ? (
            <Skeleton className="h-40" />
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Your name">
                <Input name="fullName" defaultValue={profile.fullName ?? ""} placeholder="Your name" />
              </Field>
              <Field label="Remind me about deadlines">
                <Select name="reminderHours" defaultValue={profile.reminderHours}>
                  {REMINDER_OPTIONS.map(([hours, label]) => (
                    <option key={hours} value={hours}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["system", "System", Monitor],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-sm transition",
                  theme === value ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
                )}
              >
                <Icon className="size-5" /> {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <SubjectsManager
            trigger={
              <Button variant="outline" size="sm">
                <BookOpen /> Manage
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span key={s.id} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
            {subjects.length === 0 && <p className="text-sm text-muted-foreground">No subjects yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
