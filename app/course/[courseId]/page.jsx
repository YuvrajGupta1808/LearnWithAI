"use client"
import Header from '@/app/_components/Header'
import ChapterList from '@/app/create-course/[courseId]/_components/ChapterList'
import CourseBasicInfo from '@/app/create-course/[courseId]/_components/CourseBasicInfo'
import CourseDetail from '@/app/create-course/[courseId]/_components/CourseDetail'
import React, { useEffect, useState } from 'react'
import { getCourseByCourseId } from '@/lib/insforgeDb'
import { isInsforgeConfigured } from '@/configs/insforgeClient'

function Course({params}) {
    const [course,setCourse]=useState();
    const [error,setError]=useState('');
    useEffect(()=>{
        if (!isInsforgeConfigured) {
            setError('Course database is not configured.');
            return;
        }
        params&&GetCourse();
    },[params])

    const GetCourse=async()=>{
        try {
            const result = await getCourseByCourseId(params?.courseId);
            setCourse(result);
            if (!result) {
                setError('Course not found.');
            }
        } catch (err) {
            console.error('Error loading course:', err);
            setError('Unable to load this course.');
        }
    }

  return (
    <div className="bg-slate-50/50 min-h-screen">
        <Header/>
        <div className='px-6 md:px-20 lg:px-44 py-12 max-w-7xl mx-auto'>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {error ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                        <h1 className="text-2xl font-black">Course unavailable</h1>
                        <p className="mt-2 text-sm font-medium">{error}</p>
                    </div>
                ) : (
                    <>
                        <CourseBasicInfo course={course} edit={false} />
                
                        <div className="mt-12 grid grid-cols-1 gap-12">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <CourseDetail course={course} />
                            </div>
                    
                            <ChapterList course={course} edit={false}/>
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  )
}

export default Course
