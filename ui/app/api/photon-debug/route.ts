import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PhotonApiResponse = {
  status: number;
  body: unknown;
  error?: string;
};

async function callPhoton(path: string, authHeader: string): Promise<PhotonApiResponse> {
  try {
    const response = await fetch(`https://spectrum.photon.codes${path}`, {
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const text = await response.text();
    let body: unknown = text;

    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    return {
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      status: 0,
      body: null,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  }
}

export async function GET() {
  const projectId = process.env.PHOTON_PROJECT_ID?.trim();
  const projectSecret = process.env.PHOTON_PROJECT_SECRET?.trim();

  if (!projectId || !projectSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing PHOTON_PROJECT_ID or PHOTON_PROJECT_SECRET.",
      },
      { status: 500 },
    );
  }

  const basicAuth = `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString(
    "base64",
  )}`;

  const [imessageInfo, platforms, lines] = await Promise.all([
    callPhoton(`/projects/${projectId}/imessage/`, basicAuth),
    callPhoton(`/projects/${projectId}/platforms/`, basicAuth),
    callPhoton(`/projects/${projectId}/lines/?platform=imessage`, basicAuth),
  ]);

  const warnings: string[] = [];
  const lineCount = Array.isArray(
    (lines.body as { data?: { lines?: unknown[] } })?.data?.lines,
  )
    ? ((lines.body as { data?: { lines?: unknown[] } }).data?.lines?.length ?? 0)
    : 0;

  if (lineCount === 0) {
    warnings.push(
      "No iMessage lines found for this project. Shared projects can still work via mapped shared users, but direct target sends may fail.",
    );
  }

  if (
    (platforms.body as { data?: { imessage?: { enabled?: boolean } } })?.data
      ?.imessage?.enabled === false
  ) {
    warnings.push("iMessage platform is disabled for this project.");
  }

  if (!global.__photonIMessageBotStarted) {
    warnings.push("iMessage bot loop is not marked as started in this process.");
  }

  return NextResponse.json({
    ok: true,
    projectId,
    bot: {
      started: Boolean(global.__photonIMessageBotStarted),
      starting: Boolean(global.__photonIMessageBotStartingPromise),
    },
    photon: {
      imessageInfo,
      platforms,
      lines,
    },
    warnings,
  });
}
