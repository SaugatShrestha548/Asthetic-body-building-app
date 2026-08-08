import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it in your environment (.env.local locally, or Project Settings > Environment Variables on Vercel)." },
      { status: 500 }
    );
  }

  let body: { message?: string; history?: ChatMessage[]; systemPrompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { message, history = [], systemPrompt = "" } = body;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing 'message'" }, { status: 400 });
  }

  // Gemini uses "model" instead of "assistant" for the AI turn, and takes the
  // system prompt as a separate field rather than inline in the messages.
  const contents = [...history, { role: "user" as const, content: message }].map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 1000 },
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

    return NextResponse.json({ reply: text || "I couldn't generate a response just now — try asking again." });
  } catch (err) {
    return NextResponse.json({ error: `Failed to reach Gemini API: ${String(err)}` }, { status: 502 });
  }
}
