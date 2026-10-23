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

export type GradeItem = {
  id: string;
  subjectId: string;
  name: string;
  category: string | null;
  score: number | null;
  maxScore: number;
  weight: number;
  gradedOn: string | null;
};

export type StudySession = {
  id: string;
  subjectId: string | null;
  startedAt: string;
  minutes: number;
};

/** Shape accepted when creating a record: everything the database doesn't generate. */
export type NewRecord<T extends { id: string }> = Omit<T, "id" | "updatedAt" | "createdAt">;

export type FlashcardDeck = {
  id: string;
  subjectId: string | null;
  title: string;
};

export type Flashcard = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  /** Spaced repetition state (SM-2 style). */
  ease: number;
  intervalDays: number;
  /** "YYYY-MM-DD": the day the card is next due. */
  dueOn: string;
};

export type ChatRoom = {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
};

export type ChatMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  body: string;
  createdAt: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  explanation: string;
};

export type Roadmap = {
  id: string;
  subjectId: string | null;
  title: string;
  /** Name of the uploaded file, or null for pasted text. */
  sourceName: string | null;
  summary: string;
  keyPoints: string[];
  /** Flashcards the AI suggested, turned into a deck on request. */
  cards: { front: string; back: string }[];
};

/** One lesson on a roadmap. */
export type RoadmapNode = {
  id: string;
  roadmapId: string;
  position: number;
  title: string;
  content: string;
  quiz: QuizQuestion[];
  xp: number;
  completedAt: string | null;
};

/** What the AI returns before anything is saved. */
export type GeneratedRoadmap = Omit<Roadmap, "id" | "subjectId" | "sourceName"> & {
  lessons: Pick<RoadmapNode, "title" | "content" | "quiz">[];
};
