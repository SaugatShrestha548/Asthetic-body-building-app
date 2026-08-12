"use client";

import React, { useState } from "react";
import { Plus, Search, Sparkles, X } from "lucide-react";
import { AppState, EstimatedFoodItem, MealEntry } from "@/lib/types";
import { Card, Ring, SectionTitle, ACCENT } from "@/components/ui/Primitives";
import { FOOD_DB } from "@/lib/data/foodDatabase";
import { todayKey, fmt, uid } from "@/lib/utils";

export default function NutritionTab({
  state, setState, theme,
}: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; theme: "dark" | "light" }) {
  const [dayOffset, setDayOffset] = useState(0);
  const d = new Date(); d.setDate(d.getDate() + dayOffset);
  const key = todayKey(d);
  const isToday = dayOffset === 0;
  const dayLabel = isToday ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const [query, setQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" });

  const [mealDescription, setMealDescription] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [estimateNotes, setEstimateNotes] = useState("");
  const [estimatedItems, setEstimatedItems] = useState<EstimatedFoodItem[] | null>(null);
  const [waterInput, setWaterInput] = useState("");

  const meals = state.meals[key] || [];
  const totals = meals.reduce(
    (a, m) => ({ cal: a.cal + m.cal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat, fiber: a.fiber + m.fiber }),
    { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const filtered = FOOD_DB.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  const addMeal = (food: Omit<MealEntry, "id"> & { id?: string }) => {
    const entry: MealEntry = { ...food, id: uid() };
    setState((s) => ({ ...s, meals: { ...s.meals, [key]: [...(s.meals[key] || []), entry] } }));
  };
  const removeMeal = (id: string) =>
    setState((s) => ({ ...s, meals: { ...s.meals, [key]: (s.meals[key] || []).filter((m) => m.id !== id) } }));

  const addCustom = () => {
    if (!custom.name) return;
    addMeal({ name: custom.name, cal: +custom.cal || 0, protein: +custom.protein || 0, carbs: +custom.carbs || 0, fat: +custom.fat || 0, fiber: +custom.fiber || 0, serving: "custom" });
    setCustom({ name: "", cal: "", protein: "", carbs: "", fat: "", fiber: "" });
    setCustomOpen(false);
  };

  const estimateMeal = async () => {
    const description = mealDescription.trim();
    if (!description || estimating) return;
    setEstimating(true);
    setEstimateError("");
    setEstimatedItems(null);
    try {
      const res = await fetch("/api/nutrition/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstimateError(data.error || "Couldn't estimate that meal — try rephrasing.");
        return;
      }
      setEstimatedItems(data.items || []);
      setEstimateNotes(data.notes || "");
    } catch {
      setEstimateError("Couldn't reach the estimator — check your connection and try again.");
    } finally {
      setEstimating(false);
    }
  };

  const updateEstimatedItem = (idx: number, patch: Partial<EstimatedFoodItem>) => {
    setEstimatedItems((items) => (items ? items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) : items));
  };

  const addEstimatedItem = (idx: number) => {
    const item = estimatedItems?.[idx];
    if (!item) return;
    addMeal({ name: item.name, cal: item.cal, protein: item.protein, carbs: item.carbs, fat: item.fat, fiber: item.fiber, serving: item.servingEstimate });
    setEstimatedItems((items) => (items ? items.filter((_, i) => i !== idx) : items));
  };

  const addAllEstimated = () => {
    if (!estimatedItems) return;
    estimatedItems.forEach((item) => addMeal({ name: item.name, cal: item.cal, protein: item.protein, carbs: item.carbs, fat: item.fat, fiber: item.fiber, serving: item.servingEstimate }));
    setEstimatedItems(null);
    setEstimateNotes("");
    setMealDescription("");
  };

  const water = state.water[key] || 0;
  const addWater = (ml: number) => setState((s) => ({ ...s, water: { ...s.water, [key]: (s.water[key] || 0) + ml } }));

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Nutrition</h1>
        <div className="flex gap-1.5">
          <button onClick={() => setDayOffset((o) => o - 1)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>◀</button>
          <button onClick={() => setDayOffset(0)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>Today</button>
          <button onClick={() => setDayOffset((o) => o + 1)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>▶</button>
        </div>
      </div>
      {!isToday && <p className="text-xs text-neutral-400 -mt-2">Viewing {dayLabel} — anything you log here is added to that day&apos;s record.</p>}

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
        <div className="flex gap-2 flex-wrap">
          {Array.from(new Set([250, 500, state.settings.bottleSize || 500, 1000])).sort((a, b) => a - b).map((ml) => (
            <button key={ml} onClick={() => addWater(ml)} className="flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(56,189,248,0.14)", color: "#38bdf8" }}>
              +{ml >= 1000 && ml % 1000 === 0 ? `${ml / 1000}L` : `${ml}ml`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            value={waterInput}
            onChange={(e) => setWaterInput(e.target.value)}
            placeholder="Custom amount (ml)"
            className="flex-1 rounded-lg px-3 py-1.5 text-xs bg-transparent border"
            style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }}
          />
          <button
            onClick={() => { if (+waterInput > 0) { addWater(+waterInput); setWaterInput(""); } }}
            className="px-4 rounded-lg text-xs font-semibold"
            style={{ background: "#38bdf8", color: "#052e1e" }}
          >
            Add
          </button>
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>
          <span className="flex items-center gap-1.5"><Sparkles size={15} color={ACCENT} />Describe what you ate</span>
        </SectionTitle>
        <textarea
          value={mealDescription}
          onChange={(e) => setMealDescription(e.target.value)}
          placeholder="e.g. 2 chapati, a bowl of dal, and some seasonal vegetables"
          rows={2}
          className="w-full rounded-xl px-3 py-2 text-sm bg-transparent border resize-none"
          style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }}
        />
        <button
          onClick={estimateMeal}
          disabled={estimating || !mealDescription.trim()}
          className="w-full mt-2 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ background: ACCENT, color: "#052e1e" }}
        >
          <Sparkles size={14} />{estimating ? "Estimating…" : "Estimate with AI"}
        </button>
        {estimateError && <p className="text-[11px] mt-2" style={{ color: "#f87171" }}>{estimateError}</p>}

        {estimatedItems && estimatedItems.length > 0 && (
          <div className="mt-3 space-y-2">
            {estimateNotes && <p className="text-[10.5px] text-neutral-500 italic">{estimateNotes}</p>}
            {estimatedItems.map((item, i) => (
              <div key={i} className="p-2.5 rounded-xl" style={{ background: theme === "dark" ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.03)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className={`text-xs font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>{item.name}</p>
                    <p className="text-[10px] text-neutral-400">{item.servingEstimate}</p>
                  </div>
                  <button onClick={() => addEstimatedItem(i)} className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(52,211,153,0.15)", color: ACCENT }}>
                    <Plus size={11} />Add
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["cal", "protein", "carbs", "fat", "fiber"] as const).map((k) => (
                    <div key={k}>
                      <label className="text-[9px] text-neutral-500 block">{k}</label>
                      <input
                        type="number"
                        value={item[k]}
                        onChange={(e) => updateEstimatedItem(i, { [k]: +e.target.value })}
                        className="w-full rounded-md px-1.5 py-1 text-[11px] bg-transparent border text-center"
                        style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={addAllEstimated} className="w-full py-1.5 rounded-lg text-xs font-semibold" style={{ background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: theme === "dark" ? "white" : "black" }}>
              Add all {estimatedItems.length} items
            </button>
          </div>
        )}
        <p className="text-[10px] text-neutral-500 mt-2">AI estimates are approximate — edit any value above before adding if you know the real portion.</p>
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
        <SectionTitle theme={theme}>{dayLabel}&apos;s Food Log</SectionTitle>
        {meals.length === 0 && <p className="text-xs text-neutral-500">No meals logged yet.</p>}
        <div className="space-y-2">
          {meals.map((m) => (
            <div key={m.id} className="p-2.5 rounded-xl" style={{ background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className={`text-xs font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>{m.name}</p>
                  {m.serving && <p className="text-[10px] text-neutral-500">{m.serving}</p>}
                </div>
                <button onClick={() => removeMeal(m.id)}><X size={13} className="text-neutral-500" /></button>
              </div>
              <div className="flex gap-3 text-[10.5px] text-neutral-400">
                <span>{fmt(m.cal)} kcal</span>
                <span style={{ color: ACCENT }}>{fmt(m.protein)}g protein</span>
                <span>{fmt(m.carbs)}g carbs</span>
                <span>{fmt(m.fat)}g fat</span>
                <span>{fmt(m.fiber)}g fiber</span>
              </div>
            </div>
          ))}
        </div>
        {meals.length > 0 && (
          <div className="flex gap-3 mt-3 pt-3 border-t text-[11px]" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
            <span className="text-neutral-400">Total:</span>
            <span className={theme === "dark" ? "text-white" : "text-black"}>{fmt(totals.cal)} kcal</span>
            <span style={{ color: ACCENT }}>{fmt(totals.protein)}g protein</span>
          </div>
        )}
      </Card>
    </div>
  );
}
