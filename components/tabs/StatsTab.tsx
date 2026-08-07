"use client";

import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { AppState } from "@/lib/types";
import { Card, Pill, SectionTitle, ACCENT } from "@/components/ui/Primitives";
import { getExerciseMeta } from "@/lib/data/exerciseMeta";
import { todayKey, fmt, calcStreak } from "@/lib/utils";

export default function StatsTab({ state, theme }: { state: AppState; theme: "dark" | "light" }) {
  const [range, setRange] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const days = range === "weekly" ? 7 : range === "monthly" ? 30 : 365;

  const series = [...Array(days)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    const key = todayKey(d);
    const log = state.workoutLogs[key];
    const vol = log
      ? Object.values(log).reduce((s, ex) => s + (ex.sets || []).reduce((a, st) => a + (st.completed ? (st.reps || 0) * (st.weight || 0) : 0), 0), 0)
      : 0;
    const meals = state.meals[key] || [];
    const protein = meals.reduce((s, m) => s + m.protein, 0);
    return { date: key.slice(5), vol, protein };
  });

  const totalWorkouts = Object.values(state.workoutLogs).filter((l) => Object.values(l).some((ex) => ex.sets?.some((s) => s.completed))).length;
  const muscleCount: Record<string, number> = {};
  Object.values(state.workoutLogs).forEach((l) =>
    Object.keys(l).forEach((exId) => {
      const g = getExerciseMeta(exId)?.group || "other";
      muscleCount[g] = (muscleCount[g] || 0) + 1;
    })
  );
  const mostTrained = Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return (
    <div className="space-y-4 pb-4">
      <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Statistics</h1>
      <div className="flex gap-2">
        {(["weekly", "monthly", "yearly"] as const).map((r) => (
          <Pill key={r} theme={theme} active={range === r} onClick={() => setRange(r)}>{r}</Pill>
        ))}
      </div>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Training Volume (kg·reps)</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={series}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} interval={Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={{ background: "#18181b", border: "none", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="vol" fill={ACCENT} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Protein Consistency (g/day)</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={series}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} interval={Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={{ background: "#18181b", border: "none", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="protein" stroke="#fb923c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card theme={theme}><p className="text-[11px] text-neutral-400">Total Workouts</p><p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>{totalWorkouts}</p></Card>
        <Card theme={theme}><p className="text-[11px] text-neutral-400">Most Trained</p><p className={`text-xl font-bold capitalize ${theme === "dark" ? "text-white" : "text-black"}`}>{mostTrained}</p></Card>
        <Card theme={theme}><p className="text-[11px] text-neutral-400">Longest Streak</p><p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>{calcStreak(state.workoutLogs)}</p></Card>
        <Card theme={theme}><p className="text-[11px] text-neutral-400">Weight Change</p><p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>{state.weightLog.length > 1 ? fmt(state.weightLog[state.weightLog.length - 1].kg - state.weightLog[0].kg, 1) : "0"} kg</p></Card>
      </div>
    </div>
  );
}
