import { redirect } from "next/navigation";


import {
  getUserProgress
} from "@/db/queries";


const LearnPage = async () => {
  const userProgress = await getUserProgress();

  if (!userProgress || !userProgress.activeCourseId) {
    redirect("/courses");
  }

  redirect(`/learn/${userProgress.activeCourseId}`);
};
 
export default LearnPage;
