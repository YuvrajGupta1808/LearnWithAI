import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import {
  CLIENT_POLL_INTERVAL_MS,
  MAX_DESCRIPTION_LENGTH,
  MAX_PDF_SIZE_BYTES,
} from "@/lib/course-generation/constants";
import { createCourseGenerationJob } from "@/lib/course-generation/jobs";
import {
  buildPdfStoragePath,
  uploadPdfToSupabase,
} from "@/lib/course-generation/supabase";
import { scheduleCourseGenerationJob } from "@/lib/course-generation/worker";

export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const rawDescription = formData.get("description");
  const file = formData.get("file");

  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return badRequest(
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
    );
  }

  if (!(file instanceof File)) {
    return badRequest("Please upload a PDF before submitting.");
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return badRequest("Only PDF uploads are supported.");
  }

  if (file.size === 0) {
    return badRequest("The uploaded PDF is empty.");
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return badRequest("PDFs must be 10MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = buildPdfStoragePath(userId, file.name);
  const upload = await uploadPdfToSupabase(buffer, storagePath, file.name);
  const job = await createCourseGenerationJob({
    userId,
    description: description || null,
    fileName: file.name,
    bucket: upload.bucket,
    storagePath: upload.storagePath,
  });

  scheduleCourseGenerationJob(job.id);

  return NextResponse.json(
    {
      jobId: job.id,
      pollIntervalMs: CLIENT_POLL_INTERVAL_MS,
    },
    { status: 202 },
  );
}
