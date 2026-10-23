import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Chat, Collection, Repo } from "./repo";
import type { ChatMember, ChatMessage, ChatRoom, NewRecord, Roadmap, RoadmapNode, StudySession } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are converted to typed models generically */

type Row = Record<string, any>;

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

// Columns most models don't expose. Chat messages keep them (author and time).
const HIDDEN = new Set(["user_id", "created_at"]);
const KEEP_ALL = new Set<string>();

function fromRow<T>(row: Row, hidden = HIDDEN): T {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (hidden.has(key)) continue;
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

function chat(supabase: SupabaseClient): Chat {
  const channels = new Map<string, { channel: RealtimeChannel; listeners: Set<(m: ChatMessage) => void> }>();
  const roomById = async (id: string) =>
    fromRow<ChatRoom>(check(await supabase.from("chat_rooms").select("*").eq("id", id).single()));

  return {
    async listRooms() {
      return check(await supabase.from("chat_rooms").select("*").order("created_at")).map((r: Row) =>
        fromRow<ChatRoom>(r),
      );
    },
    async createRoom(name) {
      return fromRow<ChatRoom>(check(await supabase.from("chat_rooms").insert({ name }).select().single()));
    },
    async joinRoom(code) {
      const id = check(await supabase.rpc("join_room", { code: code.trim().toLowerCase() })) as string;
      return roomById(id);
    },
    async leaveRoom(roomId) {
      const { data } = await supabase.auth.getUser();
      check(await supabase.from("chat_members").delete().eq("room_id", roomId).eq("user_id", data.user?.id ?? ""));
    },
    async listMembers(roomId) {
      const members = check(await supabase.from("chat_members").select("user_id").eq("room_id", roomId)) as Row[];
      const ids = members.map((m) => m.user_id);
      if (!ids.length) return [];
      const profiles = check(
        await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids),
      ) as Row[];
      return ids.map((id): ChatMember => {
        const p = profiles.find((x) => x.id === id);
        return { id, name: p?.full_name || "Student", avatarUrl: p?.avatar_url ?? null };
      });
    },
    async listMessages(roomId) {
      // Newest 200, shown oldest first.
      const rows = check(
        await supabase
          .from("chat_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(200),
      ) as Row[];
      return rows.reverse().map((r) => fromRow<ChatMessage>(r, KEEP_ALL));
    },
    async sendMessage(roomId, body) {
      return fromRow<ChatMessage>(
        check(await supabase.from("chat_messages").insert({ room_id: roomId, body }).select().single()),
        KEEP_ALL,
      );
    },
    subscribe(roomId, onMessage) {
      // One realtime channel per room, shared by every component that listens.
      let entry = channels.get(roomId);
      if (!entry) {
        const listeners = new Set<(m: ChatMessage) => void>();
        const channel = supabase
          .channel(`room:${roomId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
            (payload) => {
              const message = fromRow<ChatMessage>(payload.new as Row, KEEP_ALL);
              listeners.forEach((fn) => fn(message));
            },
          )
          .subscribe();
        entry = { channel, listeners };
        channels.set(roomId, entry);
      }
      entry.listeners.add(onMessage);
      return () => {
        const current = channels.get(roomId);
        if (!current) return;
        current.listeners.delete(onMessage);
        if (current.listeners.size === 0) {
          supabase.removeChannel(current.channel);
          channels.delete(roomId);
        }
      };
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
    decks: collection(supabase, "flashcard_decks", [{ column: "created_at" }]),
    cards: collection(supabase, "flashcards", [{ column: "created_at" }]),
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
    async addStudySession(session) {
      return fromRow<StudySession>(check(await supabase.from("study_sessions").insert(toRow(session)).select().single()));
    },
    chat: chat(supabase),
    roadmaps: collection(supabase, "roadmaps", [{ column: "created_at", ascending: false }]),
    roadmapNodes: collection(supabase, "roadmap_nodes", [{ column: "position" }]),
    async saveRoadmap(roadmap, lessons) {
      const saved = fromRow<Roadmap>(check(await supabase.from("roadmaps").insert(toRow(roadmap)).select().single()));
      const { error } = await supabase
        .from("roadmap_nodes")
        .insert(lessons.map((lesson) => toRow({ ...lesson, roadmapId: saved.id } satisfies NewRecord<RoadmapNode>)));
      if (error) {
        // Don't leave a roadmap without lessons behind.
        await supabase.from("roadmaps").delete().eq("id", saved.id);
        throw new Error(error.message);
      }
      return saved;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };
}
