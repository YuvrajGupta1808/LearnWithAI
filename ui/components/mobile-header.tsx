import { courses } from "@/db/schema";
import { MobileSidebar } from "./mobile-sidebar";

type Props = {
  activeCourses?: typeof courses.$inferSelect[];
  activeCourseId?: number | null;
};

export const MobileHeader = ({ activeCourses, activeCourseId }: Props) => {
  return (
    <nav className="lg:hidden px-6 h-[50px] flex items-center bg-orange-400 border-b fixed top-0 w-full z-50">
      <MobileSidebar activeCourses={activeCourses} activeCourseId={activeCourseId} />
    </nav>
  );
};
