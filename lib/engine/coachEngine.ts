import { AppState, CheckinEntry, ProgressionTip, WorkoutLog } from "@/lib/types";
import { SPLIT, DAY_NAMES } from "@/lib/data/workoutSplit";
import { FOOD_DB } from "@/lib/data/foodDatabase";
import { HABITS } from "@/lib/data/habits";
import { getExerciseMeta, MEASURE_FIELDS } from "@/lib/data/exerciseMeta";
import { todayKey, fmt, calcStreak } from "@/lib/utils";

/**
 * Rule-based, fully offline "AI Trainer" core. Kept independent of React and of the LLM
 * chat bridge (bottom of this file) on purpose — this layer works even with no network,
 * and would move into its own service/module if wearables or a backend get added later.
 */

export const GROUPS = ["chest", "back", "legs", "shoulders", "arms", "abs"] as const;
export type MuscleGroup = (typeof GROUPS)[number];

const RECOVERY_TARGET_HOURS: Record<MuscleGroup, number> = {
  chest: 48, back: 60, legs: 72, shoulders: 48, arms: 36, abs: 24,
};

function exerciseCompletedOn(dayLog: WorkoutLog | undefined, exId: string): boolean {
  return !!dayLog?.[exId]?.sets?.some((s) => s.completed);
}

export function lastTrainedDate(state: AppState, group: MuscleGroup): string | null {
  const dates = Object.keys(state.workoutLogs).sort().reverse();
  for (const key of dates) {
    const dayLog = state.workoutLogs[key];
    const trained = Object.keys(dayLog).some(
      (exId) => getExerciseMeta(exId)?.group === group && exerciseCompletedOn(dayLog, exId)
    );
    if (trained) return key;
  }
  return null;
}

export function recoveryScore(state: AppState, group: MuscleGroup, checkin?: CheckinEntry): number {
  const last = lastTrainedDate(state, group);
  if (!last) return 100;
  const hoursSince = (Date.now() - new Date(last).getTime()) / 36e5;
  const target = RECOVERY_TARGET_HOURS[group] || 48;
  let score = Math.min(100, Math.round((hoursSince / target) * 100));
  if (checkin) {
    if (checkin.hoursSlept != null && checkin.hoursSlept < 6) score -= 15;
    if (checkin.soreness != null) score -= checkin.soreness * 3;
  }
  return Math.max(0, Math.min(100, score));
}

export function weeklyVolume(state: AppState, days = 7): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dayLog = state.workoutLogs[todayKey(d)];
    if (!dayLog) continue;
    Object.values(dayLog).forEach((ex) =>
      (ex.sets || []).forEach((s) => { if (s.completed) total += (s.reps || 0) * (s.weight || 0); })
    );
  }
  return total;
}

export function consistencyScore(state: AppState, days = 7): number {
  let scheduled = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const split = SPLIT[d.getDay()];
    if (split.rest) continue;
    scheduled++;
    const dayLog = state.workoutLogs[todayKey(d)];
    if (dayLog && Object.keys(dayLog).some((exId) => exerciseCompletedOn(dayLog, exId))) done++;
  }
  return scheduled ? Math.round((done / scheduled) * 100) : 100;
}

function bestSetVolume(dayLog: WorkoutLog | undefined, exId: string): number {
  return Math.max(0, ...((dayLog?.[exId]?.sets || []).filter((s) => s.completed).map((s) => (s.reps || 0) * (s.weight || 0.0001))));
}

/**
 * Compares an exercise's last 3 sessions. Flags a plateau when volume hasn't meaningfully
 * moved, and otherwise recommends the concrete next step based on logged difficulty —
 * this is the "Smart Progression" feature surfaced on each Workout tab exercise card.
 */
export function suggestProgression(state: AppState, exId: string): ProgressionTip | null {
  const dates = Object.keys(state.workoutLogs).filter((k) => state.workoutLogs[k][exId]).sort();
  const recent = dates.slice(-3).map((k) => ({
    date: k,
    vol: bestSetVolume(state.workoutLogs[k], exId),
    diff: state.workoutLogs[k][exId].difficulty,
  }));
  if (recent.length === 0) return null;
  const last = recent[recent.length - 1];
  const meta = getExerciseMeta(exId);
  const name = meta?.name || exId;

  if (recent.length >= 3) {
    const spread = Math.max(...recent.map((r) => r.vol)) - Math.min(...recent.map((r) => r.vol));
    const plateaued = spread / (recent[0].vol || 1) < 0.08;
    if (plateaued && last.diff <= 5) {
      return { type: "plateau", text: `${name} volume has been flat for 3 sessions — try adding a rep per set, a slightly heavier backpack, or switch to a harder progression.` };
    }
  }
  if (last.diff != null && last.diff <= 4) {
    return { type: "progress", text: `${name} felt easy last time (difficulty ${last.diff}/10) — add reps, extra backpack weight, or move to the next progression.` };
  }
  if (last.diff != null && last.diff >= 8) {
    return { type: "deload", text: `${name} has felt very hard (difficulty ${last.diff}/10) — consider a deload: same movement, lighter load or fewer sets this week.` };
  }
  return { type: "on-track", text: `${name} is progressing at a good pace — keep the current sets/reps/load.` };
}

export function strengthTrend(state: AppState, exId: string) {
  const dates = Object.keys(state.workoutLogs).filter((k) => state.workoutLogs[k][exId]).sort();
  if (dates.length < 2) return null;
  const first = bestSetVolume(state.workoutLogs[dates[0]], exId);
  const last = bestSetVolume(state.workoutLogs[dates[dates.length - 1]], exId);
  return { first, last, deltaPct: first > 0 ? Math.round(((last - first) / first) * 100) : 0 };
}

export function proteinAverage(state: AppState, days = 7): number {
  let sum = 0, n = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const meals = state.meals[todayKey(d)];
    if (meals) { sum += meals.reduce((s, m) => s + m.protein, 0); n++; }
  }
  return n ? sum / n : 0;
}

export function nutritionGaps(state: AppState) {
  const today = todayKey();
  const meals = state.meals[today] || [];
  const totals = meals.reduce((a, m) => ({ cal: a.cal + m.cal, protein: a.protein + m.protein }), { cal: 0, protein: 0 });
  const proteinRemaining = Math.max(0, state.settings.proteinGoal - totals.protein);
  const suggestions = [...FOOD_DB].sort((a, b) => b.protein - a.protein).slice(0, 4);
  return { totals, proteinRemaining, suggestions };
}

export function checkinRecommendation(checkin?: CheckinEntry): string {
  if (!checkin) return "Log today's check-in so the coach can tailor today's session.";
  if (checkin.soreness >= 8 || checkin.energy <= 3) return "Soreness is high / energy is low — scale today back to a lighter session or active recovery (walk, stretch, mobility).";
  if (checkin.hoursSlept != null && checkin.hoursSlept < 6) return "Sleep was short last night — keep intensity moderate and prioritize form over pushing for PRs today.";
  if (checkin.motivation <= 3) return "Motivation is low today — that's normal. Even a shorter, easier version of the session keeps the streak alive.";
  return "Recovery signals look solid — a full-intensity session is reasonable today.";
}

export function weeklyAnalysisText(state: AppState) {
  const days = 7;
  const consistency = consistencyScore(state, days);
  const missed: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const split = SPLIT[d.getDay()];
    if (split.rest) continue;
    const dayLog = state.workoutLogs[todayKey(d)];
    const done = dayLog && Object.keys(dayLog).some((exId) => exerciseCompletedOn(dayLog, exId));
    if (!done) missed.push(DAY_NAMES[d.getDay()]);
  }
  const groupsTrained = new Set<string>();
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dayLog = state.workoutLogs[todayKey(d)];
    if (!dayLog) continue;
    Object.keys(dayLog).forEach((exId) => {
      if (exerciseCompletedOn(dayLog, exId)) {
        const g = getExerciseMeta(exId)?.group;
        if (g) groupsTrained.add(g);
      }
    });
  }
  const avgProtein = proteinAverage(state, days);
  const recommendations: string[] = [];
  if (consistency < 70) recommendations.push("Consistency dipped below 70% this week — try prepping your backpack/gear the night before to lower the barrier to starting.");
  if (avgProtein < state.settings.proteinGoal * 0.85) recommendations.push(`Average protein (${fmt(avgProtein)}g) is trailing your ${state.settings.proteinGoal}g goal — add a serving of dal, soybean chunks or curd to one more meal a day.`);
  GROUPS.forEach((g) => { if (!groupsTrained.has(g)) recommendations.push(`${g[0].toUpperCase()}${g.slice(1)} wasn't trained this week — it's on the schedule, don't skip it if you can help it.`); });
  if (recommendations.length === 0) recommendations.push("Strong week across the board — consistency, protein and muscle-group coverage are all on track. Keep it up.");
  return { consistency, missed, groupsTrained: [...groupsTrained], avgProtein, recommendations };
}

/* ---- Chat context builder --------------------------------------------------------
   Builds a compact summary of the user's own stored data so they never have to repeat
   themselves in chat. Sent to the /api/coach route, which is the only place that talks
   to the Anthropic API (server-side, keeps the API key off the client). */
export function buildContextSummary(state: AppState): string {
  const today = todayKey();
  const checkin = state.checkins[today];
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = todayKey(d);
    const split = SPLIT[d.getDay()];
    const dayLog = state.workoutLogs[key];
    const exSummary = dayLog
      ? Object.entries(dayLog)
          .filter(([, ex]) => ex.sets?.some((s) => s.completed))
          .map(([exId, ex]) => {
            const meta = getExerciseMeta(exId);
            const best = ex.sets.filter((s) => s.completed).map((s) => `${s.reps}x${s.weight}kg`).join(", ");
            return `${meta?.name || exId} (${best}, difficulty ${ex.difficulty}/10)`;
          })
          .join("; ")
      : split.rest ? "rest day" : "not logged";
    return `${DAY_NAMES[d.getDay()]} ${key}: ${split.rest ? "Rest day" : split.title} — ${exSummary}`;
  }).join("\n");

  const latestW = state.weightLog[state.weightLog.length - 1];
  const latestM = state.measurements[state.measurements.length - 1];
  const todayMeals = state.meals[today] || [];
  const todayTotals = todayMeals.reduce((a, m) => ({ cal: a.cal + m.cal, protein: a.protein + m.protein }), { cal: 0, protein: 0 });
  const activeHabitStreaks = HABITS.filter((h) => state.habits[today]?.[h.id]).map((h) => h.label);

  return `USER DATA (auto-loaded, do not ask the user to repeat this):
- Current workout streak: ${calcStreak(state.workoutLogs)} days
- Body weight: ${latestW ? `${latestW.kg} kg (logged ${latestW.date})` : "not logged yet"}
- Latest measurements: ${latestM ? MEASURE_FIELDS.filter((k) => (latestM[k] as number | undefined) != null).map((k) => `${k} ${(latestM[k] as number | undefined)}`).join(", ") : "none logged"}
- Progress photos: ${state.photos.length} logged (metadata only, most recent: ${state.photos[state.photos.length - 1]?.date || "none"})
- Today's nutrition: ${fmt(todayTotals.protein)}g protein / ${state.settings.proteinGoal}g goal, ${fmt(todayTotals.cal)} kcal / ${state.settings.calorieGoal} kcal goal
- 7-day average protein: ${fmt(proteinAverage(state, 7))}g/day
- Today's water: ${fmt((state.water[today] || 0) / 1000, 2)}L / ${state.settings.waterGoal / 1000}L goal
- Today's check-in: ${checkin ? `energy ${checkin.energy}/10, sleep quality ${checkin.sleepQuality}/10, ${checkin.hoursSlept}h slept, soreness ${checkin.soreness}/10, motivation ${checkin.motivation}/10` : "not filled in yet"}
- Active habit streaks today: ${activeHabitStreaks.join(", ") || "none yet today"}
- Weekly consistency: ${consistencyScore(state, 7)}%
- Last 7 days of training:
${last7}`;
}

export function buildCoachSystemPrompt(state: AppState): string {
  return `You are the AI Gym Trainer Agent inside "Aesthetic Body Tracker" — a bodyweight + backpack-based training app for a vegetarian user in Nepal working toward an aesthetic physique.

PERSONALITY: Encouraging but honest. Evidence-based — never exaggerate results or promise unrealistic outcomes. Always briefly explain the reasoning behind a recommendation. Prioritize long-term consistency over short-term intensity. Prioritize proper form and injury prevention above all else.

SAFETY RULES (non-negotiable):
- Distinguish normal muscle fatigue/soreness (expected, temporary, symmetric) from joint pain, sharp pain, or pain that persists beyond a couple of days (concerning).
- If the user reports pain — especially sharp, joint, or persistent pain — advise them to reduce or stop the aggravating exercise immediately, and recommend seeking in-person medical evaluation if the pain is severe, persistent, or looks like an injury. Do not attempt to diagnose.
- Never recommend pushing through joint pain "for gains."

SCOPE: You can discuss workouts, form, recovery, progression, plateaus, deloads, nutrition (vegetarian, with foods commonly available in Nepal), sleep, hydration, and habits — all using the user's real logged data below. Keep answers concise and mobile-friendly (short paragraphs or a few bullet points, not walls of text).

${buildContextSummary(state)}`;
}
