"use client"
import React, { useEffect, useState } from 'react'
import CourseBasicInfo from '../_components/CourseBasicInfo';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HiOutlineClipboardDocumentCheck, HiCheckBadge } from "react-icons/hi2";
import { isInsforgeConfigured } from '@/configs/insforgeClient';
import { getCourseByCourseId } from '@/lib/insforgeDb';

function FinishScreen({params}) {
    const [course,setCourse]=useState(null);
    const [error,setError]=useState('');
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
        console.error('Error loading finished course:', err);
        setError('Unable to load this finished course.');
      }
    }

  return (
    <div className='px-10 md:px-20 lg:px-64 my-16 animate-in fade-in zoom-in duration-700'>
        <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <HiCheckBadge className="text-5xl text-green-500" />
            </div>
            <h2 className='text-center font-black text-4xl md:text-5xl text-slate-900 tracking-tight'>
                Congratulations! <br/>
                <span className="text-gradient">Your course is Ready</span>
            </h2>
            <p className="text-slate-500 mt-4 text-lg">Your AI-generated curriculum has been finalized and is ready to be shared.</p>
        </div>
       
        <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
            {error ? (
              <p className='m-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900'>{error}</p>
            ) : (
              <CourseBasicInfo course={course} refreshData={()=>console.log()} />
            )}
        </div>

        <div className="mt-12 bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <h2 className='font-bold text-xl text-slate-800 mb-4'>Share Course URL:</h2>
            <div className='bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center group hover:border-primary/30 transition-all'>
                <code className='text-slate-600 font-mono text-sm break-all'>
                    {process.env.NEXT_PUBLIC_HOST_NAME}/course/{course?.courseId}
                </code>
                <button 
                    className="p-3 bg-slate-100 rounded-xl hover:bg-primary hover:text-white transition-all ml-4"
                    onClick={async()=>await navigator.clipboard.writeText(process.env.NEXT_PUBLIC_HOST_NAME+"/course/"+course?.courseId)}
                >
                    <HiOutlineClipboardDocumentCheck className='h-6 w-6' />
                </button>
            </div>
        </div>

        <div className="mt-10 flex justify-center">
            <Link href="/dashboard">
                <Button variant="ghost" className="text-slate-500 hover:text-primary">
                    Return to Dashboard
                </Button>
            </Link>
        </div>
    </div>
  )
}

export default FinishScreen
