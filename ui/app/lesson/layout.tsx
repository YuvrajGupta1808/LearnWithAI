import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { getActiveCourses, getUserProgress } from "@/db/queries";

type Props = {
  children: React.ReactNode;
};

const LessonLayout = async ({ children }: Props) => {
  const [activeCourses, userProgress] = await Promise.all([
    getActiveCourses(),
    getUserProgress(),
  ]);

  return ( 
    <>
      <MobileHeader 
        activeCourses={activeCourses} 
        activeCourseId={userProgress?.activeCourseId}
      />
      <Sidebar 
        activeCourses={activeCourses} 
        activeCourseId={userProgress?.activeCourseId}
        className="hidden lg:flex" 
      />
      <main className="lg:pl-[280px] h-full pt-[50px] lg:pt-0">
        <div className="w-full pt-6 h-full px-6">
          {children}
        </div>
      </main>
    </>
  );
};
 
export default LessonLayout;
