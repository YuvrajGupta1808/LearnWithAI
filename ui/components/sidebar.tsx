import {
  ClerkLoaded,
  ClerkLoading,
  UserButton,
} from "@clerk/nextjs";
import { Loader, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { courses } from "@/db/schema";
import { SidebarItem } from "./sidebar-item";

type Props = {
  className?: string;
  activeCourses?: typeof courses.$inferSelect[];
  activeCourseId?: number | null;
};

export const Sidebar = ({ className, activeCourses, activeCourseId }: Props) => {
  return (
    <div className={cn(
      "flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col",
      className,
    )}>
      <Link href="/courses">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image src="/MASCOT-LEARN.png" height={40} width={40} alt="Mascot" />
          <h1 className="text-2xl font-extrabold text-orange-400 tracking-wide">
            LearnWithAI
          </h1>
        </div>
      </Link>
      <div className="flex flex-col gap-y-2 flex-1">
        {activeCourses?.map((course) => (
          <SidebarItem 
            key={course.id}
            label={course.title} 
            href={`/learn/${course.id}`}
            iconSrc={course.imageSrc}
            active={course.id === activeCourseId}
          />
        ))}
        {activeCourses?.length === 0 && (
          <p className="text-sm text-neutral-500 px-4 py-2">
            No courses found.
          </p>
        )}
      </div>
      <div className="p-4 flex items-center justify-between w-full">
        <div>
          <ClerkLoading>
            <Loader className="h-5 w-5 text-muted-foreground animate-spin" />
          </ClerkLoading>
          <ClerkLoaded>
            <UserButton afterSignOutUrl="/" />
          </ClerkLoaded>
        </div>
        <Link href="/add">
          <Plus className="h-8 w-8 text-orange-400 cursor-pointer hover:opacity-75 transition" />
        </Link>
      </div>
    </div>
  );
};``
