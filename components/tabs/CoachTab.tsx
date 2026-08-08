"use client";

import React, { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { AppState, CheckinEntry, ChatMessage } from "@/lib/types";
import { Card, Ring, SectionTitle, ACCENT } from "@/components/ui/Primitives";
import { todayKey, fmt } from "@/lib/utils";
import {
  GROUPS, recoveryScore, consistencyScore, proteinAverage, weeklyVolume,
  nutritionGaps, weeklyAnalysisText, checkinRecommendation, buildCoachSystemPrompt,
} from "@/lib/engine/coachEngine";

function DailyCheckin({ state, setState, theme }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; theme: "dark" | "light" }) {
  const today = todayKey();
  const existing = state.checkins[today];
  const [form, setForm] = useState<CheckinEntry>(existing || { energy: 6, sleepQuality: 6, hoursSlept: 7, soreness: 3, motivation: 7 });
  const [editing, setEditing] = useState(!existing);

  const save = () => { setState((s) => ({ ...s, checkins: { ...s.checkins, [today]: form } })); setEditing(false); };

  if (!editing && existing) {
    return (
      <Card theme={theme}>
        <SectionTitle theme={theme} right={<button onClick={() => setEditing(true)} className="text-xs" style={{ color: ACCENT }}>Edit</button>}>Today&apos;s Check-in</SectionTitle>
        <div className="grid grid-cols-4 gap-2 text-center text-[11px] text-neutral-400 mb-2">
          <div>Energy<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{existing.energy}</b></div>
          <div>Sleep Q<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{existing.sleepQuality}</b></div>
          <div>Soreness<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{existing.soreness}</b></div>
          <div>Motivation<br /><b className={theme === "dark" ? "text-white" : "text-black"}>{existing.motivation}</b></div>
        </div>
        <p className="text-[11px]" style={{ color: ACCENT }}>{checkinRecommendation(existing)}</p>
      </Card>
    );
  }

  return (
    <Card theme={theme}>
      <SectionTitle theme={theme}>Daily Check-in</SectionTitle>
      {([
        { key: "energy", label: "Energy", max: 10 },
        { key: "sleepQuality", label: "Sleep quality", max: 10 },
        { key: "hoursSlept", label: "Hours slept", max: 12 },
        { key: "soreness", label: "Muscle soreness", max: 10 },
        { key: "motivation", label: "Motivation", max: 10 },
      ] as { key: keyof CheckinEntry; label: string; max: number }[]).map((f) => (
        <div key={f.key} className="mb-2.5">
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1"><span>{f.label}</span><span>{form[f.key]}{f.key === "hoursSlept" ? "h" : "/10"}</span></div>
          <input type="range" min="0" max={f.max || 10} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: +e.target.value })} className="w-full accent-emerald-400" />
        </div>
      ))}
      <button onClick={save} className="w-full py-2 rounded-lg text-sm font-semibold mt-1" style={{ background: ACCENT, color: "#052e1e" }}>Save Check-in</button>
    </Card>
  );
}

function ChatBubble({ msg, theme }: { msg: ChatMessage; theme: "dark" | "light" }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{
        background: isUser ? ACCENT : theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: isUser ? "#052e1e" : theme === "dark" ? "#e4e4e7" : "#27272a",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function CoachTab({
  state, setState, theme,
}: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; theme: "dark" | "light" }) {
  const today = todayKey();
  const checkin = state.checkins[today];
  const analysis = useMemo(() => weeklyAnalysisText(state), [state]);
  const recovery = useMemo(() => GROUPS.map((g) => ({ group: g, score: recoveryScore(state, g, checkin) })), [state, checkin]);
  const consistency = useMemo(() => consistencyScore(state, 7), [state]);
  const avgProtein = useMemo(() => proteinAverage(state, 7), [state]);
  const volume = useMemo(() => weeklyVolume(state, 7), [state]);
  const gaps = useMemo(() => nutritionGaps(state), [state]);

  const chatHistory = state.chatHistory || [];
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (textOverride?: string) => {
    const text = (textOverride || chatInput).trim();
    if (!text || loading) return;
    setChatInput("");
    const withUser: ChatMessage[] = [...chatHistory, { role: "user" as const, content: text }];
    setState((s) => ({ ...s, chatHistory: withUser.slice(-20) }));
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatHistory, systemPrompt: buildCoachSystemPrompt(state) }),
      });
      const data = await res.json();
      const reply = res.ok ? data.reply : (data.error || "The coach is unavailable right now.");
      setState((s) => ({ ...s, chatHistory: [...(s.chatHistory || []), { role: "assistant" as const, content: reply }].slice(-20) }));
    } catch {
      setState((s) => ({ ...s, chatHistory: [...(s.chatHistory || []), { role: "assistant" as const, content: "I'm having trouble connecting right now — please try again in a moment." }].slice(-20) }));
    } finally {
      setLoading(false);
    }
  };

  const recoveryColor = (score: number) => (score >= 80 ? ACCENT : score >= 50 ? "#fbbf24" : "#f87171");

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>AI Gym Trainer</h1>
        <p className="text-xs text-neutral-400">Reads your logged data automatically — no need to repeat yourself.</p>
      </div>

      <DailyCheckin state={state} setState={setState} theme={theme} />

      <Card theme={theme}>
        <SectionTitle theme={theme}>Trainer Dashboard</SectionTitle>
        <div className="flex items-center justify-around mb-3">
          <Ring theme={theme} pct={consistency / 100} label={`${consistency}%`} sub="consistency" />
          <Ring theme={theme} pct={Math.min(1, avgProtein / state.settings.proteinGoal)} color="#fb923c" label={`${fmt(avgProtein)}g`} sub="avg protein" />
          <Ring theme={theme} pct={Math.min(1, volume / 5000)} color="#38bdf8" label={fmt(volume)} sub="wk volume" />
        </div>
        <p className="text-[11px] text-neutral-400 mb-1.5">Recovery by muscle group</p>
        <div className="flex justify-between">
          {recovery.map((r) => (
            <div key={r.group} className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${recoveryColor(r.score)}22`, color: recoveryColor(r.score) }}>{r.score}</div>
              <span className="text-[9px] text-neutral-500 capitalize">{r.group}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Weekly Recommendations</SectionTitle>
        <div className="space-y-2">
          {analysis.recommendations.map((r, i) => (
            <p key={i} className="text-[12px] flex items-start gap-2" style={{ color: theme === "dark" ? "#d4d4d8" : "#3f3f46" }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ACCENT }} />
              {r}
            </p>
          ))}
        </div>
        {gaps.proteinRemaining > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
            <p className="text-[11px] text-neutral-400 mb-1.5">{fmt(gaps.proteinRemaining)}g protein left today — try:</p>
            <div className="flex flex-wrap gap-1.5">
              {gaps.suggestions.map((f) => <span key={f.id} className="text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(52,211,153,0.12)", color: ACCENT }}>{f.name} ({f.protein}g)</span>)}
            </div>
          </div>
        )}
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Ask your Coach</SectionTitle>
        <div className="space-y-2 max-h-72 overflow-y-auto mb-2.5 pr-0.5">
          {chatHistory.length === 0 && (
            <div className="flex flex-wrap gap-1.5">
              {["Is my form ok on push-ups?", "Should I increase weight?", "Which muscle should I train tomorrow?", "How much protein do I still need today?"].map((q) => (
                <button key={q} onClick={() => send(q)} className="text-[10.5px] px-2.5 py-1.5 rounded-full text-left" style={{ background: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: theme === "dark" ? "#a1a1aa" : "#52525b" }}>{q}</button>
              ))}
            </div>
          )}
          {chatHistory.map((m, i) => <ChatBubble key={i} msg={m} theme={theme} />)}
          {loading && <ChatBubble msg={{ role: "assistant", content: "Thinking…" }} theme={theme} />}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Ask about form, recovery, nutrition…"
            className="flex-1 rounded-lg px-3 py-2 text-sm bg-transparent border"
            style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: theme === "dark" ? "white" : "black" }}
          />
          <button onClick={() => send()} disabled={loading} className="px-4 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: ACCENT, color: "#052e1e" }}>Send</button>
        </div>
        <p className="text-[10px] text-neutral-500 mt-2 flex items-start gap-1"><Trophy size={11} className="mt-[1px] shrink-0" />Not a substitute for medical advice. If something hurts (sharp, joint, or persistent pain), stop the exercise and consider seeing a professional.</p>
      </Card>
    </div>
  );
}
