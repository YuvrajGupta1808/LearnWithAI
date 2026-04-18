import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RedirectBody = {
  userId?: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RedirectBody;

  try {
    body = (await request.json()) as RedirectBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = body.userId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "Shared user ID is required." }, { status: 400 });
  }

  if (!UUID_REGEX.test(userId)) {
    return NextResponse.json({ error: "Shared user ID must be a UUID." }, { status: 400 });
  }

  const response = await fetch(`https://spectrum.photon.codes/users/${userId}/redirect`, {
    method: "GET",
    redirect: "manual",
  });

  if (response.status === 302) {
    const url = response.headers.get("location");

    if (!url) {
      return NextResponse.json(
        { error: "Photon did not return a redirect URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, url });
  }

  if (response.status === 403) {
    return NextResponse.json(
      {
        error:
          "This user is not shared for your project, or iMessage is not enabled for the project.",
      },
      { status: 403 },
    );
  }

  if (response.status === 404) {
    return NextResponse.json({ error: "Shared user not found." }, { status: 404 });
  }

  if (response.status === 422) {
    return NextResponse.json(
      { error: "Shared user exists but has no assigned phone number." },
      { status: 422 },
    );
  }

  return NextResponse.json(
    { error: "Unable to create iMessage redirect for this shared user." },
    { status: 500 },
  );
}
