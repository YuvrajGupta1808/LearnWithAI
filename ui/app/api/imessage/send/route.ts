import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { sendIMessageToPhone } from "@/lib/photon/spectrum";

export const runtime = "nodejs";

type SendBody = {
  phoneNumber?: string;
  text?: string;
};

function normalizePhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

function isLikelyPhoneNumber(phoneNumber: string) {
  return /^\+\d{7,15}$/.test(phoneNumber);
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SendBody;

  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawPhoneNumber = body.phoneNumber?.trim();
  const text = body.text?.trim();

  if (!rawPhoneNumber) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }

  if (text.length > 1000) {
    return NextResponse.json(
      { error: "Message must be 1000 characters or fewer." },
      { status: 400 },
    );
  }

  const phoneNumber = normalizePhoneNumber(rawPhoneNumber);

  if (!isLikelyPhoneNumber(phoneNumber)) {
    return NextResponse.json(
      { error: "Use an E.164 style phone number, e.g. +1234567890." },
      { status: 400 },
    );
  }

  try {
    const result = await sendIMessageToPhone(phoneNumber, text);
    return NextResponse.json({ success: true, mode: result.mode });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send iMessage.";

    const lower = message.toLowerCase();
    if (lower.includes("target not allowed for this project")) {
      return NextResponse.json(
        {
          success: true,
          mode: "redirect",
          url: `sms:${phoneNumber}?body=${encodeURIComponent(text)}`,
          note: "Photon cloud send is blocked for this project. Opened Messages compose instead.",
        },
        { status: 200 },
      );
    }

    if (lower.includes("space creation is not supported in local mode")) {
      return NextResponse.json(
        {
          success: true,
          mode: "redirect",
          url: `sms:${phoneNumber}?body=${encodeURIComponent(text)}`,
          note: "Local mode cannot create new chats. Opened Messages compose instead.",
        },
        { status: 200 },
      );
    }

    if (
      lower.includes("failed to open database") ||
      lower.includes("unable to open database file")
    ) {
      return NextResponse.json(
        {
          success: true,
          mode: "redirect",
          url: `sms:${phoneNumber}?body=${encodeURIComponent(text)}`,
          note: "Local database access failed. Opened Messages compose instead.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
