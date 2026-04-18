import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { getCourseGenerationJobForUser } from "@/lib/course-generation/jobs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawJobId = searchParams.get("jobId");
    const jobId = Number.parseInt(rawJobId ?? "", 10);

    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const job = await getCourseGenerationJobForUser(jobId, userId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      progress: job.progress,
      statusMessage: job.statusMessage,
      courseId: job.courseId,
      error: job.errorMessage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check generation status.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
