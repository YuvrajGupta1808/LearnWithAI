import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PhotonLine = {
  platform: "imessage" | "whatsapp_business";
  phoneNumber?: string;
};

function getPhotonAuthHeader() {
  const projectId = process.env.PHOTON_PROJECT_ID;
  const projectSecret = process.env.PHOTON_PROJECT_SECRET;

  if (!projectId || !projectSecret) {
    throw new Error("Photon credentials are not configured.");
  }

  const basic = Buffer.from(`${projectId}:${projectSecret}`).toString("base64");
  return {
    projectId,
    authorization: `Basic ${basic}`,
  };
}

async function fetchPhotonJson<T>(url: string, authorization: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: authorization,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Photon request failed (${response.status}).`);
  }

  return (await response.json()) as T;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, authorization } = getPhotonAuthHeader();

    const [iMessageInfo, linesResponse] = await Promise.all([
      fetchPhotonJson<{
        succeed: boolean;
        data: { type: "shared" | "dedicated" };
      }>(
        `https://spectrum.photon.codes/projects/${projectId}/imessage/`,
        authorization,
      ),
      fetchPhotonJson<{
        succeed: boolean;
        data: { lines: PhotonLine[] };
      }>(
        `https://spectrum.photon.codes/projects/${projectId}/lines/?platform=imessage`,
        authorization,
      ),
    ]);

    const iMessageLines = linesResponse.data.lines.filter(
      (line) => line.platform === "imessage",
    );

    return NextResponse.json({
      success: true,
      type: iMessageInfo.data.type,
      hasLine: iMessageLines.length > 0,
      lines: iMessageLines,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Photon status.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
