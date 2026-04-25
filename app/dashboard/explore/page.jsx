"use client"
import React, { useEffect, useState } from 'react'
import CourseCard from '../_components/CourseCard';
import { Button } from '@/components/ui/button';
import { listCoursesPage } from '@/lib/insforgeDb';
import { isInsforgeConfigured } from '@/configs/insforgeClient';

function Explore() {

  const [courseList,setCourseList]=useState([]);
  const [pageIndex,setPageIndex]=useState(0);

  useEffect(()=>{
    if (!isInsforgeConfigured) return;
    GetAllCourse();
  },[pageIndex])

  const GetAllCourse=async()=>{
    const result = await listCoursesPage(pageIndex, 9);
    setCourseList(result);
  }

  return (
    <div>
      <h2 className='font-bold text-3xl'>Explore More Projects</h2>
      <p>Explore more project build with AI by other users</p>
      {!isInsforgeConfigured && (
        <p className='mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900'>
          InsForge is not configured. Add `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` in `.env.local`.
        </p>
      )}

      <div className='grid grid-cols-2 lg:grid-cols-3 gap-5'>
        {courseList?.length>0?courseList?.map((course,index)=>(
          <div key={course?.id ?? index}>
            <CourseCard course={course} displayUser={true} />
          </div>
        )):
        [1,2,3,4,5].map((item,index)=>(
          <div key={index} className='w-full h-[230px] bg-slate-200 rounded-lg'>
          </div>
        ))
        }
      </div>

        {isInsforgeConfigured && <div className='flex justify-between mt-5'>
         {pageIndex!=0&& <Button onClick={()=>setPageIndex(pageIndex-1)}>Previous Page</Button>}

          <Button onClick={()=>setPageIndex(pageIndex+1)}>Next Page</Button>
      </div>}
    </div>
  )
}

export default Explore
