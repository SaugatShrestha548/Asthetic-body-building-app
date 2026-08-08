"use client";

import React, { useState } from "react";
import { Camera } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { AppState, MeasurementEntry } from "@/lib/types";
import { Card, SectionTitle, ACCENT } from "@/components/ui/Primitives";
import { MEASURE_FIELDS } from "@/lib/data/exerciseMeta";
import { todayKey, uid } from "@/lib/utils";

export default function BodyTab({
  state, setState, theme,
}: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; theme: "dark" | "light" }) {
  const [weightInput, setWeightInput] = useState("");
  const [form, setForm] = useState<Partial<MeasurementEntry>>({});
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");

  const addWeight = () => {
    if (!weightInput) return;
    setState((s) => ({ ...s, weightLog: [...s.weightLog, { id: uid(), date: todayKey(), kg: +weightInput }] }));
    setWeightInput("");
  };

  const saveMeasurement = () => {
    setState((s) => ({ ...s, measurements: [...s.measurements, { id: uid(), date: todayKey(), ...form } as MeasurementEntry] }));
    setForm({}); setShowForm(false);
  };

  const addPhoto = () => {
    setState((s) => ({ ...s, photos: [...s.photos, { id: uid(), date: todayKey(), note: note || "Progress photo" }] }));
    setNote("");
  };

  const weightData = state.weightLog.map((w) => ({ date: w.date.slice(5), kg: w.kg }));
  const latestM = state.measurements[state.measurements.length - 1];

  return (
    <div className="space-y-4 pb-4">
      <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Body</h1>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Weight</SectionTitle>
        <div className="flex gap-2 mb-3">
          <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="kg" className="flex-1 rounded-lg px-3 py-2 text-sm bg-transparent border" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }} />
          <button onClick={addWeight} className="px-4 rounded-lg text-sm font-semibold" style={{ background: ACCENT, color: "#052e1e" }}>Add</button>
        </div>
        {weightData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weightData}>
              <defs><linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} /><stop offset="100%" stopColor={ACCENT} stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: "#18181b", border: "none", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="kg" stroke={ACCENT} fill="url(#wgrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-neutral-500">Log your weight to see the trend.</p>}
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme} right={<button onClick={() => setShowForm((v) => !v)} className="text-xs flex items-center gap-1" style={{ color: ACCENT }}>+ Add</button>}>
          Measurements {latestM && <span className="text-[10px] text-neutral-500 font-normal">(last: {latestM.date})</span>}
        </SectionTitle>
        {showForm && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {MEASURE_FIELDS.map((f) => (
              <input key={f} placeholder={f} type="number" value={(form[f] as number | undefined) ?? ""} onChange={(e) => setForm({ ...form, [f]: +e.target.value })}
                className="rounded-lg px-2 py-1.5 text-xs bg-transparent border" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }} />
            ))}
            <button onClick={saveMeasurement} className="col-span-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: ACCENT, color: "#052e1e" }}>Save Measurements</button>
          </div>
        )}
        {latestM ? (
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-neutral-400">
            {MEASURE_FIELDS.filter((f) => (latestM[f] as number | undefined) != null).map((f) => (
              <div key={f}>{f}<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{(latestM[f] as number | undefined)}{f === "bodyFat" ? "%" : "cm"}</b></div>
            ))}
          </div>
        ) : <p className="text-xs text-neutral-500">No measurements yet.</p>}
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Progress Photos</SectionTitle>
        <div className="flex gap-2 mb-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (e.g. Week 4, front pose)" className="flex-1 rounded-lg px-3 py-2 text-sm bg-transparent border" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }} />
          <button onClick={addPhoto} className="px-3 rounded-lg" style={{ background: ACCENT }}><Camera size={16} color="#052e1e" /></button>
        </div>
        <p className="text-[11px] text-neutral-500 mb-2">Wire this button up to an actual file/camera input (e.g. an <code>&lt;input type=&quot;file&quot; accept=&quot;image/*&quot; capture&gt;</code>) and store the image in IndexedDB or your cloud bucket — this demo logs the timeline entry so the before/after flow is in place.</p>
        <div className="flex gap-2 overflow-x-auto">
          {state.photos.slice().reverse().map((p) => (
            <div key={p.id} className="min-w-[84px] h-24 rounded-xl flex flex-col items-center justify-center text-center px-1" style={{ background: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
              <Camera size={16} className="text-neutral-500 mb-1" />
              <span className="text-[9px] text-neutral-500">{p.date}</span>
              <span className="text-[9px] text-neutral-400 truncate w-full">{p.note}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
