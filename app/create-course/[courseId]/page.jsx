"use client"
import React, { useEffect, useState } from 'react'
import CourseBasicInfo from './_components/CourseBasicInfo'
import CourseDetail from './_components/CourseDetail'
import ChapterList from './_components/ChapterList'
import { Button } from '@/components/ui/button'
import { GenerateChapterContent_AI } from '@/configs/AiModel'
import LoadingDialog from '../_components/LoadingDialog'
import service from '@/configs/service'
import { useRouter } from 'next/navigation'
import { isInsforgeConfigured } from '@/configs/insforgeClient'
import { createChapter, getCourseByCourseId, updateCourseByCourseId } from '@/lib/insforgeDb'

function CourseLayout({ params }) {
  const [course,setCourse]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [progress, setProgress] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const router=useRouter();
  useEffect(() => {
    if (!isInsforgeConfigured) {
      setError('InsForge is not configured. Add database keys in `.env.local`.');
      return;
    }
    params && GetCourse();
  }, [params])

  const GetCourse = async () => {
    try {
      const result = await getCourseByCourseId(
        params?.courseId,
        'guest@example.com'
      );
      setCourse(result);
      if (!result) setError('Course not found.');
    } catch (err) {
      console.error('Error loading course layout:', err);
      setError('Unable to load this course layout.');
    }
  }

  const GenerateChapterContent = async () => {
    setLoading(true);
    const chapters = course?.courseOutput?.course?.chapters;

    try {
      if (!chapters?.length) {
        throw new Error('This course has no chapters to generate.');
      }
      setTotalChapters(chapters.length);
      for (const [index, chapter] of chapters.entries()) {
        setProgress(index + 1);
        const PROMPT = `Act as an expert educator. Explain the following concept in great detail.
        Topic: ${course?.name}
        Chapter: ${chapter?.name}
        
        Provide the response in JSON format as an array of objects. Each object should represent a section of the chapter and include:
        - "title": A descriptive title for the section.
        - "description": A deep dive explanation (at least 2-3 paragraphs).
        - "code": A code example if applicable, formatted inside <precode> tags.
        
        Return ONLY the JSON array.`;
        console.log(PROMPT);

        let videoId = '';

        // Generate Video URL
        try {
          const resp = await service.getVideos(`${course?.name}:${chapter?.name}`);
          videoId = resp[0]?.id?.videoId || '';
          console.log(resp);
        } catch (videoError) {
          console.error('Error fetching video:', videoError);
        }

        // Generate chapter content
        const result = await GenerateChapterContent_AI.sendMessage(PROMPT);
        const content = JSON.parse(result?.response?.text());

        // Save Chapter Content + Video URL
        await createChapter({
          chapterId: index,
          courseId: course?.courseId,
          content: content,
          videoId: videoId
        });
      }

      await updateCourseByCourseId(course?.courseId, {
        publish: true
      });

      router.replace('/create-course/' + course?.courseId + "/finish");
    } catch (e) {
      console.error('Error generating course content:', e);
      alert("An error occurred during chapter generation. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className='mt-10 px-7 md:px-20 lg:px-44'>
      <h2 className='font-bold text-center text-2xl'>Course Layout</h2>
      {error && (
        <p className='mx-auto mt-4 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900'>
          {error}
        </p>
      )}

      <LoadingDialog loading={loading} progress={progress} total={totalChapters} />
      {/* Basic Info  */}
        <CourseBasicInfo course={course} refreshData={()=>GetCourse()} />
      {/* Course Detail  */}
        <CourseDetail course={course} />
      {/* List of Lesson  */}
        <ChapterList course={course} refreshData={()=>GetCourse()}/>

      <Button disabled={Boolean(error) || !course} onClick={GenerateChapterContent} className="my-10">Generate Course Content</Button>
    </div>
  )
}

export default CourseLayout
