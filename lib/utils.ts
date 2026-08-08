import { AppState, WorkoutLog } from "@/lib/types";
import { SPLIT } from "@/lib/data/workoutSplit";

export const todayKey = (d: Date = new Date()): string => d.toISOString().slice(0, 10);

export const fmt = (n: number, d = 0): string => (isNaN(n) ? "0" : Number(n).toFixed(d));

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export const emptyState = (): AppState => ({
  settings: { theme: "dark", proteinGoal: 100, calorieGoal: 2200, waterGoal: 3000, bottleSize: 500, units: "metric" },
  weightLog: [],
  measurements: [],
  meals: {},
  water: {},
  workoutLogs: {},
  habits: {},
  photos: [],
  checkins: {},
  chatHistory: [],
  xp: 0,
});

function hasCompletedWorkout(dayLog: WorkoutLog | undefined): boolean {
  if (!dayLog) return false;
  return Object.values(dayLog).some((ex) => ex.sets?.some((s) => s.completed));
}

export function calcStreak(workoutLogs: Record<string, WorkoutLog>): number {
  let streak = 0;
  const d = new Date();
  if (!hasCompletedWorkout(workoutLogs[todayKey(d)])) d.setDate(d.getDate() - 1);
  while (true) {
    const key = todayKey(d);
    const day = d.getDay();
    if (SPLIT[day].rest) { d.setDate(d.getDate() - 1); continue; }
    if (hasCompletedWorkout(workoutLogs[key])) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}
