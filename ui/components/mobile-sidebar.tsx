import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";
import { courses } from "@/db/schema";

type Props = {
  activeCourses?: typeof courses.$inferSelect[];
  activeCourseId?: number | null;
};

export const MobileSidebar = ({ activeCourses, activeCourseId }: Props) => {
  return (
    <Sheet>
      <SheetTrigger>
        <Menu className="text-white" />
      </SheetTrigger>
      <SheetContent className="p-0 z-[100]" side="left">
        <Sidebar activeCourses={activeCourses} activeCourseId={activeCourseId} />
      </SheetContent>
    </Sheet>
  );
};
