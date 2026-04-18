import { redirect } from "next/navigation";

import { getLesson, getUserProgress } from "@/db/queries";
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Header } from "@/app/(main)/learn/header";

import { CompleteButton } from "./complete-button";
import { IMessageChatbot } from "./imessage-chatbot";

type Props = {
  params: {
    lessonId: number;
  };
};

const LessonIdPage = async ({
  params,
}: Props) => {
  const lessonData = getLesson(params.lessonId);
  const userProgressData = getUserProgress();

  const [
    lesson,
    userProgress,
  ] = await Promise.all([
    lessonData,
    userProgressData,
  ]);

  if (!lesson || !userProgress) {
    redirect("/learn");
  }

  return (
    <div className="flex w-full flex-col gap-8 p-3 pb-10 lg:flex-row lg:gap-[48px] lg:p-6">
      <FeedWrapper>
        <Header title={(lesson as any).unit.course.title} href="/learn" />
        <div className="flex flex-col gap-y-4 mt-4">
          {lesson.videoUrl ? (
             <div className="w-full max-w-[800px] aspect-video mx-auto rounded-2xl overflow-hidden border-2 border-neutral-300 shadow-sm">
               <iframe 
                 className="w-full h-full"
                 src={lesson.videoUrl.includes("youtube.com/embed") 
                   ? lesson.videoUrl 
                   : lesson.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
             </div>
           ) : (
             <div className="w-full max-w-[800px] aspect-video mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center space-y-3">
               <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center border-2 border-neutral-200">
                 <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
               </div>
               <p className="text-neutral-500 font-medium italic">Learning video content coming soon</p>
             </div>
           )}

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-700">{lesson.title}</h2>
            {lesson.content && (
              <div className="p-4 border-2 rounded-xl bg-white border-neutral-200">
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line text-base">
                  {lesson.content}
                </p>
              </div>
            )}
            {lesson.description && (
              <div className="p-3 border-2 rounded-xl bg-orange-50 border-orange-200">
                <p className="text-neutral-700 leading-relaxed text-base">
                  {lesson.description}
                </p>
              </div>
            )}
            {lesson.objectives && lesson.objectives.length > 0 && (
              <div className="p-3 border-2 rounded-xl bg-neutral-50 border-neutral-200 mt-3">
                <h3 className="font-bold text-base text-neutral-600 mb-1">Key Objectives:</h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600 font-medium text-sm">
                  {lesson.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </FeedWrapper>

      <StickyWrapper>
        <div className="flex w-full min-h-0 flex-1 flex-col gap-4 pt-4">
          <CompleteButton 
            lessonId={lesson.id} 
            isCompleted={(lesson as any).completed}
          />
          <IMessageChatbot />
        </div>
      </StickyWrapper>
    </div>
  );
};
 
export default LessonIdPage;
