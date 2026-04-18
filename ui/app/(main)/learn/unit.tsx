import { lessons, units } from "@/db/schema"

import { UnitBanner } from "./unit-banner";
import { LessonButton } from "./lesson-button";

type Props = {
  id: number;
  order: number;
  bookTitle: string;
  lessonCount: number;
  lessons: (typeof lessons.$inferSelect & {
    completed: boolean;
  })[];
  activeLesson: typeof lessons.$inferSelect & {
    unit: typeof units.$inferSelect;
  } | undefined;
  activeLessonPercentage: number;
};

export const Unit = ({
  id,
  order,
  bookTitle,
  lessonCount,
  lessons,
  activeLesson,
  activeLessonPercentage,
}: Props) => {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <>
      <UnitBanner 
        title={bookTitle}
        lessonCount={lessonCount}
        href={activeLesson ? `/lesson/${activeLesson.id}` : `/lesson/${lessons[0].id}`}
      />
      <div className="flex items-center flex-col relative">
        {lessons.map((lesson, index) => {
          const isCurrent = lesson.id === activeLesson?.id;
          const isLocked = !lesson.completed && !isCurrent;

          return (
            <LessonButton
              key={lesson.id}
              id={lesson.id}
              index={index}
              totalCount={lessons.length - 1}
              current={isCurrent}
              locked={isLocked}
              percentage={activeLessonPercentage}
            />
          );
        })}
      </div>
    </>
  );
};
