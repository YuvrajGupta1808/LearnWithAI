"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs";

import db from "@/db/drizzle";
import { lessonProgress, userProgress } from "@/db/schema";
import { getLesson, getUserProgress } from "@/db/queries";

export const completeLesson = async (lessonId: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const lesson = await getLesson(lessonId);

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  const existingProgress = await db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.lessonId, lessonId)
    )
  });

  if (!existingProgress) {
    await db.insert(lessonProgress).values({
      userId,
      lessonId,
      completed: true,
    });
  } else if (!existingProgress.completed) {
    await db.update(lessonProgress).set({
      completed: true,
    }).where(eq(lessonProgress.id, existingProgress.id));
  }

  revalidatePath("/learn");
  revalidatePath(`/learn/${lesson.unit.courseId}`);
  revalidatePath(`/lesson/${lessonId}`);
  
  return { success: true };
};
