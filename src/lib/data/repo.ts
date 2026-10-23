import type {
  Assignment,
  AssignmentStatus,
  Note,
  Profile,
  StudySession,
  Subject,
  TimetableEntry,
} from "./types";

/**
 * Every read and write in the app goes through this interface. Swapping the
 * backend (Supabase today, something else later) means writing one new
 * implementation of it, not touching the UI.
 */
export interface Repo {
  getProfile(): Promise<Profile>;
  listSubjects(): Promise<Subject[]>;
  listTimetable(): Promise<TimetableEntry[]>;
  listAssignments(): Promise<Assignment[]>;
  setAssignmentStatus(id: string, status: AssignmentStatus): Promise<void>;
  listNotes(): Promise<Note[]>;
  listStudySessions(sinceIso: string): Promise<StudySession[]>;
  signOut(): Promise<void>;
}
