"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useIsHydrated } from "@/lib/use-hydrated";
import { getRepo } from "./index";
import type { Collection, ProfilePatch, Repo } from "./repo";
import type { AssignmentStatus, ChatMessage, NewRecord, StudySession } from "./types";

type CollectionKey = "subjects" | "timetable" | "assignments" | "notes" | "grades" | "decks" | "cards";
type Item<K extends CollectionKey> = Repo[K] extends Collection<infer T> ? T : never;

export const queryKeys = {
  profile: ["profile"] as const,
  subjects: ["subjects"] as const,
  timetable: ["timetable"] as const,
  assignments: ["assignments"] as const,
  notes: ["notes"] as const,
  grades: ["grades"] as const,
  decks: ["decks"] as const,
  cards: ["cards"] as const,
  rooms: ["rooms"] as const,
  members: (roomId: string) => ["members", roomId] as const,
  messages: (roomId: string) => ["messages", roomId] as const,
  studySessions: (since: string) => ["studySessions", since] as const,
};

const collection = <K extends CollectionKey>(key: K) =>
  getRepo()[key] as unknown as Collection<Item<K>>;

/**
 * Data lives in the browser (demo storage or the Supabase client), so the
 * server always renders the loading state. Some parts of a page hydrate after
 * a query has already resolved, so hide data until hydration is done to keep
 * the first client render identical to the server HTML.
 */
function useHydrated<T>(result: UseQueryResult<T>): UseQueryResult<T> {
  const hydrated = useIsHydrated();
  return hydrated ? result : ({ ...result, data: undefined, isLoading: true } as UseQueryResult<T>);
}

function useList<K extends CollectionKey>(key: K) {
  return useHydrated(useQuery({ queryKey: queryKeys[key], queryFn: () => collection(key).list() }));
}

export const useSubjects = () => useList("subjects");
export const useTimetable = () => useList("timetable");
export const useAssignments = () => useList("assignments");
export const useNotes = () => useList("notes");
export const useGrades = () => useList("grades");
export const useDecks = () => useList("decks");
export const useCards = () => useList("cards");

export const useProfile = () =>
  useHydrated(useQuery({ queryKey: queryKeys.profile, queryFn: () => getRepo().getProfile() }));

/** Pass null to wait (for example until the client knows the current time). */
export const useStudySessions = (sinceIso: string | null) =>
  useHydrated(
    useQuery({
      queryKey: queryKeys.studySessions(sinceIso ?? ""),
      queryFn: () => getRepo().listStudySessions(sinceIso!),
      enabled: sinceIso !== null,
    }),
  );

/**
 * Create, update and remove for one collection. Updates and removals apply to
 * the cached list immediately and roll back if the server refuses them, so
 * the UI never waits on the network.
 */
export function useMutations<K extends CollectionKey>(key: K) {
  type T = Item<K>;
  const qc = useQueryClient();
  const queryKey: readonly string[] = queryKeys[key];

  async function optimistic(change: (list: T[]) => T[]) {
    await qc.cancelQueries({ queryKey });
    const previous = qc.getQueryData<T[]>(queryKey);
    qc.setQueryData<T[]>(queryKey, (list) => change(list ?? []));
    return { previous };
  }

  const shared = {
    onError: (error: Error, _vars: unknown, ctx?: { previous?: T[] }) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
      toast.error(error.message || "Something went wrong");
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  };

  const create = useMutation({
    mutationFn: (input: NewRecord<T>) => collection(key).create(input),
    onSuccess: (record: T) => qc.setQueryData<T[]>(queryKey, (list) => [...(list ?? []), record]),
    ...shared,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewRecord<T>> }) =>
      collection(key).update(id, patch),
    onMutate: ({ id, patch }) =>
      optimistic((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item))),
    ...shared,
  });

  const remove = useMutation({
    mutationFn: (id: string) => collection(key).remove(id),
    onMutate: (id) => optimistic((list) => list.filter((item) => item.id !== id)),
    ...shared,
  });

  return { create, update, remove };
}

export function useSetAssignmentStatus() {
  const { update } = useMutations("assignments");
  return {
    ...update,
    mutate: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      update.mutate({ id, patch: { status } }),
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => getRepo().updateProfile(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile });
      toast.success("Settings saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (session: NewRecord<StudySession>) => getRepo().addStudySession(session),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studySessions"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export const useRooms = () =>
  useHydrated(useQuery({ queryKey: queryKeys.rooms, queryFn: () => getRepo().chat.listRooms() }));

export const useRoomMembers = (roomId: string | null) =>
  useQuery({
    queryKey: queryKeys.members(roomId ?? ""),
    queryFn: () => getRepo().chat.listMembers(roomId!),
    enabled: roomId !== null,
  });

/** Messages for a room, kept live by a realtime subscription. */
export function useRoomMessages(roomId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.messages(roomId ?? ""),
    queryFn: () => getRepo().chat.listMessages(roomId!),
    enabled: roomId !== null,
  });

  useEffect(() => {
    if (!roomId) return;
    return getRepo().chat.subscribe(roomId, (message) => {
      qc.setQueryData<ChatMessage[]>(queryKeys.messages(roomId), (list = []) =>
        list.some((m) => m.id === message.id) ? list : [...list, message],
      );
      // A new face in the room: refresh the member list for their name.
      const members = qc.getQueryData<{ id: string }[]>(queryKeys.members(roomId));
      if (members && !members.some((m) => m.id === message.userId)) {
        qc.invalidateQueries({ queryKey: queryKeys.members(roomId) });
      }
    });
  }, [roomId, qc]);

  return query;
}

export function useSendMessage(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => getRepo().chat.sendMessage(roomId, body),
    onSuccess: (message) =>
      qc.setQueryData<ChatMessage[]>(queryKeys.messages(roomId), (list = []) =>
        list.some((m) => m.id === message.id) ? list : [...list, message],
      ),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRoomActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.rooms });
  const onError = (error: Error) => toast.error(error.message);
  return {
    create: useMutation({ mutationFn: (name: string) => getRepo().chat.createRoom(name), onSuccess: refresh, onError }),
    join: useMutation({ mutationFn: (code: string) => getRepo().chat.joinRoom(code), onSuccess: refresh, onError }),
    leave: useMutation({ mutationFn: (roomId: string) => getRepo().chat.leaveRoom(roomId), onSuccess: refresh, onError }),
  };
}
