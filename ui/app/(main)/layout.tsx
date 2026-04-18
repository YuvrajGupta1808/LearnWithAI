import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { getCourses, getUserProgress } from "@/db/queries";

type Props = {
  children: React.ReactNode;
};

const MainLayout = async ({
  children,
}: Props) => {
  const [allCourses, userProgress] = await Promise.all([
    getCourses(),
    getUserProgress(),
  ]);

  return (
    <>
      <MobileHeader 
        activeCourses={allCourses} 
        activeCourseId={userProgress?.activeCourseId}
      />
      <Sidebar 
        activeCourses={allCourses} 
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
 
export default MainLayout;
