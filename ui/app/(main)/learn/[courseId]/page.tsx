import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import {
  getCourseById,
  getCourseProgress,
  getLessonPercentage,
  getUnits,
  getUserProgress
} from "@/db/queries";
import { lessons, units as unitsSchema } from "@/db/schema";

import { Header } from "../header";
import { Unit } from "../unit";

type Props = {
  params: {
    courseId: string;
  };
};

const CourseIdPage = async ({
  params,
}: Props) => {
  const courseId = parseInt(params.courseId);
  
  if (isNaN(courseId)) {
    redirect("/courses");
  }

  const userProgressData = getUserProgress();
  const courseProgressData = getCourseProgress(courseId);
  const lessonPercentageData = getLessonPercentage(courseId);
  const unitsData = getUnits(courseId);
  const courseData = getCourseById(courseId);

  const [
    userProgress,
    units,
    courseProgress,
    lessonPercentage,
    course,
  ] = await Promise.all([
    userProgressData,
    unitsData,
    courseProgressData,
    lessonPercentageData,
    courseData,
  ]);

  if (!userProgress || !course) {
    redirect("/courses");
  }

  if (!courseProgress) {
    redirect("/courses");
  }

  const { activeLesson } = courseProgress;

  const title = course.title;
  const bookTitle = course.bookTitle || course.title;
  const allLessons = units.flatMap((unit) => unit.lessons);
  const totalLessons = units.reduce((count, unit) => count + unit.lessons.length, 0);
  const currentUnit =
    units.find((unit) => unit.id === activeLesson?.unitId) ?? units[0];

  return (
    <div className="flex gap-[48px] w-full">
      <FeedWrapper>
        <Header title={title} href="/courses" />
        {currentUnit && (
          <div key={currentUnit.id} className="mb-10">
            <Unit
              id={currentUnit.id}
              order={currentUnit.order}
              bookTitle={bookTitle}
              lessonCount={totalLessons}
              lessons={allLessons}
              activeLesson={courseProgress.activeLesson as typeof lessons.$inferSelect & {
                unit: typeof unitsSchema.$inferSelect;
              } | undefined}
              activeLessonPercentage={lessonPercentage}
            />
          </div>
        )}
      </FeedWrapper>
      <StickyWrapper>
        <div className="w-full space-y-4 pt-4">
          <div className="border-2 border-neutral-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-lg text-neutral-700">
              {activeLesson?.title || currentUnit?.title} Overview
            </h3>
            
            {(activeLesson?.content || activeLesson?.description || currentUnit?.content) && (
              <div className="bg-orange-50 border-orange-200 border rounded-xl p-4 text-sm text-neutral-700 leading-relaxed">
                {activeLesson?.content || activeLesson?.description || currentUnit?.content}
              </div>
            )}
            
            {((activeLesson as any)?.objectives || currentUnit?.objectives) && (activeLesson as any)?.objectives?.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-sm text-neutral-700">Key Objectives:</h4>
                <div className="space-y-2">
                  {(activeLesson as any).objectives.map((objective: string, index: number) => (
                    <div key={index} className="flex items-center gap-x-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                      <p className="text-sm text-neutral-600">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-2 border-orange-200 rounded-xl p-5 space-y-4 bg-orange-50">
            <h3 className="font-bold text-lg text-orange-500">Up Next</h3>
            <p className="text-orange-400 text-sm">Continue your journey through {title} and unlock new challenges.</p>
          </div>
        </div>
      </StickyWrapper>
    </div>
  );
};
 
export default CourseIdPage;
