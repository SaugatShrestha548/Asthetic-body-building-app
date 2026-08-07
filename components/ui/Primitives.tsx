"use client";

import React from "react";

export const ACCENT = "#34d399";
export const ACCENT_DARK = "#10b981";

type Theme = "dark" | "light";

export function Card({ children, className = "", theme }: { children: React.ReactNode; className?: string; theme: Theme }) {
  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl p-4 ${className}`}
      style={{
        background: theme === "dark" ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.75)",
        borderColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  );
}

export function Ring({
  pct, size = 84, stroke = 8, label, sub, theme, color = ACCENT,
}: { pct: number; size?: number; stroke?: number; label: string; sub?: string; theme: Theme; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct || 0));
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - clamped * c} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{label}</span>
        {sub && <span className="text-[10px] text-neutral-400">{sub}</span>}
      </div>
    </div>
  );
}

export function Pill({ children, active, onClick, theme }: { children: React.ReactNode; active: boolean; onClick: () => void; theme: Theme }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? ACCENT : theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: active ? "#052e1e" : theme === "dark" ? "#d4d4d8" : "#3f3f46",
      }}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children, theme, right }: { children: React.ReactNode; theme: Theme; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`text-base font-semibold tracking-tight ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{children}</h2>
      {right}
    </div>
  );
}
