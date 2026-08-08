# Aesthetic Body Tracker

A modern, offline-first Progressive Web App for a vegetarian, bodyweight + backpack
trainer working toward an aesthetic physique. Tracks workouts, body measurements,
progress photos, vegetarian nutrition (with foods common in Nepal), habits, and
includes an **AI Gym Trainer Agent** that reads your logged data automatically.

## Tech stack

- **Next.js 15 (App Router)** + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Recharts** for graphs, **lucide-react** for icons
- **localStorage** for offline persistence (see `lib/useAppState.ts`)
- A minimal **service worker** (`public/sw.js`) + **Web App Manifest** for installability
- **Anthropic API** (server-side route) powering the AI Trainer chat

No backend/database is required to run this — everything lives in the browser via
`localStorage`. The only server-side piece is `app/api/coach/route.ts`, which proxies
chat messages to Claude so your API key is never exposed to the client.

## Project structure

```
app/
  page.tsx              # mounts the client app shell
  layout.tsx             # metadata, PWA manifest link, service worker registration
  globals.css
  api/coach/route.ts     # server route — the only place that calls the Anthropic API
  api/nutrition/estimate/route.ts  # server route — parses a meal description into macros
components/
  AppShell.tsx            # tab routing, header, bottom nav
  RegisterSW.tsx           # registers public/sw.js
  ui/Primitives.tsx        # Card, Ring, Pill, SectionTitle
  tabs/
    Dashboard.tsx
    WorkoutTab.tsx         # set/rep/weight logging, PR badges, Form Assistant panel
    NutritionTab.tsx        # food search, custom foods, water tracker
    BodyTab.tsx              # weight chart, measurements, progress photo timeline
    HabitsTab.tsx
    StatsTab.tsx
    CoachTab.tsx              # AI Gym Trainer Agent: check-in, dashboard, chat
    SettingsTab.tsx
lib/
  types.ts                  # shared TypeScript types
  utils.ts                    # date/format helpers, streak calculation
  useAppState.ts               # localStorage-backed persistence hook
  data/
    workoutSplit.ts            # the weekly bodyweight+backpack split
    foodDatabase.ts             # vegetarian food DB (Nepal-focused)
    habits.ts
    exerciseMeta.ts               # Form Assistant DB (muscles, tempo, cues, safety…)
  engine/
    coachEngine.ts                 # rule-based analysis: recovery, consistency,
                                     # volume, plateau detection, progression, chat
                                     # context builder — all pure functions, no UI
public/
  manifest.json, icons/, sw.js
```

The `lib/engine/coachEngine.ts` layer is deliberately framework-agnostic — it's the
piece you'd lift into its own service if you later add wearables, a backend, or a
different LLM provider.

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works fully offline and
without any API key — you only need `ANTHROPIC_API_KEY` for the free-text chat in the
Coach tab. Everything else (workouts, nutrition, body tracking, the rule-based
recovery/consistency/progression analysis) runs entirely client-side.

### Environment variables

| Variable | Required for | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI Trainer chat (`/api/coach`) and the AI meal-description estimator (`/api/nutrition/estimate`) | https://console.anthropic.com/ |

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo — Vercel
   auto-detects Next.js, no config needed.
3. In **Project Settings → Environment Variables**, add `ANTHROPIC_API_KEY` with your
   key (Production + Preview).
4. Deploy. That's it — the app, including the API route, runs on Vercel's Node runtime.

To install it as a PWA: open the deployed URL on a phone and use "Add to Home Screen"
(iOS Safari) or the install prompt (Android Chrome / desktop Chrome).

## What's real vs. what's a placeholder

Built and working:
- Full workout logging (sets/reps/backpack weight/difficulty/notes/completed), PR
  detection, volume & estimated-calorie calculation
- Form Assistant per exercise (muscles, tempo, breathing, ROM, cues, mistakes, safety,
  progressions/regressions)
- Vegetarian nutrition tracker with a Nepal-focused food database + custom foods +
  **AI meal-description estimator** (type "2 chapati, dal, and curd" and get
  calories/protein/carbs/fat/fiber estimated per item, editable before logging)
- Water, body measurements, weight trend chart, habit streaks, weekly/monthly/yearly
  stats
- AI Gym Trainer Agent: daily check-in, rule-based recovery/consistency/plateau
  analysis (works offline), and an LLM chat that reads your data automatically

Intentionally left as a next step (noted in-app, not silently missing):
- Real photo capture/storage (currently logs timeline metadata only — wire up
  `<input type="file" accept="image/*" capture>` + object storage or IndexedDB)
- CSV / Excel / PDF export (JSON backup export is implemented in Settings)
- Cloud sync / authentication (Firebase/Supabase) — currently single-device
  `localStorage` only
- Barcode/OCR meal logging, wearable integration

## Future feature ideas

- **AI workout recommendations** that adapt the weekly split itself (not just
  set/rep progression) based on recovery and consistency trends
- **Meal-plan generation** from the existing food database against remaining
  protein/calorie budget for the day
- **Wearable integration** (heart rate, sleep tracking) to replace the manual
  check-in fields with real sensor data
- **Barcode scanner** for faster food logging
- **Cloud sync** (Supabase/Firebase) for multi-device use and account backup

## License

Use freely for your own training.
