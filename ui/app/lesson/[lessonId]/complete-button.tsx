"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { completeLesson } from "@/actions/complete-lesson";

type Props = {
  lessonId: number;
  isCompleted: boolean;
};

export const CompleteButton = ({ lessonId, isCompleted }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (isCompleted) {
      router.push("/learn");
      return;
    }

    startTransition(() => {
      completeLesson(lessonId)
        .then((res) => {
          if (res?.success) {
            toast.success("Lesson completed!");
            router.push("/learn");
          }
        })
        .catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <Button
      onClick={onClick}
      disabled={pending}
      size="lg"
      variant={isCompleted ? "secondary" : "secondary"}
      className="w-full h-[52px] border-b-4 active:border-b-2"
    >
      <CheckCircle className="mr-2 h-5 w-5" />
      {isCompleted ? "Chapter Completed" : "Complete the Chapter"}
    </Button>
  );
};
