"use client";

import { toast } from "sonner";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { courses, userProgress } from "@/db/schema";
import { upsertUserProgress } from "@/actions/user-progress";

import { Card } from "./card";

type Props = {
  courses: typeof courses.$inferSelect[];
  activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
};

export const List = ({ courses, activeCourseId }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = (id: number) => {
    if (pending) return;

    if (id === activeCourseId) {
      return router.push(`/learn/${id}`);
    }

    startTransition(() => {
      upsertUserProgress(id)  
        .catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <div className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
      {courses.map((course) => (
        <Card
          key={course.id}
          id={course.id}
          title={course.title}
          imageSrc={course.imageSrc}
          onClick={onClick}
          disabled={pending}
          active={course.id === activeCourseId}
        />
      ))}
      <Link href="/add">
        <div 
          className="h-full border-2 rounded-xl border-b-4 hover:bg-black/5 cursor-pointer active:border-b-2 flex flex-col items-center justify-between p-3 pb-6 min-h-[217px] w-full"
        >
          <div className="min-[24px] w-full" />
          <span className="text-6xl text-orange-400 font-light">+</span>
          <p className="text-transparent font-bold mt-3">Plus</p>
        </div>
      </Link>
    </div>
  );
};
