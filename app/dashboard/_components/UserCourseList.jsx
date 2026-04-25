"use client"
import React, { useContext, useEffect, useState } from 'react'
import CourseCard from './CourseCard'
import { UserCourseListContext } from '@/app/_context/UserCourseListContext'
import { isInsforgeConfigured } from '@/configs/insforgeClient'
import { listCoursesByUser } from '@/lib/insforgeDb'
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineSparkles } from 'react-icons/hi2';

const sampleCourses = [
  {
    title: 'Build Dashboards with AI',
    category: 'Data Visualization',
    level: 'Beginner',
    chapters: 5,
    duration: '4 hr',
  },
  {
    title: 'Prompt Engineering for Work',
    category: 'AI',
    level: 'Intermediate',
    chapters: 6,
    duration: '3 hr',
  },
  {
    title: 'SQL Analysis Sprint',
    category: 'Data Analysis',
    level: 'Beginner',
    chapters: 4,
    duration: '2 hr',
  },
]

function UserCourseList() {
  const [courseList,setCourseList]=useState([]);
  const {userCourseList,setUserCourseList}=useContext(UserCourseListContext);
  const isDbConfigured = Boolean(isInsforgeConfigured);


  useEffect(()=>{
    if (isDbConfigured) {
      getUserCourses();
    }
  },[isDbConfigured])

  const getUserCourses=async()=>{
    if (!isInsforgeConfigured) {
      setCourseList([]);
      setUserCourseList([]);
      return;
    }
    try {
      const result = await listCoursesByUser('guest@example.com');
      setCourseList(result);
      setUserCourseList(result);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourseList([]);
    }
  }
  return (
    <div className='mt-10'>
      <div className='mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
        <div>
          <p className='text-xs font-black uppercase tracking-[0.22em] text-primary'>Learning catalog</p>
          <h2 className='mt-2 text-2xl font-black tracking-tight text-[#061625]'>My AI Courses</h2>
        </div>
        <p className='max-w-lg text-sm font-medium leading-6 text-slate-500'>
          Browse generated courses, review chapter counts, and continue into the lesson workspace.
        </p>
      </div>
      {!isDbConfigured && (
        <p className='mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900'>
          InsForge is not configured. Add <code>NEXT_PUBLIC_INSFORGE_URL</code> and <code>NEXT_PUBLIC_INSFORGE_ANON_KEY</code> in <code>.env.local</code>.
        </p>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
        {courseList?.length > 0 ? courseList?.map((course, index) => (
          <CourseCard course={course} key={index} refreshData={() => getUserCourses()} />
        ))
          :
          sampleCourses.map((course, index) => (
            <div key={course.title} className='rounded-xl border border-slate-200 bg-white p-5 shadow-modern transition hover:-translate-y-0.5 hover:shadow-premium'>
              <div className='mb-5 flex h-40 items-end rounded-lg bg-[#061625] p-4 text-white'>
                <div>
                  <span className='inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-black text-[#061625]'>
                    <HiOutlineSparkles /> Demo
                  </span>
                  <h3 className='mt-3 text-xl font-black tracking-tight'>{course.title}</h3>
                </div>
              </div>
              <p className='text-xs font-black uppercase tracking-[0.18em] text-primary'>{course.category}</p>
              <div className='mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600'>
                <span className='flex items-center gap-1.5'><HiOutlineBookOpen /> {course.chapters} chapters</span>
                <span className='flex items-center gap-1.5'><HiOutlineClock /> {course.duration}</span>
                <span className='rounded-md bg-slate-100 px-2 py-1 text-xs text-[#061625]'>{course.level}</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default UserCourseList
