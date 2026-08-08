"use client";

import React from "react";
import { Download, Moon, RotateCcw, Sun } from "lucide-react";
import { AppState } from "@/lib/types";
import { Card, SectionTitle, ACCENT } from "@/components/ui/Primitives";
import { emptyState } from "@/lib/utils";

export default function SettingsTab({
  state, setState, theme, setTheme,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
}) {
  const update = (patch: Partial<AppState["settings"]>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "aesthetic-body-tracker-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { if (confirm("Reset all data? This cannot be undone.")) setState(emptyState()); };

  return (
    <div className="space-y-4 pb-4">
      <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Settings</h1>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Appearance</SectionTitle>
        <div className="flex gap-2">
          <button onClick={() => setTheme("dark")} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm" style={{ background: theme === "dark" ? ACCENT : "rgba(255,255,255,0.06)", color: theme === "dark" ? "#052e1e" : "#a1a1aa" }}><Moon size={14} />Dark</button>
          <button onClick={() => setTheme("light")} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm" style={{ background: theme === "light" ? ACCENT : "rgba(255,255,255,0.06)", color: theme === "light" ? "#052e1e" : "#a1a1aa" }}><Sun size={14} />Light</button>
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Goals</SectionTitle>
        <div className="space-y-2.5">
          {[
            { key: "proteinGoal" as const, label: "Protein goal (g)" },
            { key: "calorieGoal" as const, label: "Calorie goal (kcal)" },
            { key: "waterGoal" as const, label: "Water goal (ml)" },
            { key: "bottleSize" as const, label: "Bottle size (ml)" },
          ].map((g) => (
            <div key={g.key} className="flex items-center justify-between">
              <span className={`text-sm ${theme === "dark" ? "text-neutral-300" : "text-neutral-700"}`}>{g.label}</span>
              <input type="number" value={state.settings[g.key]} onChange={(e) => update({ [g.key]: +e.target.value })} className="w-24 rounded-lg px-2 py-1.5 text-sm text-right bg-transparent border" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }} />
            </div>
          ))}
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Data</SectionTitle>
        <div className="space-y-2">
          <button onClick={exportJSON} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", color: theme === "dark" ? "white" : "black" }}><Download size={14} />Export JSON Backup</button>
          <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}><RotateCcw size={14} />Reset All Data</button>
        </div>
        <p className="text-[10px] text-neutral-500 mt-2">CSV / Excel / PDF export and cloud sync are on the roadmap — see the README.</p>
      </Card>
    </div>
  );
}
