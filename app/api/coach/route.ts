import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server. Add it in your environment (.env.local locally, or Project Settings > Environment Variables on Vercel)." },
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

  const messages = [...history, { role: "user", content: message }].map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    const text = (data.content || [])
      .map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return NextResponse.json({ reply: text || "I couldn't generate a response just now — try asking again." });
  } catch (err) {
    return NextResponse.json({ error: `Failed to reach Anthropic API: ${String(err)}` }, { status: 502 });
  }
}
