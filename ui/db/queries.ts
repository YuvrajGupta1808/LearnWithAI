import { cache as reactCache } from "react";
import { eq } from "drizzle-orm";

/** React `cache` exists in Next's RSC bundle; plain `react` often does not, which breaks exports. */
const cache = (
  typeof reactCache === "function" ? reactCache : <T extends (...args: never[]) => unknown>(fn: T) => fn
) as typeof reactCache;
import { auth } from "@clerk/nextjs";

import db from "@/db/drizzle";
import { 
  courses, 
  lessons, 
  units, 
  userProgress,
  lessonProgress
} from "@/db/schema";

export const getUserProgress = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

export const getUnits = cache(async (courseId?: number) => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  const activeCourseId = courseId || userProgress?.activeCourseId;

  if (!userId || !activeCourseId) {
    return [];
  }

  const data = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          lessonProgress: {
            where: eq(lessonProgress.userId, userId),
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      const completed = lesson.lessonProgress.some((lp) => lp.completed);
      return { ...lesson, completed };
    });

    return { ...unit, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany();
  return data;
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
          },
        },
      },
    },
  });

  return data;
});

export const getCourseProgress = cache(async (courseId?: number) => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  const activeCourseId = courseId || userProgress?.activeCourseId;

  if (!userId || !activeCourseId) {
    return null;
  }

  const unitsInCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          lessonProgress: {
            where: eq(lessonProgress.userId, userId),
          },
        },
      },
    },
  });

  const firstUncompletedLesson = unitsInCourse
    .flatMap((unit) => unit.lessons)
    .find((lesson) => !lesson.lessonProgress.some((lp) => lp.completed));

  return {
    activeLesson: firstUncompletedLesson,
    activeLessonId: firstUncompletedLesson?.id,
  };
});

export const getLesson = cache(async (id?: number) => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const courseProgress = await getCourseProgress();
  const lessonId = id || courseProgress?.activeLessonId;

  if (!lessonId) {
    return null;
  }

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      unit: {
        with: {
          course: true,
        },
      },
      lessonProgress: {
        where: eq(lessonProgress.userId, userId),
      },
    },
  });

  if (!data) {
    return null;
  }

  const completed = data.lessonProgress.some((lp) => lp.completed);

  return { ...data, completed };
});

export const getLessonPercentage = cache(async (courseId?: number) => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();
  const activeCourseId = courseId || userProgress?.activeCourseId;

  if (!userId || !activeCourseId) {
    return 0;
  }

  const unitsInCourse = await db.query.units.findMany({
    where: eq(units.courseId, activeCourseId),
    with: {
      lessons: {
        with: {
          lessonProgress: {
            where: eq(lessonProgress.userId, userId),
          },
        },
      },
    },
  });

  const allLessons = unitsInCourse.flatMap((unit) => unit.lessons);
  const completedLessons = allLessons.filter((lesson) => 
    lesson.lessonProgress.some((lp) => lp.completed)
  );

  if (allLessons.length === 0) return 0;

  return Math.round((completedLessons.length / allLessons.length) * 100);
});

export const getActiveCourses = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const userProgress = await getUserProgress();
  
  const progressRecords = await db.query.lessonProgress.findMany({
    where: eq(lessonProgress.userId, userId),
    with: {
      lesson: {
        with: {
          unit: {
            with: {
              course: true
            }
          }
        }
      }
    }
  });

  const startedCourses = progressRecords
    .map(record => record.lesson.unit.course)
    .filter((course, index, self) => 
      course && self.findIndex(c => c?.id === course.id) === index
    );

  if (userProgress?.activeCourse && !startedCourses.find(c => c?.id === userProgress.activeCourseId)) {
    startedCourses.push(userProgress.activeCourse);
  }

  return startedCourses as (typeof courses.$inferSelect)[];
});
