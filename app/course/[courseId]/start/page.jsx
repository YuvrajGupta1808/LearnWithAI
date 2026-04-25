"use client"
import React, { useEffect, useState } from 'react'
import ChapterListCard from './_components/ChapterListCard'
import ChapterContent from './_components/ChapterContent'
import { getChapterByCourseAndChapterId, getCourseByCourseId } from '@/lib/insforgeDb'
import { isInsforgeConfigured } from '@/configs/insforgeClient'

function CourseStart({params}) {

    const [course,setCourse]=useState();
    const [selectedChapter,setSelectedChapter]=useState(null);
    const [chapterContent,setChapterContent]=useState();
    const [error,setError]=useState('');
    useEffect(()=>{
        if (!isInsforgeConfigured) {
            setError('Course database is not configured.');
            return;
        }
        GetCourse();
    },[])

    // useEffect(()=>{
       
    //     GetSelectedChapterContent(0)
    // },[course])

    /**
     * Used to get Course Info by Course Id
     */
    const GetCourse=async()=>{
        try {
            const result = await getCourseByCourseId(params?.courseId);
            setCourse(result);
            const firstChapter = result?.courseOutput?.course?.chapters?.[0];
            if (firstChapter) {
                setSelectedChapter(firstChapter);
                await GetSelectedChapterContent(0, result?.courseId);
            } else {
                setError('This course has no chapters yet.');
            }
        } catch (err) {
            console.error('Error loading course:', err);
            setError('Unable to load this course.');
        }

    }

    const GetSelectedChapterContent=async(chapterId, courseId = course?.courseId)=>{
        try {
            const result = await getChapterByCourseAndChapterId(courseId, chapterId);
            setChapterContent(result);
        } catch (err) {
            console.error('Error loading chapter content:', err);
            setChapterContent(null);
        }

    }

    if (error) {
        return (
            <div className='min-h-screen bg-slate-50 p-8'>
                <div className='mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900'>
                    <h1 className='text-2xl font-black'>Course unavailable</h1>
                    <p className='mt-2 text-sm font-medium'>{error}</p>
                </div>
            </div>
        )
    }

  return (
    <div>
        {/* Chapter list Side Bar  */}
        <div className=' fixed md:w-72 hidden md:block h-screen border-r shadow-sm'>
            <h2 className='font-medium text-lg bg-primary p-4
            text-white'>{course?.courseOutput?.course?.name}</h2>

            <div>
                {course?.courseOutput?.course?.chapters?.map((chapter,index)=>(
                    <div key={index} 
                    className={`cursor-pointer
                    hover:bg-purple-50
                    ${selectedChapter?.name==chapter?.name&&'bg-purple-100'}
                    `}
                    onClick={()=>{setSelectedChapter(chapter);
                    GetSelectedChapterContent(index)
                    }}
                    >
                        <ChapterListCard chapter={chapter} index={index} />
                    </div>
                ))}
            </div>
        </div>
        {/* Content Div  */}
        <div className='md:ml-72'>
            <ChapterContent chapter={selectedChapter}
                content={chapterContent}
            />
        </div>
    </div>
  )
}

export default CourseStart
