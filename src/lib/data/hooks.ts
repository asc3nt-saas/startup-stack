"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRepo } from "./index";
import type { Assignment, AssignmentStatus } from "./types";

export const queryKeys = {
  profile: ["profile"] as const,
  subjects: ["subjects"] as const,
  timetable: ["timetable"] as const,
  assignments: ["assignments"] as const,
  notes: ["notes"] as const,
  studySessions: (since: string) => ["studySessions", since] as const,
};

export const useProfile = () =>
  useQuery({ queryKey: queryKeys.profile, queryFn: () => getRepo().getProfile() });

export const useSubjects = () =>
  useQuery({ queryKey: queryKeys.subjects, queryFn: () => getRepo().listSubjects() });

export const useTimetable = () =>
  useQuery({ queryKey: queryKeys.timetable, queryFn: () => getRepo().listTimetable() });

export const useAssignments = () =>
  useQuery({ queryKey: queryKeys.assignments, queryFn: () => getRepo().listAssignments() });

export const useNotes = () =>
  useQuery({ queryKey: queryKeys.notes, queryFn: () => getRepo().listNotes() });

/** Pass null to wait (for example until the client knows the current time). */
export const useStudySessions = (sinceIso: string | null) =>
  useQuery({
    queryKey: queryKeys.studySessions(sinceIso ?? ""),
    queryFn: () => getRepo().listStudySessions(sinceIso!),
    enabled: sinceIso !== null,
  });

/** Optimistically flips an assignment's status so the checkbox feels instant. */
export function useSetAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      getRepo().setAssignmentStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.assignments });
      const previous = qc.getQueryData<Assignment[]>(queryKeys.assignments);
      qc.setQueryData<Assignment[]>(queryKeys.assignments, (list) =>
        list?.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.assignments, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.assignments }),
  });
}
