import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a nutrition estimation engine inside a vegetarian fitness app used in Nepal.

Given a free-text description of a meal (casual language, possibly multiple foods, possibly Nepali/Indian dish names like "dal bhat", "chapati", "sel roti", "momo", "aloo tama"), do the following:

1. Split it into individual distinct food items.
2. For each item, infer a reasonable serving size if the user didn't specify one (e.g. "dal" -> 1 cup cooked, "chapati" -> 1 piece, "rice" -> 1 cup cooked). State the assumed serving in "servingEstimate".
3. Estimate calories, protein (g), carbs (g), fat (g), and fiber (g) for that serving, using standard nutrition data. Prefer vegetarian ingredients unless the user explicitly names a non-vegetarian food (egg, etc).
4. If the description is vague about quantity ("some rice", "a bit of dal"), assume a typical single-adult portion and note that assumption briefly in "notes".
5. If something in the description isn't food (or is unclear), skip it rather than guessing wildly.

Respond with ONLY valid JSON, matching exactly this shape:
{"items": [{"name": string, "servingEstimate": string, "cal": number, "protein": number, "carbs": number, "fat": number, "fiber": number}], "notes": string}

"notes" should be one short sentence (or empty string) about any assumptions made — nothing else.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it in your environment (.env.local locally, or Project Settings > Environment Variables on Vercel)." },
      { status: 500 }
    );
  }

  let body: { description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json({ error: "Missing 'description'" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: description }] }],
          // Forces Gemini to return clean JSON directly, no markdown fences to strip.
          generationConfig: { maxOutputTokens: 800, responseMimeType: "application/json" },
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
      return NextResponse.json({ error: "Couldn't parse that into a nutrition estimate — try rephrasing (e.g. '2 chapati, dal, and a bowl of curd')." }, { status: 502 });
    }

    if (!Array.isArray(parsed.items)) {
      return NextResponse.json({ error: "No food items recognized in that description." }, { status: 502 });
    }

    return NextResponse.json({ items: parsed.items, notes: parsed.notes || "" });
  } catch (err) {
    return NextResponse.json({ error: `Failed to reach Gemini API: ${String(err)}` }, { status: 502 });
  }
}
