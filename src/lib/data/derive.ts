import type { Assignment, StudySession, TimetableEntry } from "./types";

/** JS Date.getDay() has Sunday = 0; the app uses Monday = 0. */
export function weekdayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function todaysClasses(entries: TimetableEntry[], date = new Date()) {
  const day = weekdayIndex(date);
  return entries
    .filter((e) => e.weekday === day)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function minutesOfDay(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Open assignments due within `hours`, overdue ones included, soonest first. */
export function upcomingAssignments(list: Assignment[], hours: number, now = new Date()) {
  const limit = now.getTime() + hours * 3_600_000;
  return list
    .filter((a) => a.status !== "done" && new Date(a.dueAt).getTime() <= limit)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

/**
 * Consecutive days with at least one study session. A streak stays alive
 * through today if the student studied yesterday but not yet today.
 */
export function studyStreak(sessions: StudySession[], now = new Date()) {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.startedAt))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function startOfWeek(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - weekdayIndex(d));
  return d;
}

export function minutesSince(sessions: StudySession[], since: Date) {
  const iso = since.toISOString();
  return sessions.filter((s) => s.startedAt >= iso).reduce((sum, s) => sum + s.minutes, 0);
}
