import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.FIREWORKS_API_KEY || process.env.NEXT_PUBLIC_FIREWORKS_API_KEY;
const model = process.env.NEXT_PUBLIC_FIREWORKS_MODEL || "accounts/fireworks/models/kimi-k2p6";

const client = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: "https://api.fireworks.ai/inference/v1",
    })
  : null;

const SYSTEM_PROMPT = "You generate strict JSON only. Do not wrap JSON in markdown code fences.";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!client) {
      return NextResponse.json({ error: "Fireworks API key is missing on the server." }, { status: 500 });
    }

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    return NextResponse.json({ result: content });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 });
  }
}
