"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { useIsHydrated } from "@/lib/use-hydrated";
import { getRepo } from "./index";
import type { Collection, ProfilePatch, Repo } from "./repo";
import type { AssignmentStatus, NewRecord } from "./types";

type CollectionKey = "subjects" | "timetable" | "assignments" | "notes" | "grades";
type Item<K extends CollectionKey> = Repo[K] extends Collection<infer T> ? T : never;

export const queryKeys = {
  profile: ["profile"] as const,
  subjects: ["subjects"] as const,
  timetable: ["timetable"] as const,
  assignments: ["assignments"] as const,
  notes: ["notes"] as const,
  grades: ["grades"] as const,
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
