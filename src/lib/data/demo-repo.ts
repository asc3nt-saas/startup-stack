import { derivativesRoadmap } from "@/lib/ai/samples";
import type { Chat, Collection, Repo } from "./repo";
import type {
  Assignment,
  ChatMember,
  ChatMessage,
  ChatRoom,
  Flashcard,
  FlashcardDeck,
  GradeItem,
  NewRecord,
  Note,
  Profile,
  Roadmap,
  RoadmapNode,
  StudySession,
  Subject,
  TimetableEntry,
} from "./types";

const STORAGE_KEY = "studyhub-demo-v4";
const ME = "demo-user";

type DemoState = {
  profile: { fullName: string; reminderHours: number };
  subjects: Subject[];
  timetable: TimetableEntry[];
  assignments: Assignment[];
  notes: Note[];
  grades: GradeItem[];
  studySessions: StudySession[];
  decks: FlashcardDeck[];
  cards: Flashcard[];
  rooms: ChatRoom[];
  roomMembers: Record<string, string[]>;
  messages: ChatMessage[];
  roadmaps: Roadmap[];
  roadmapNodes: RoadmapNode[];
};

/** Pretend classmates so the chat feels alive in demo mode. */
const CLASSMATES: ChatMember[] = [
  { id: ME, name: "Demo Student", avatarUrl: null },
  { id: "mate-aziza", name: "Aziza Karimova", avatarUrl: null },
  { id: "mate-timur", name: "Timur Aliyev", avatarUrl: null },
  { id: "mate-lena", name: "Lena Novak", avatarUrl: null },
];

const DEMO_REPLIES = [
  "Good point! 👍",
  "Can someone share their notes from today?",
  "I'm free after 5, want to study together?",
  "Thanks, that helps a lot",
  "Has anyone started the problem set yet?",
  "Let's do a quick review session before the exam 📚",
];

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

/** A roadmap with the first two lessons done, so the path shows progress. */
function demoRoadmap(): Pick<DemoState, "roadmaps" | "roadmapNodes"> {
  const { lessons, ...roadmap } = derivativesRoadmap;
  return {
    roadmaps: [{ ...roadmap, id: "rm-calc", subjectId: "s-math", sourceName: "Lecture 5 - Derivatives.pdf" }],
    roadmapNodes: lessons.map((lesson, i) => ({
      ...lesson,
      id: `rn-${i}`,
      roadmapId: "rm-calc",
      position: i,
      xp: 10,
      completedAt: i < 2 ? daysFromNow(-3 + i, 18, 0) : null,
    })),
  };
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
    decks: [
      { id: "d-cs", subjectId: "s-cs", title: "HTTP and web basics" },
      { id: "d-hist", subjectId: "s-hist", title: "World War I dates" },
      { id: "d-eng", subjectId: "s-eng", title: "Vocabulary: Gatsby" },
    ],
    cards: (
      [
        ["d-cs", "What does HTTP 404 mean?", "Not Found: the server can't find the resource"],
        ["d-cs", "What does HTTP 201 mean?", "Created: a new resource was created"],
        ["d-cs", "Which HTTP method is idempotent: POST or PUT?", "PUT"],
        ["d-cs", "What does REST stand for?", "Representational State Transfer"],
        ["d-cs", "What port does HTTPS use by default?", "443"],
        ["d-hist", "When did World War I start?", "28 July 1914"],
        ["d-hist", "Which event triggered World War I?", "The assassination of Archduke Franz Ferdinand in Sarajevo"],
        ["d-hist", "When was the Armistice signed?", "11 November 1918"],
        ["d-hist", "Which treaty ended the war with Germany?", "The Treaty of Versailles (1919)"],
        ["d-eng", "Ostentatious", "Designed to impress or attract notice; showy"],
        ["d-eng", "Ephemeral", "Lasting for a very short time"],
        ["d-eng", "Nouveau riche", "People who have recently become rich, often seen as showy"],
      ] as const
    ).map(([deckId, front, back], i) => ({
      id: `c-${i}`,
      deckId,
      front,
      back,
      ease: 2.5,
      intervalDays: 0,
      dueOn: daysFromNow(0).slice(0, 10),
    })),
    rooms: [
      { id: "r-calc", name: "Calculus study group", inviteCode: "calc42", createdBy: "mate-aziza" },
      { id: "r-cs", name: "CS project team", inviteCode: "csteam", createdBy: ME },
    ],
    roomMembers: {
      "r-calc": [ME, "mate-aziza", "mate-timur", "mate-lena"],
      "r-cs": [ME, "mate-lena", "mate-timur"],
    },
    messages: (
      [
        ["r-calc", "mate-aziza", "Hey everyone! Midterm is next week, should we meet in the library?", 26],
        ["r-calc", "mate-timur", "Yes! Thursday after class works for me", 25],
        ["r-calc", ME, "Same here. I can bring my notes on integration by parts", 24],
        ["r-calc", "mate-lena", "Perfect, I'll book a room 🙌", 23],
        ["r-calc", "mate-aziza", "Does anyone understand question 7 on the problem set?", 2],
        ["r-cs", "mate-lena", "I pushed the login page, can you review it?", 5],
        ["r-cs", "mate-timur", "Looks good. I'll start on the API endpoints tonight", 4],
      ] as const
    ).map(([roomId, userId, body, hoursAgo], i) => ({
      id: `m-${i}`,
      roomId,
      userId,
      body,
      createdAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
    })),
    ...demoRoadmap(),
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

type CollectionKey =
  | "subjects"
  | "timetable"
  | "assignments"
  | "notes"
  | "grades"
  | "decks"
  | "cards"
  | "roadmaps"
  | "roadmapNodes";

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
        // A copy, so the query cache never holds the live array.
        return [...items()];
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
    decks: collection("decks"),
    cards: collection("cards"),
    async addStudySession(input) {
      const session = { ...input, id: crypto.randomUUID() };
      get().studySessions.push(session);
      save(get());
      return session;
    },
    chat: demoChat(get, () => save(get())),
    roadmaps: collection("roadmaps"),
    roadmapNodes: collection("roadmapNodes"),
    async saveRoadmap(input, lessons) {
      const roadmap = { ...input, id: crypto.randomUUID() };
      const s = get();
      // New arrays (not push) so cached query results see the change. Newest first, like the database query.
      s.roadmaps = [roadmap, ...s.roadmaps];
      s.roadmapNodes = [
        ...s.roadmapNodes,
        ...lessons.map((lesson) => ({ ...lesson, id: crypto.randomUUID(), roadmapId: roadmap.id })),
      ];
      save(s);
      return roadmap;
    },
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

function demoChat(get: () => DemoState, persist: () => void): Chat {
  const listeners = new Map<string, Set<(m: ChatMessage) => void>>();

  function post(roomId: string, userId: string, body: string) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      roomId,
      userId,
      body,
      createdAt: new Date().toISOString(),
    };
    get().messages.push(message);
    persist();
    listeners.get(roomId)?.forEach((fn) => fn(message));
    return message;
  }

  const room = (id: string) => {
    const found = get().rooms.find((r) => r.id === id);
    if (!found) throw new Error("Room not found");
    return found;
  };

  return {
    async listRooms() {
      return get().rooms.filter((r) => get().roomMembers[r.id]?.includes(ME));
    },
    async createRoom(name) {
      const created: ChatRoom = {
        id: crypto.randomUUID(),
        name,
        inviteCode: Math.random().toString(16).slice(2, 8),
        createdBy: ME,
      };
      get().rooms.push(created);
      get().roomMembers[created.id] = [ME];
      persist();
      return created;
    },
    async joinRoom(code) {
      const found = get().rooms.find((r) => r.inviteCode === code.trim().toLowerCase());
      if (!found) throw new Error("Invalid invite code");
      const members = (get().roomMembers[found.id] ??= []);
      if (!members.includes(ME)) members.push(ME);
      persist();
      return found;
    },
    async leaveRoom(roomId) {
      const s = get();
      s.roomMembers[roomId] = (s.roomMembers[roomId] ?? []).filter((id) => id !== ME);
      persist();
    },
    async listMembers(roomId) {
      room(roomId);
      return (get().roomMembers[roomId] ?? []).map(
        (id) => CLASSMATES.find((c) => c.id === id) ?? { id, name: "Student", avatarUrl: null },
      );
    },
    async listMessages(roomId) {
      return get().messages.filter((m) => m.roomId === roomId);
    },
    async sendMessage(roomId, body) {
      const message = post(roomId, ME, body);
      // A classmate "types" a reply so the demo shows live updates.
      const others = (get().roomMembers[roomId] ?? []).filter((id) => id !== ME);
      if (others.length) {
        const from = others[Math.floor(Math.random() * others.length)];
        const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
        setTimeout(() => post(roomId, from, reply), 1500 + Math.random() * 1500);
      }
      return message;
    },
    subscribe(roomId, onMessage) {
      const set = listeners.get(roomId) ?? new Set();
      set.add(onMessage);
      listeners.set(roomId, set);
      return () => set.delete(onMessage);
    },
  };
}
