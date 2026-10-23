import { differenceInCalendarDays, format, formatDistanceToNowStrict, isPast } from "date-fns";

/** "Overdue", "Today 23:00", "Tomorrow 10:00", "Fri 23:59", "12 Nov" */
export function formatDue(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (isPast(date)) return `Overdue · ${formatDistanceToNowStrict(date)} ago`;
  const days = differenceInCalendarDays(date, now);
  if (days === 0) return `Today ${format(date, "HH:mm")}`;
  if (days === 1) return `Tomorrow ${format(date, "HH:mm")}`;
  if (days < 7) return format(date, "EEE HH:mm");
  return format(date, "d MMM");
}

export function dueTone(iso: string, now = new Date()) {
  const hours = (new Date(iso).getTime() - now.getTime()) / 3_600_000;
  if (hours < 0) return "danger" as const;
  if (hours < 24) return "warning" as const;
  return "muted" as const;
}
