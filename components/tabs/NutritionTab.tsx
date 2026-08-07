"use client";

import React, { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { AppState, MealEntry } from "@/lib/types";
import { Card, Ring, SectionTitle, ACCENT } from "@/components/ui/Primitives";
import { FOOD_DB } from "@/lib/data/foodDatabase";
import { todayKey, fmt, uid } from "@/lib/utils";

export default function NutritionTab({
  state, setState, theme,
}: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; theme: "dark" | "light" }) {
  const today = todayKey();
  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" });

  const meals = state.meals[today] || [];
  const totals = meals.reduce(
    (a, m) => ({ cal: a.cal + m.cal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat, fiber: a.fiber + m.fiber }),
    { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const filtered = FOOD_DB.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  const addMeal = (food: Omit<MealEntry, "id"> & { id?: string }) => {
    const entry: MealEntry = { ...food, id: uid() };
    setState((s) => ({ ...s, meals: { ...s.meals, [today]: [...(s.meals[today] || []), entry] } }));
  };
  const removeMeal = (id: string) =>
    setState((s) => ({ ...s, meals: { ...s.meals, [today]: (s.meals[today] || []).filter((m) => m.id !== id) } }));

  const addCustom = () => {
    if (!custom.name) return;
    addMeal({ name: custom.name, cal: +custom.cal || 0, protein: +custom.protein || 0, carbs: +custom.carbs || 0, fat: +custom.fat || 0, fiber: +custom.fiber || 0, serving: "custom" });
    setCustom({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" });
    setCustomOpen(false);
  };

  const water = state.water[today] || 0;
  const addWater = (ml: number) => setState((s) => ({ ...s, water: { ...s.water, [today]: (s.water[today] || 0) + ml } }));

  return (
    <div className="space-y-4 pb-4">
      <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Nutrition</h1>

      <Card theme={theme}>
        <div className="flex items-center justify-around">
          <Ring theme={theme} pct={totals.protein / state.settings.proteinGoal} label={`${fmt(totals.protein)}g`} sub="protein" />
          <Ring theme={theme} pct={totals.cal / state.settings.calorieGoal} color="#fb923c" label={`${fmt(totals.cal)}`} sub="kcal" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs text-neutral-400">
          <div>Carbs<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{fmt(totals.carbs)}g</b></div>
          <div>Fat<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{fmt(totals.fat)}g</b></div>
          <div>Fiber<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{fmt(totals.fiber)}g</b></div>
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Water — {fmt(water / 1000, 2)}L / {state.settings.waterGoal / 1000}L</SectionTitle>
        <div className="w-full h-2 rounded-full mb-3" style={{ background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (water / state.settings.waterGoal) * 100)}%`, background: "#38bdf8" }} />
        </div>
        <div className="flex gap-2">
          {[250, 500, 750, 1000].map((ml) => (
            <button key={ml} onClick={() => addWater(ml)} className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(56,189,248,0.14)", color: "#38bdf8" }}>+{ml >= 1000 ? "1L" : `${ml}ml`}</button>
          ))}
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme} right={<button onClick={() => setCustomOpen((v) => !v)} className="text-xs flex items-center gap-1" style={{ color: ACCENT }}><Plus size={12} />Custom</button>}>
          Food Database
        </SectionTitle>
        {customOpen && (
          <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 rounded-xl" style={{ background: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
            <input placeholder="Name" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} className="col-span-2 rounded-lg px-2 py-1.5 text-xs bg-transparent border" style={{ borderColor: "rgba(255,255,255,0.1)", color: theme === "dark" ? "white" : "black" }} />
            {(["cal", "protein", "carbs", "fat", "fiber"] as const).map((k) => (
              <input key={k} placeholder={k} type="number" value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })} className="rounded-lg px-2 py-1.5 text-xs bg-transparent border" style={{ borderColor: "rgba(255,255,255,0.1)", color: theme === "dark" ? "white" : "black" }} />
            ))}
            <button onClick={addCustom} className="col-span-2 py-1.5 rounded-lg text-xs font-semibold" style={{ background: ACCENT, color: "#052e1e" }}>Add Food</button>
          </div>
        )}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search foods..." className="w-full pl-8 pr-2.5 py-2 rounded-xl text-sm bg-transparent border" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }} />
        </div>
        <div className="max-h-56 overflow-y-auto space-y-1">
          {filtered.map((f) => (
            <button key={f.id} onClick={() => addMeal({ foodId: f.id, name: f.name, cal: f.cal, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, serving: f.serving })} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left" style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
              <div>
                <p className={`text-xs font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>{f.name}</p>
                <p className="text-[10px] text-neutral-400">{f.serving} • {f.cal} kcal • {f.protein}g protein</p>
              </div>
              <Plus size={14} color={ACCENT} />
            </button>
          ))}
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Today&apos;s Meals</SectionTitle>
        {meals.length === 0 && <p className="text-xs text-neutral-500">No meals logged yet.</p>}
        <div className="space-y-1.5">
          {meals.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span className={theme === "dark" ? "text-neutral-200" : "text-neutral-700"}>{m.name} <span className="text-neutral-500">({fmt(m.protein)}g P)</span></span>
              <button onClick={() => removeMeal(m.id)}><X size={13} className="text-neutral-500" /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
