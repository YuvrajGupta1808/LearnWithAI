"use client"
import { UserCourseListContext } from '@/app/_context/UserCourseListContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useContext } from 'react'
import { HiOutlineAcademicCap, HiOutlineArrowRight, HiOutlineClock, HiOutlinePlayCircle } from 'react-icons/hi2';
function AddCourse() {
    const {userCourseList,setUserCourseList}=useContext(UserCourseListContext)

    return (
    <div className='grid gap-8 overflow-hidden rounded-xl bg-[#061625] p-6 text-white shadow-premium md:grid-cols-[1.1fr_.9fr] md:p-10'>
        <div>
            <div className='mb-8 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary'>
                <HiOutlineAcademicCap className='text-base' />
                Course studio
            </div>
            <h2 className='max-w-xl text-4xl font-black tracking-tight md:text-5xl'>
                Create a course learners can start today
            </h2>
            <p className='mt-4 max-w-xl text-base font-medium leading-7 text-slate-300'>
                Generate a syllabus, chapter list, timing, and video-supported learning path from one focused topic brief.
            </p>
            <div className='mt-8'>
                <Link href={userCourseList?.length>=5?'/dashboard/upgrade':'/create-course'}>
                    <Button className="h-13 rounded-md bg-primary px-7 py-6 text-base font-black text-[#061625] hover:bg-[#00d864]">
                        Create New Course <HiOutlineArrowRight className='ml-2 text-lg' />
                    </Button>
                </Link>
            </div>
        </div>
        <div className='rounded-xl border border-white/10 bg-white p-5 text-[#061625]'>
            <p className='text-xs font-black uppercase tracking-[0.2em] text-primary'>Next course</p>
            <h3 className='mt-3 text-2xl font-black tracking-tight'>AI Product Analytics</h3>
            <p className='mt-3 text-sm font-medium leading-6 text-slate-600'>Recommended structure for a practical course with project checkpoints.</p>
            <div className='mt-6 grid grid-cols-2 gap-3'>
                <div className='rounded-lg bg-slate-100 p-4 font-bold'>
                    <HiOutlineClock className='mb-2 text-xl text-slate-500' />
                    3 hr path
                </div>
                <div className='rounded-lg bg-slate-100 p-4 font-bold'>
                    <HiOutlinePlayCircle className='mb-2 text-xl text-slate-500' />
                    8 lessons
                </div>
            </div>
            <div className='mt-5 h-2 overflow-hidden rounded-full bg-slate-100'>
                <div className='h-full w-2/3 rounded-full bg-primary' />
            </div>
        </div>
    </div>
  )
}

export default AddCourse
