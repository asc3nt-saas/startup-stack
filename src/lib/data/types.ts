export type Profile = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  reminderHours: number;
};

export type Subject = {
  id: string;
  name: string;
  color: string;
  teacher: string | null;
  room: string | null;
};

export type TimetableEntry = {
  id: string;
  subjectId: string;
  /** 0 = Monday ... 6 = Sunday */
  weekday: number;
  /** "HH:MM" */
  startsAt: string;
  endsAt: string;
  room: string | null;
  kind: string;
};

export type AssignmentKind = "assignment" | "exam" | "quiz" | "project";
export type AssignmentStatus = "todo" | "in_progress" | "done";

export type Assignment = {
  id: string;
  subjectId: string | null;
  title: string;
  description: string | null;
  kind: AssignmentKind;
  dueAt: string;
  priority: 1 | 2 | 3;
  status: AssignmentStatus;
};

export type Note = {
  id: string;
  subjectId: string | null;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
};

export type StudySession = {
  id: string;
  subjectId: string | null;
  startedAt: string;
  minutes: number;
};

export type SearchResult = {
  id: string;
  type: "assignment" | "note" | "subject";
  title: string;
  subtitle?: string;
  href: string;
};
