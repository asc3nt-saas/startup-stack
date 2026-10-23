import type { GradeItem } from "@/lib/data/types";

export function itemPercent(item: GradeItem) {
  if (item.score === null || !item.maxScore) return null;
  return (item.score / item.maxScore) * 100;
}

const graded = (items: GradeItem[]) => items.filter((i) => itemPercent(i) !== null);

/** Weighted average of graded items, in percent. Null when nothing is graded yet. */
export function weightedAverage(items: GradeItem[]) {
  const done = graded(items);
  const weight = done.reduce((sum, i) => sum + i.weight, 0);
  if (!done.length || weight === 0) return null;
  return done.reduce((sum, i) => sum + i.weight * itemPercent(i)!, 0) / weight;
}

export function weightTotals(items: GradeItem[]) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  const done = graded(items).reduce((sum, i) => sum + i.weight, 0);
  return { total, graded: done, remaining: total - done };
}

/**
 * Average needed on the ungraded items to finish at `target` percent.
 * Null when nothing is left to grade.
 */
export function neededForTarget(items: GradeItem[], target: number) {
  const { total, remaining } = weightTotals(items);
  if (remaining <= 0) return null;
  const earned = graded(items).reduce((sum, i) => sum + i.weight * itemPercent(i)!, 0);
  return (target * total - earned) / remaining;
}

const SCALE: [number, string, number][] = [
  [93, "A", 4.0],
  [90, "A-", 3.7],
  [87, "B+", 3.3],
  [83, "B", 3.0],
  [80, "B-", 2.7],
  [77, "C+", 2.3],
  [73, "C", 2.0],
  [70, "C-", 1.7],
  [67, "D+", 1.3],
  [63, "D", 1.0],
  [60, "D-", 0.7],
  [0, "F", 0],
];

export function letterGrade(percent: number) {
  const [, letter, gpa] = SCALE.find(([min]) => percent >= min) ?? SCALE[SCALE.length - 1];
  return { letter, gpa };
}

export function gradeTone(percent: number | null) {
  if (percent === null) return "text-muted-foreground";
  if (percent >= 90) return "text-success";
  if (percent >= 75) return "text-primary";
  if (percent >= 60) return "text-warning";
  return "text-danger";
}
