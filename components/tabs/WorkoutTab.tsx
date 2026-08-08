"use client";

import React, { useState } from "react";
import { Check, Plus, Trophy } from "lucide-react";
import { AppState, ExerciseLogEntry, WorkoutSet } from "@/lib/types";
import { Card, ACCENT } from "@/components/ui/Primitives";
import { SPLIT, DAY_NAMES } from "@/lib/data/workoutSplit";
import { getExerciseMeta } from "@/lib/data/exerciseMeta";
import { todayKey, fmt } from "@/lib/utils";
import { suggestProgression } from "@/lib/engine/coachEngine";

export default function WorkoutTab({
  state, setState, theme,
}: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; theme: "dark" | "light" }) {
  const [dayOffset, setDayOffset] = useState(0);
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const d = new Date(); d.setDate(d.getDate() + dayOffset);
  const key = todayKey(d);
  const dow = d.getDay();
  const split = SPLIT[dow];
  const log = state.workoutLogs[key] || {};

  const updateExercise = (exId: string, patch: Partial<ExerciseLogEntry>) => {
    setState((s) => {
      const dayLog = { ...(s.workoutLogs[key] || {}) };
      const ex: ExerciseLogEntry = dayLog[exId] || { sets: [], difficulty: 5, notes: "" };
      dayLog[exId] = { ...ex, ...patch };
      return { ...s, workoutLogs: { ...s.workoutLogs, [key]: dayLog } };
    });
  };

  const addSet = (exId: string) => {
    const ex = log[exId] || { sets: [], difficulty: 5, notes: "" };
    updateExercise(exId, { sets: [...ex.sets, { reps: 10, weight: 0, completed: false }] });
  };
  const updateSet = (exId: string, idx: number, patch: Partial<WorkoutSet>) => {
    const ex = log[exId] || { sets: [] as WorkoutSet[] };
    const sets = ex.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    updateExercise(exId, { sets });
  };

  const volumeFor = (exId: string) => (log[exId]?.sets || []).reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0), 0);
  const calFor = (exId: string) => (log[exId]?.sets || []).reduce((sum, s) => sum + (s.completed ? (s.reps || 0) * 0.4 : 0), 0);

  const totalVolume = split.exercises.reduce((s, ex) => s + volumeFor(ex.id), 0);
  const totalCal = split.exercises.reduce((s, ex) => s + calFor(ex.id), 0);

  const bestSet = (exId: string) => {
    let best = 0;
    Object.values(state.workoutLogs).forEach((dl) => {
      (dl[exId]?.sets || []).forEach((s) => { if (s.completed) best = Math.max(best, (s.reps || 0) * (s.weight || 0.001)); });
    });
    return best;
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Workout</h1>
        <div className="flex gap-1.5">
          <button onClick={() => setDayOffset((o) => o - 1)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>◀</button>
          <button onClick={() => setDayOffset(0)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>Today</button>
          <button onClick={() => setDayOffset((o) => o + 1)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>▶</button>
        </div>
      </div>

      <Card theme={theme}>
        <p className="text-xs text-neutral-400">{DAY_NAMES[dow]}</p>
        <p className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{split.title}</p>
        {!split.rest && (
          <div className="flex gap-4 mt-2 text-xs text-neutral-400">
            <span>Volume: <b style={{ color: ACCENT }}>{fmt(totalVolume)}</b> kg·reps</span>
            <span>Est. burn: <b style={{ color: ACCENT }}>{fmt(totalCal)}</b> kcal</span>
          </div>
        )}
      </Card>

      {split.rest ? (
        <Card theme={theme} className="text-center py-8">
          <p className={`text-lg font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>&quot;Recovery is where growth happens.&quot;</p>
          <div className="flex justify-center gap-3 text-xs text-neutral-400 flex-wrap">
            <span className="px-3 py-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.12)" }}>💧 Hydrate well</span>
            <span className="px-3 py-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.12)" }}>🧘 Stretch 10 min</span>
            <span className="px-3 py-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.12)" }}>😴 Sleep 7-9 hrs</span>
          </div>
        </Card>
      ) : (
        split.exercises.map((ex) => {
          const exLog = log[ex.id] || { sets: [], difficulty: 5, notes: "" };
          const pr = bestSet(ex.id);
          const currentBest = Math.max(0, ...exLog.sets.filter((s) => s.completed).map((s) => (s.reps || 0) * (s.weight || 0.001)));
          const isPR = currentBest > 0 && currentBest >= pr;
          const meta = getExerciseMeta(ex.id);
          const tip = suggestProgression(state, ex.id);
          const infoOpen = openInfo === ex.id;
          return (
            <Card key={ex.id} theme={theme}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{ex.name}</p>
                  {isPR && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>PR</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">{ex.sets} × {ex.reps}</span>
                  {meta && (
                    <button onClick={() => setOpenInfo(infoOpen ? null : ex.id)} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: ACCENT }}>Form</button>
                  )}
                </div>
              </div>

              {infoOpen && meta && (
                <div className="mb-3 p-2.5 rounded-xl text-[11px] leading-relaxed space-y-1.5" style={{ background: theme === "dark" ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.03)", color: theme === "dark" ? "#d4d4d8" : "#3f3f46" }}>
                  <p><b style={{ color: ACCENT }}>Muscles:</b> {meta.primary.join(", ")}{meta.secondary.length ? ` (+ ${meta.secondary.join(", ")})` : ""}</p>
                  <p><b style={{ color: ACCENT }}>Tempo:</b> {meta.tempo} · <b style={{ color: ACCENT }}>Breathing:</b> {meta.breathing}</p>
                  <p><b style={{ color: ACCENT }}>Range of motion:</b> {meta.rom}</p>
                  <p><b style={{ color: ACCENT }}>Form cues:</b> {meta.form.join(" · ")}</p>
                  <p><b style={{ color: "#f87171" }}>Common mistakes:</b> {meta.mistakes.join(" · ")}</p>
                  <p><b style={{ color: "#f87171" }}>Safety:</b> {meta.safety.join(" · ")}</p>
                  <p><b style={{ color: ACCENT }}>Progression:</b> {meta.progressions.join(", ")} &nbsp; <b style={{ color: ACCENT }}>Regression:</b> {meta.regressions.join(", ")}</p>
                  <div className="mt-1.5 flex items-center justify-center h-14 rounded-lg" style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                    <span className="text-[10px] text-neutral-500">▶ demo video/GIF placeholder</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {exLog.sets.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-neutral-500">{i + 1}</span>
                    <input type="number" value={s.reps} onChange={(e) => updateSet(ex.id, i, { reps: +e.target.value })}
                      className="w-14 rounded-lg px-2 py-1 bg-transparent border text-center" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)", color: theme === "dark" ? "white" : "black" }} placeholder="reps" />
                    <span className="text-neutral-500">reps ×</span>
                    <input type="number" value={s.weight} onChange={(e) => updateSet(ex.id, i, { weight: +e.target.value })}
                      className="w-14 rounded-lg px-2 py-1 bg-transparent border text-center" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)", color: theme === "dark" ? "white" : "black" }} placeholder="kg" />
                    <span className="text-neutral-500">kg</span>
                    <button onClick={() => updateSet(ex.id, i, { completed: !s.completed })} className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: s.completed ? ACCENT : theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                      {s.completed && <Check size={13} color="#052e1e" />}
                    </button>
                  </div>
                ))}
                <button onClick={() => addSet(ex.id)} className="text-[11px] flex items-center gap-1 mt-1" style={{ color: ACCENT }}>
                  <Plus size={12} /> Add set
                </button>
              </div>

              <div className="flex items-center gap-3 mt-2.5">
                <div className="flex-1">
                  <label className="text-[10px] text-neutral-400">Difficulty {exLog.difficulty}/10</label>
                  <input type="range" min="1" max="10" value={exLog.difficulty} onChange={(e) => updateExercise(ex.id, { difficulty: +e.target.value })} className="w-full accent-emerald-400" />
                </div>
              </div>
              <input value={exLog.notes} onChange={(e) => updateExercise(ex.id, { notes: e.target.value })} placeholder="Notes..."
                className="w-full mt-2 text-xs rounded-lg px-2.5 py-1.5 bg-transparent border" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }} />
              {tip && (
                <p className="mt-2 text-[10.5px] flex items-start gap-1.5" style={{ color: tip.type === "deload" ? "#fbbf24" : ACCENT }}>
                  <Trophy size={11} className="mt-[1px] shrink-0" /> {tip.text}
                </p>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
