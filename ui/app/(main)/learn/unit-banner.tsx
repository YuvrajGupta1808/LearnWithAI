import Link from "next/link";
import { NotebookText } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  lessonCount: number;
  href?: string;
};

export const UnitBanner = ({
  title,
  lessonCount,
  href = "/lesson",
}: Props) => {
  return (
    <div className="w-full rounded-xl bg-orange-400 p-5 text-white flex items-center justify-between">
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">
          {title}
        </h3>
        <p className="text-lg">
          {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
        </p>
      </div>
      <Link href={href}>
        <Button
          size="lg"
          variant="secondary"
          className="hidden xl:flex border-2 border-b-4 active:border-b-2"
        >
          <NotebookText className="mr-2" />
          Continue
        </Button>
      </Link>
    </div>
  );
};
