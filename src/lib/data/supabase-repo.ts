import type { SupabaseClient } from "@supabase/supabase-js";
import type { Collection, Repo } from "./repo";
import type { NewRecord, StudySession } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are converted to typed models generically */

type Row = Record<string, any>;

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

// Columns the app never reads or writes directly.
const HIDDEN = new Set(["user_id", "created_at"]);

function fromRow<T>(row: Row): T {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (HIDDEN.has(key)) continue;
    // Postgres "time" comes back as HH:MM:SS; the app uses HH:MM.
    out[toCamel(key)] =
      (key === "starts_at" || key === "ends_at") && typeof value === "string" ? value.slice(0, 5) : value;
  }
  return out as T;
}

function toRow(record: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) out[toSnake(key)] = value;
  }
  return out;
}

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

function collection<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  order: { column: string; ascending?: boolean }[],
): Collection<T> {
  return {
    async list() {
      let query = supabase.from(table).select("*");
      for (const o of order) query = query.order(o.column, { ascending: o.ascending ?? true });
      return check(await query).map((r: Row) => fromRow<T>(r));
    },
    async create(input: NewRecord<T>) {
      return fromRow<T>(check(await supabase.from(table).insert(toRow(input)).select().single()));
    },
    async update(id, patch) {
      return fromRow<T>(check(await supabase.from(table).update(toRow(patch)).eq("id", id).select().single()));
    },
    async remove(id) {
      check(await supabase.from(table).delete().eq("id", id));
    },
  };
}

/** Row level security scopes every query to the signed-in user. */
export function createSupabaseRepo(supabase: SupabaseClient): Repo {
  async function currentUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Not signed in");
    return data.user;
  }

  return {
    async getProfile() {
      const user = await currentUser();
      const profile = check(await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()) as Row | null;
      return {
        id: user.id,
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        email: user.email ?? null,
        reminderHours: profile?.reminder_hours ?? 24,
      };
    },
    async updateProfile(patch) {
      const user = await currentUser();
      check(await supabase.from("profiles").update(toRow(patch)).eq("id", user.id));
    },
    subjects: collection(supabase, "subjects", [{ column: "name" }]),
    timetable: collection(supabase, "timetable_entries", [{ column: "weekday" }, { column: "starts_at" }]),
    assignments: collection(supabase, "assignments", [{ column: "due_at" }]),
    notes: collection(supabase, "notes", [{ column: "updated_at", ascending: false }]),
    grades: collection(supabase, "grade_items", [{ column: "graded_on" }, { column: "created_at" }]),
    async listStudySessions(sinceIso) {
      const rows = check(
        await supabase
          .from("study_sessions")
          .select("*")
          .gte("started_at", sinceIso)
          .order("started_at", { ascending: false }),
      );
      return rows.map((r: Row) => fromRow<StudySession>(r));
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };
}
