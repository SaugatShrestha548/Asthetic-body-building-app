"use client";

import React from "react";
import { Check, Flame } from "lucide-react";
import { AppState } from "@/lib/types";
import { Card, ACCENT } from "@/components/ui/Primitives";
import { HABITS } from "@/lib/data/habits";
import { todayKey } from "@/lib/utils";

export default function HabitsTab({
  state, setState, theme,
}: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; theme: "dark" | "light" }) {
  const today = todayKey();
  const todayHabits = state.habits[today] || {};
  const toggle = (id: string) =>
    setState((s) => ({ ...s, habits: { ...s.habits, [today]: { ...(s.habits[today] || {}), [id]: !s.habits[today]?.[id] } } }));

  const streakFor = (id: string) => {
    let streak = 0;
    const d = new Date();
    while (state.habits[todayKey(d)]?.[id]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  };

  return (
    <div className="space-y-4 pb-4">
      <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Habits</h1>
      <Card theme={theme}>
        <div className="space-y-1">
          {HABITS.map((h) => {
            const done = !!todayHabits[h.id];
            return (
              <button key={h.id} onClick={() => toggle(h.id)} className="w-full flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: done ? ACCENT : theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                    {done && <Check size={13} color="#052e1e" />}
                  </div>
                  <span className={`text-sm ${theme === "dark" ? "text-neutral-200" : "text-neutral-700"}`}>{h.label}</span>
                </div>
                <span className="text-[11px] text-neutral-500 flex items-center gap-1"><Flame size={11} />{streakFor(h.id)}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
