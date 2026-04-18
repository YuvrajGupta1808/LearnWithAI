import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import {
  courses,
  courseGenerationJobs,
  lessons,
  units,
  userProgress,
} from "@/db/schema";
import { SUBJECTS } from "@/lib/course-generation/constants";
import type { GeneratedCourseOutline } from "@/lib/course-generation/types";

type PersistGeneratedCourseInput = {
  jobId: number;
  userId: string;
  outline: GeneratedCourseOutline;
};

export async function persistGeneratedCourse({
  jobId,
  userId,
  outline,
}: PersistGeneratedCourseInput) {
  const subjectConfig = SUBJECTS[outline.subject];

  const courseId = await db.transaction(async (tx) => {
    const [course] = await tx
      .insert(courses)
      .values({
        title: subjectConfig.title,
        bookTitle: outline.bookTitle,
        author: outline.author,
        imageSrc: subjectConfig.imageSrc,
      })
      .returning();

    for (let unitIndex = 0; unitIndex < outline.units.length; unitIndex += 1) {
      const unit = outline.units[unitIndex];

      const [insertedUnit] = await tx
        .insert(units)
        .values({
          courseId: course.id,
          title: unit.title,
          description: unit.description,
          order: unitIndex + 1,
          content: unit.content,
          objectives: unit.objectives,
        })
        .returning();

      await tx.insert(lessons).values({
        unitId: insertedUnit.id,
        title: unit.title,
        order: 1,
        description: unit.description,
        content: unit.content,
        objectives: unit.objectives,
        videoUrl: null,
      });
    }

    const existingUserProgress = await tx.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (existingUserProgress) {
      await tx
        .update(userProgress)
        .set({
          activeCourseId: course.id,
        })
        .where(eq(userProgress.userId, userId));
    } else {
      await tx.insert(userProgress).values({
        userId,
        activeCourseId: course.id,
      });
    }

    await tx
      .update(courseGenerationJobs)
      .set({
        courseId: course.id,
        detectedSubject: outline.subject,
        status: "completed",
        progress: 100,
        statusMessage: "Course ready. Redirecting now.",
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(courseGenerationJobs.id, jobId));

    return course.id;
  });

  return courseId;
}
