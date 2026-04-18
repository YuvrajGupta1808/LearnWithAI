import { and, eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { courseGenerationJobs } from "@/db/schema";
import type { CourseGenerationStatus } from "@/lib/course-generation/types";

type CreateJobInput = {
  userId: string;
  description: string | null;
  fileName: string;
  bucket: string;
  storagePath: string;
};

export async function createCourseGenerationJob(input: CreateJobInput) {
  const [job] = await db
    .insert(courseGenerationJobs)
    .values({
      ...input,
      status: "pending",
      progress: 10,
      statusMessage: "PDF uploaded. Waiting to start generation.",
    })
    .returning();

  return job;
}

export async function getCourseGenerationJob(jobId: number) {
  return db.query.courseGenerationJobs.findFirst({
    where: eq(courseGenerationJobs.id, jobId),
  });
}

export async function getCourseGenerationJobForUser(jobId: number, userId: string) {
  return db.query.courseGenerationJobs.findFirst({
    where: and(
      eq(courseGenerationJobs.id, jobId),
      eq(courseGenerationJobs.userId, userId),
    ),
  });
}

export async function getNextPendingCourseGenerationJob() {
  return db.query.courseGenerationJobs.findFirst({
    where: eq(courseGenerationJobs.status, "pending"),
    orderBy: (jobs, { asc }) => [asc(jobs.createdAt)],
  });
}

export async function claimCourseGenerationJob(jobId: number) {
  const [job] = await db
    .update(courseGenerationJobs)
    .set({
      status: "processing",
      progress: 20,
      statusMessage: "Starting course generation.",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courseGenerationJobs.id, jobId),
        eq(courseGenerationJobs.status, "pending"),
      ),
    )
    .returning();

  return job ?? null;
}

export async function updateCourseGenerationJob(
  jobId: number,
  updates: Partial<{
    detectedSubject: string | null;
    errorMessage: string | null;
    courseId: number | null;
    progress: number;
    status: CourseGenerationStatus;
    statusMessage: string | null;
  }>,
) {
  const [job] = await db
    .update(courseGenerationJobs)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(courseGenerationJobs.id, jobId))
    .returning();

  return job;
}
