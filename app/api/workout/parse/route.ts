import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a workout-log parsing engine inside a bodyweight + backpack training app.

Given the name of an exercise and a free-text note describing what the user did (casual language, e.g. "3 sets of 12, 5kg backpack, felt moderate" or "did 4x8 bodyweight, last set was tough"), extract structured data:

1. Break it into individual sets. If the note says "3 sets of 12" with one weight, produce 3 identical set entries. If sets vary ("10, 8, then 6 reps"), produce one entry per set as stated.
2. For each set, extract reps (integer) and weight in kg (the backpack weight used — 0 if bodyweight/not mentioned or unclear).
3. If the note gives no usable number of sets/reps at all, return an empty sets array rather than guessing wildly.
4. If the note describes how it felt (easy/hard/moderate/struggled/etc), infer a difficulty rating 1-10 (1 = very easy, 10 = extremely hard). If there's no signal, omit "difficulty" (use null).

Respond with ONLY valid JSON, matching exactly this shape:
{"sets": [{"reps": number, "weight": number}], "difficulty": number | null}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it in your environment (.env.local locally, or Project Settings > Environment Variables on Vercel)." },
      { status: 500 }
    );
  }

  let body: { exerciseName?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const exerciseName = body.exerciseName?.trim();
  const note = body.note?.trim();
  if (!exerciseName || !note) {
    return NextResponse.json({ error: "Missing 'exerciseName' or 'note'" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: `Exercise: ${exerciseName}\nNote: ${note}` }] }],
          generationConfig: { maxOutputTokens: 500, responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p.text || "")
      .join("\n")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Couldn't parse that note — try including numbers, e.g. '3 sets of 12, 5kg backpack'." }, { status: 502 });
    }

    if (!Array.isArray(parsed.sets)) {
      return NextResponse.json({ error: "No sets recognized in that note — try including numbers, e.g. '3 sets of 12, 5kg backpack'." }, { status: 502 });
    }

    return NextResponse.json({ sets: parsed.sets, difficulty: parsed.difficulty ?? null });
  } catch (err) {
    return NextResponse.json({ error: `Failed to reach Gemini API: ${String(err)}` }, { status: 502 });
  }
}
