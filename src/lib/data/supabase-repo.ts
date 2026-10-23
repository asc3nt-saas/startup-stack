import type { SupabaseClient } from "@supabase/supabase-js";
import type { Repo } from "./repo";
import type {
  Assignment,
  Note,
  StudySession,
  Subject,
  TimetableEntry,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped to typed models below */

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

const toSubject = (r: any): Subject => ({
  id: r.id,
  name: r.name,
  color: r.color,
  teacher: r.teacher,
  room: r.room,
});

const toTimetableEntry = (r: any): TimetableEntry => ({
  id: r.id,
  subjectId: r.subject_id,
  weekday: r.weekday,
  startsAt: String(r.starts_at).slice(0, 5),
  endsAt: String(r.ends_at).slice(0, 5),
  room: r.room,
  kind: r.kind,
});

const toAssignment = (r: any): Assignment => ({
  id: r.id,
  subjectId: r.subject_id,
  title: r.title,
  description: r.description,
  kind: r.kind,
  dueAt: r.due_at,
  priority: r.priority,
  status: r.status,
});

const toNote = (r: any): Note => ({
  id: r.id,
  subjectId: r.subject_id,
  title: r.title,
  content: r.content,
  pinned: r.pinned,
  updatedAt: r.updated_at,
});

const toStudySession = (r: any): StudySession => ({
  id: r.id,
  subjectId: r.subject_id,
  startedAt: r.started_at,
  minutes: r.minutes,
});

/** Row level security scopes every query to the signed-in user. */
export function createSupabaseRepo(supabase: SupabaseClient): Repo {
  return {
    async getProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Not signed in");
      const profile = check(
        await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ) as any;
      return {
        id: user.id,
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        email: user.email ?? null,
        reminderHours: profile?.reminder_hours ?? 24,
      };
    },
    async listSubjects() {
      return check(await supabase.from("subjects").select("*").order("name")).map(toSubject);
    },
    async listTimetable() {
      return check(
        await supabase.from("timetable_entries").select("*").order("weekday").order("starts_at"),
      ).map(toTimetableEntry);
    },
    async listAssignments() {
      return check(await supabase.from("assignments").select("*").order("due_at")).map(
        toAssignment,
      );
    },
    async setAssignmentStatus(id, status) {
      check(await supabase.from("assignments").update({ status }).eq("id", id));
    },
    async listNotes() {
      return check(
        await supabase.from("notes").select("*").order("updated_at", { ascending: false }),
      ).map(toNote);
    },
    async listStudySessions(sinceIso) {
      return check(
        await supabase
          .from("study_sessions")
          .select("*")
          .gte("started_at", sinceIso)
          .order("started_at", { ascending: false }),
      ).map(toStudySession);
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };
}
