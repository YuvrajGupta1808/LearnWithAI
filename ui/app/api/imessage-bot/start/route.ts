import { NextResponse } from "next/server";

import { startPhotonIMessageBot } from "@/lib/photon-imessage-bot";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await startPhotonIMessageBot();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start iMessage bot.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
