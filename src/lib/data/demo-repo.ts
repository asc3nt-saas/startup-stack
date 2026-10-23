import type { Collection, Repo } from "./repo";
import type {
  Assignment,
  GradeItem,
  NewRecord,
  Note,
  Profile,
  StudySession,
  Subject,
  TimetableEntry,
} from "./types";

const STORAGE_KEY = "studyhub-demo-v2";

type DemoState = {
  profile: { fullName: string; reminderHours: number };
  subjects: Subject[];
  timetable: TimetableEntry[];
  assignments: Assignment[];
  notes: Note[];
  grades: GradeItem[];
  studySessions: StudySession[];
};

const subjects: Subject[] = [
  { id: "s-math", name: "Calculus", color: "#6366f1", teacher: "Dr. Karimova", room: "B204" },
  { id: "s-phys", name: "Physics", color: "#0ea5e9", teacher: "Mr. Lee", room: "Lab 3" },
  { id: "s-cs", name: "Computer Science", color: "#10b981", teacher: "Ms. Novak", room: "C110" },
  { id: "s-eng", name: "English", color: "#f59e0b", teacher: "Mrs. Brown", room: "A015" },
  { id: "s-hist", name: "History", color: "#ef4444", teacher: "Mr. Aliyev", room: "A102" },
];

function daysFromNow(days: number, hour = 23, minute = 59) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seed(): DemoState {
  const slots: [string, number, string, string, string][] = [
    ["s-math", 0, "09:00", "10:30", "lecture"],
    ["s-cs", 0, "11:00", "12:30", "lab"],
    ["s-eng", 0, "14:00", "15:00", "seminar"],
    ["s-phys", 1, "09:00", "10:30", "lecture"],
    ["s-hist", 1, "11:00", "12:00", "lecture"],
    ["s-math", 2, "09:00", "10:30", "seminar"],
    ["s-cs", 2, "13:00", "14:30", "lecture"],
    ["s-phys", 3, "10:00", "11:30", "lab"],
    ["s-eng", 3, "13:00", "14:00", "lecture"],
    ["s-hist", 4, "09:00", "10:00", "seminar"],
    ["s-cs", 4, "10:30", "12:00", "lab"],
    ["s-math", 5, "10:00", "11:00", "tutorial"],
  ];

  const grade = (
    subjectId: string,
    name: string,
    category: string,
    score: number | null,
    maxScore: number,
    weight: number,
    daysAgo: number,
  ): Omit<GradeItem, "id"> => ({
    subjectId,
    name,
    category,
    score,
    maxScore,
    weight,
    gradedOn: score === null ? null : daysFromNow(-daysAgo).slice(0, 10),
  });

  return {
    profile: { fullName: "Demo Student", reminderHours: 24 },
    subjects,
    grades: [
      grade("s-math", "Homework 1", "Homework", 18, 20, 10, 40),
      grade("s-math", "Homework 2", "Homework", 16, 20, 10, 26),
      grade("s-math", "Quiz 1", "Quiz", 42, 50, 15, 20),
      grade("s-math", "Midterm", "Exam", 71, 100, 25, 9),
      grade("s-math", "Final exam", "Exam", null, 100, 40, 0),
      grade("s-phys", "Lab report 1", "Lab", 27, 30, 15, 30),
      grade("s-phys", "Lab report 2", "Lab", 25, 30, 15, 16),
      grade("s-phys", "Midterm", "Exam", null, 100, 30, 0),
      grade("s-cs", "Assignment 1", "Project", 95, 100, 20, 35),
      grade("s-cs", "Assignment 2", "Project", 88, 100, 20, 14),
      grade("s-eng", "Essay 1", "Essay", 84, 100, 30, 21),
      grade("s-hist", "Quiz 1", "Quiz", 7, 10, 20, 12),
    ].map((g, i) => ({ ...g, id: `g-${i}` })),
    timetable: slots.map(([subjectId, weekday, startsAt, endsAt, kind], i) => ({
      id: `t-${i}`,
      subjectId,
      weekday,
      startsAt,
      endsAt,
      kind,
      room: subjects.find((s) => s.id === subjectId)?.room ?? null,
    })),
    assignments: [
      { id: "a-1", subjectId: "s-math", title: "Problem set 4: integrals", description: null, kind: "assignment", dueAt: daysFromNow(0, 23, 0), priority: 3, status: "in_progress" },
      { id: "a-2", subjectId: "s-phys", title: "Midterm exam", description: "Chapters 1 to 5", kind: "exam", dueAt: daysFromNow(2, 10, 0), priority: 3, status: "todo" },
      { id: "a-3", subjectId: "s-cs", title: "Build a REST API", description: null, kind: "project", dueAt: daysFromNow(5), priority: 2, status: "todo" },
      { id: "a-4", subjectId: "s-eng", title: "Essay draft: The Great Gatsby", description: null, kind: "assignment", dueAt: daysFromNow(1), priority: 2, status: "todo" },
      { id: "a-5", subjectId: "s-hist", title: "Quiz: World War I", description: null, kind: "quiz", dueAt: daysFromNow(4, 11, 0), priority: 1, status: "todo" },
      { id: "a-6", subjectId: "s-cs", title: "Lab report 2", description: null, kind: "assignment", dueAt: daysFromNow(-1), priority: 2, status: "done" },
    ],
    notes: [
      { id: "n-1", subjectId: "s-math", title: "Integration by parts", content: "∫u dv = uv − ∫v du. Pick u with LIATE.", pinned: true, updatedAt: daysFromNow(-1, 18, 0) },
      { id: "n-2", subjectId: "s-phys", title: "Newton's laws summary", content: "1. Inertia 2. F = ma 3. Action = reaction", pinned: false, updatedAt: daysFromNow(-2, 20, 0) },
      { id: "n-3", subjectId: "s-cs", title: "HTTP status codes", content: "200 OK, 201 Created, 400 Bad Request, 401, 404, 500", pinned: false, updatedAt: daysFromNow(-3, 16, 0) },
    ],
    // A study streak ending yesterday, so the Today view has something to show.
    studySessions: [1, 2, 3, 4, 5, 7].map((ago, i) => ({
      id: `ss-${i}`,
      subjectId: subjects[i % subjects.length].id,
      startedAt: daysFromNow(-ago, 19, 0),
      minutes: [25, 50, 45, 30, 60, 25][i],
    })),
  };
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    // Private mode or corrupted data: fall back to fresh demo data.
  }
  const state = seed();
  save(state);
  return state;
}

function save(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable; demo data stays in memory for this visit.
  }
}

type CollectionKey = "subjects" | "timetable" | "assignments" | "notes" | "grades";

export function createDemoRepo(): Repo {
  let state: DemoState | undefined;
  const get = () => (state ??= load());

  function collection<K extends CollectionKey>(key: K): Collection<DemoState[K][number]> {
    type T = DemoState[K][number];
    const items = () => get()[key] as T[];
    const write = (next: T[]) => {
      (get()[key] as T[]) = next;
      save(get());
    };
    const stamp = (record: T) => (key === "notes" ? { ...record, updatedAt: new Date().toISOString() } : record);

    return {
      async list() {
        return items();
      },
      async create(input: NewRecord<T>) {
        const record = stamp({ ...input, id: crypto.randomUUID() } as T);
        write([...items(), record]);
        return record;
      },
      async update(id, patch) {
        let updated: T | undefined;
        write(
          items().map((item) => {
            if (item.id !== id) return item;
            updated = stamp({ ...item, ...patch } as T);
            return updated;
          }),
        );
        if (!updated) throw new Error("Not found");
        return updated;
      },
      async remove(id) {
        write(items().filter((item) => item.id !== id));
      },
    };
  }

  return {
    async getProfile(): Promise<Profile> {
      const { fullName, reminderHours } = get().profile;
      return { id: "demo-user", fullName, avatarUrl: null, email: "demo@studyhub.app", reminderHours };
    },
    async updateProfile(patch) {
      const s = get();
      s.profile = {
        fullName: patch.fullName ?? s.profile.fullName,
        reminderHours: patch.reminderHours ?? s.profile.reminderHours,
      };
      save(s);
    },
    subjects: collection("subjects"),
    timetable: collection("timetable"),
    assignments: collection("assignments"),
    notes: collection("notes"),
    grades: collection("grades"),
    async listStudySessions(sinceIso) {
      return get().studySessions.filter((s) => s.startedAt >= sinceIso);
    },
    async signOut() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      state = undefined;
    },
  };
}
