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

/** Create, read, update and delete for one kind of record. */
export interface Collection<T extends { id: string }> {
  list(): Promise<T[]>;
  create(input: NewRecord<T>): Promise<T>;
  update(id: string, patch: Partial<NewRecord<T>>): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface Chat {
  listRooms(): Promise<ChatRoom[]>;
  createRoom(name: string): Promise<ChatRoom>;
  /** Joins by invite code and returns the room. */
  joinRoom(code: string): Promise<ChatRoom>;
  leaveRoom(roomId: string): Promise<void>;
  listMembers(roomId: string): Promise<ChatMember[]>;
  listMessages(roomId: string): Promise<ChatMessage[]>;
  sendMessage(roomId: string, body: string): Promise<ChatMessage>;
  /** Calls `onMessage` for every new message in the room. Returns an unsubscribe function. */
  subscribe(roomId: string, onMessage: (message: ChatMessage) => void): () => void;
}

export type ProfilePatch = Partial<Pick<Profile, "fullName" | "reminderHours">>;

/**
 * Every read and write in the app goes through this interface. Swapping the
 * backend (Supabase today, something else later) means writing one new
 * implementation of it, not touching the UI.
 */
export interface Repo {
  getProfile(): Promise<Profile>;
  updateProfile(patch: ProfilePatch): Promise<void>;
  subjects: Collection<Subject>;
  timetable: Collection<TimetableEntry>;
  assignments: Collection<Assignment>;
  notes: Collection<Note>;
  grades: Collection<GradeItem>;
  decks: Collection<FlashcardDeck>;
  cards: Collection<Flashcard>;
  listStudySessions(sinceIso: string): Promise<StudySession[]>;
  addStudySession(session: NewRecord<StudySession>): Promise<StudySession>;
  chat: Chat;
  roadmaps: Collection<Roadmap>;
  roadmapNodes: Collection<RoadmapNode>;
  /** Saves a generated roadmap and its lessons in one go. */
  saveRoadmap(roadmap: NewRecord<Roadmap>, lessons: Omit<NewRecord<RoadmapNode>, "roadmapId">[]): Promise<Roadmap>;
  signOut(): Promise<void>;
}
