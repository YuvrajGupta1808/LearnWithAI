import { generateCourseOutline } from "@/lib/course-generation/fireworks";
import {
  claimCourseGenerationJob,
  getNextPendingCourseGenerationJob,
  updateCourseGenerationJob,
} from "@/lib/course-generation/jobs";
import { extractPdfText } from "@/lib/course-generation/pdf";
import { persistGeneratedCourse } from "@/lib/course-generation/persist";
import { downloadPdfFromSupabaseBucket } from "@/lib/course-generation/supabase";
import { WORKER_POLL_INTERVAL_MS } from "@/lib/course-generation/constants";

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown course generation error";
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processCourseGenerationJob(jobId: number) {
  const job = await claimCourseGenerationJob(jobId);

  if (!job) {
    return null;
  }

  try {
    await updateCourseGenerationJob(job.id, {
      progress: 30,
      statusMessage: "Downloading the uploaded PDF.",
    });
    const pdfBuffer = await downloadPdfFromSupabaseBucket(job.bucket, job.storagePath);

    await updateCourseGenerationJob(job.id, {
      progress: 45,
      statusMessage: "Extracting readable text from the PDF.",
    });
    const pdfText = await extractPdfText(pdfBuffer);

    await updateCourseGenerationJob(job.id, {
      progress: 70,
      statusMessage: "Generating course structure and lesson content with AI.",
    });
    const outline = await generateCourseOutline(pdfText, job.description || undefined);

    await updateCourseGenerationJob(job.id, {
      progress: 90,
      statusMessage: "Saving the generated course to the database.",
      detectedSubject: outline.subject,
    });
    const courseId = await persistGeneratedCourse({
      jobId: job.id,
      userId: job.userId,
      outline,
    });

    return courseId;
  } catch (error) {
    await updateCourseGenerationJob(job.id, {
      status: "failed",
      progress: 100,
      statusMessage: "Generation failed.",
      errorMessage: normalizeErrorMessage(error),
    });

    return null;
  }
}

export async function processNextPendingCourseGenerationJob() {
  const job = await getNextPendingCourseGenerationJob();

  if (!job) {
    return false;
  }

  await processCourseGenerationJob(job.id);
  return true;
}

export function scheduleCourseGenerationJob(jobId: number) {
  setTimeout(() => {
    void processCourseGenerationJob(jobId);
  }, 0);
}

export async function runCourseGenerationWorker(options?: {
  once?: boolean;
  pollIntervalMs?: number;
}) {
  const once = options?.once ?? false;
  const pollIntervalMs = options?.pollIntervalMs ?? WORKER_POLL_INTERVAL_MS;

  while (true) {
    const processed = await processNextPendingCourseGenerationJob();

    if (!processed) {
      if (once) {
        break;
      }

      await sleep(pollIntervalMs);
      continue;
    }

    if (once) {
      continue;
    }
  }
}
