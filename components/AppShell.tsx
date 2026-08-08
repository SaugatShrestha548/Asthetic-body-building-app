"use client";

import React, { useState } from "react";
import {
  LayoutDashboard, Dumbbell, Apple, Ruler, ListChecks, BarChart3,
  Settings as SettingsIcon, Trophy, MessageCircle,
} from "lucide-react";
import { useAppState } from "@/lib/useAppState";
import { ACCENT } from "@/components/ui/Primitives";
import Dashboard from "@/components/tabs/Dashboard";
import WorkoutTab from "@/components/tabs/WorkoutTab";
import NutritionTab from "@/components/tabs/NutritionTab";
import BodyTab from "@/components/tabs/BodyTab";
import HabitsTab from "@/components/tabs/HabitsTab";
import StatsTab from "@/components/tabs/StatsTab";
import CoachTab from "@/components/tabs/CoachTab";
import SettingsTab from "@/components/tabs/SettingsTab";

const TABS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "body", label: "Body", icon: Ruler },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "coach", label: "Coach", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function AppShell() {
  const [state, setState, loaded] = useAppState();
  const [tab, setTab] = useState("dashboard");
  const theme = state?.settings?.theme || "dark";
  const setTheme = (t: "dark" | "light") => setState((s) => ({ ...s, settings: { ...s.settings, theme: t } }));

  if (!loaded || !state) {
    return (
      <div className="w-full h-dvh flex items-center justify-center bg-neutral-950">
        <div className="flex items-center gap-2 text-emerald-400 text-sm"><Dumbbell className="animate-pulse" size={18} /> Loading…</div>
      </div>
    );
  }

  const bg = theme === "dark" ? "#0a0d0b" : "#f4f6f5";
  const textColor = theme === "dark" ? "#e4e4e7" : "#18181b";

  return (
    <div className="w-full h-dvh flex justify-center" style={{ background: bg, color: textColor }}>
      <div className="w-full max-w-md relative flex flex-col h-full">
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-64 opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle at 50% 0%, ${ACCENT}, transparent 70%)` }} />

        <header className="shrink-0 z-10 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b"
          style={{ background: theme === "dark" ? "rgba(10,13,11,0.75)" : "rgba(244,246,245,0.75)", borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}><Dumbbell size={15} color="#052e1e" /></div>
            <span className="font-semibold tracking-tight text-sm">Aesthetic Body Tracker</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400"><Trophy size={13} color="#fbbf24" />{state.xp || 0} XP</div>
        </header>

        <main className="relative flex-1 min-h-0 overflow-y-auto px-4 pt-4">
          {tab === "dashboard" && <Dashboard state={state} theme={theme} goTo={setTab} />}
          {tab === "workout" && <WorkoutTab state={state} setState={setState} theme={theme} />}
          {tab === "nutrition" && <NutritionTab state={state} setState={setState} theme={theme} />}
          {tab === "body" && <BodyTab state={state} setState={setState} theme={theme} />}
          {tab === "habits" && <HabitsTab state={state} setState={setState} theme={theme} />}
          {tab === "stats" && <StatsTab state={state} theme={theme} />}
          {tab === "coach" && <CoachTab state={state} setState={setState} theme={theme} />}
          {tab === "settings" && <SettingsTab state={state} setState={setState} theme={theme} setTheme={setTheme} />}
        </main>

        <nav className="shrink-0 z-10 backdrop-blur-xl border-t flex justify-around py-2 px-1"
          style={{ background: theme === "dark" ? "rgba(10,13,11,0.85)" : "rgba(244,246,245,0.85)", borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors">
              <t.icon size={18} color={tab === t.id ? ACCENT : "#71717a"} />
              <span className="text-[9px]" style={{ color: tab === t.id ? ACCENT : "#71717a" }}>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
