"use client";

import React, { useMemo } from "react";
import { Flame, Activity, Dumbbell, Apple, TrendingUp, Camera, BarChart3, ListChecks, Check, MessageCircle, ChevronRight } from "lucide-react";
import { AppState } from "@/lib/types";
import { Card, Ring, SectionTitle, ACCENT } from "@/components/ui/Primitives";
import { SPLIT, DAY_NAMES } from "@/lib/data/workoutSplit";
import { todayKey, fmt, calcStreak } from "@/lib/utils";
import { checkinRecommendation } from "@/lib/engine/coachEngine";

export default function Dashboard({
  state, theme, goTo,
}: { state: AppState; theme: "dark" | "light"; goTo: (tab: string) => void }) {
  const today = todayKey();
  const day = new Date().getDay();
  const split = SPLIT[day];
  const meals = state.meals[today] || [];
  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const calories = meals.reduce((s, m) => s + m.cal, 0);
  const water = state.water[today] || 0;
  const weight = state.weightLog.length ? state.weightLog[state.weightLog.length - 1].kg : null;
  const streak = useMemo(() => calcStreak(state.workoutLogs), [state.workoutLogs]);
  const wLog = state.workoutLogs[today];
  const workoutDone = wLog ? Object.values(wLog).some((ex) => ex.sets?.some((s) => s.completed)) : false;

  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = todayKey(d);
    const dow = d.getDay();
    const rest = SPLIT[dow].rest;
    const log = state.workoutLogs[key];
    const done = log ? Object.values(log).some((ex) => ex.sets?.some((s) => s.completed)) : false;
    return { key, rest, done, label: DAY_NAMES[dow][0] };
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4 pb-4">
      <div>
        <p className={`text-sm ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>{greeting}</p>
        <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Today&apos;s Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card theme={theme} className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: "rgba(52,211,153,0.15)" }}><Flame size={18} color={ACCENT} /></div>
          <div>
            <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{streak}</p>
            <p className="text-[11px] text-neutral-400">day streak</p>
          </div>
        </Card>
        <Card theme={theme} className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: "rgba(52,211,153,0.15)" }}><Activity size={18} color={ACCENT} /></div>
          <div>
            <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{weight ? `${weight} kg` : "—"}</p>
            <p className="text-[11px] text-neutral-400">current weight</p>
          </div>
        </Card>
      </div>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Nutrition & Hydration</SectionTitle>
        <div className="flex items-center justify-around">
          <Ring theme={theme} pct={protein / state.settings.proteinGoal} label={`${fmt(protein)}g`} sub={`/${state.settings.proteinGoal}g`} />
          <Ring theme={theme} pct={calories / state.settings.calorieGoal} color="#fb923c" label={`${fmt(calories)}`} sub="kcal" />
          <Ring theme={theme} pct={water / state.settings.waterGoal} color="#38bdf8" label={`${fmt(water / 1000, 1)}L`} sub={`/${state.settings.waterGoal / 1000}L`} />
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Workout Status</SectionTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{split.rest ? "Rest Day" : split.title}</p>
            <p className="text-xs text-neutral-400">{split.rest ? "Recovery is where growth happens." : `${split.exercises.length} exercises`}</p>
          </div>
          {!split.rest && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: workoutDone ? "rgba(52,211,153,0.18)" : "rgba(255,255,255,0.08)", color: workoutDone ? ACCENT : "#a1a1aa" }}>
              {workoutDone ? "Completed" : "Pending"}
            </span>
          )}
        </div>
      </Card>

      <Card theme={theme}>
        <button onClick={() => goTo("coach")} className="w-full flex items-center gap-3 text-left">
          <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(52,211,153,0.15)" }}><MessageCircle size={18} color={ACCENT} /></div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Coach tip</p>
            <p className="text-[11px] text-neutral-400 truncate">{checkinRecommendation(state.checkins[today])}</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-neutral-500 shrink-0" />
        </button>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Weekly Consistency</SectionTitle>
        <div className="flex justify-between">
          {last7.map((d) => (
            <div key={d.key} className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
                style={{
                  background: d.rest ? "rgba(56,189,248,0.18)" : d.done ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.06)",
                  color: d.rest ? "#38bdf8" : d.done ? "#052e1e" : "#71717a",
                }}
              >
                {d.rest ? "R" : d.done ? <Check size={14} /> : ""}
              </div>
              <span className="text-[10px] text-neutral-500">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <SectionTitle theme={theme}>Quick Actions</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Dumbbell, label: "Start Workout", tab: "workout" },
            { icon: Apple, label: "Log Meal", tab: "nutrition" },
            { icon: TrendingUp, label: "Add Weight", tab: "body" },
            { icon: Camera, label: "Progress Photo", tab: "body" },
            { icon: BarChart3, label: "Statistics", tab: "stats" },
            { icon: ListChecks, label: "Habits", tab: "habits" },
          ].map((a) => (
            <button key={a.label} onClick={() => goTo(a.tab)} className="rounded-xl p-3 flex flex-col items-center gap-1.5 border transition-transform active:scale-95"
              style={{ background: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)", borderColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
              <a.icon size={18} color={ACCENT} />
              <span className={`text-[10.5px] text-center leading-tight ${theme === "dark" ? "text-neutral-300" : "text-neutral-700"}`}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
