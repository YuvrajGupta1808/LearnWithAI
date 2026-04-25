import React from 'react'
import { HiOutlineCheckCircle, HiOutlineClock } from "react-icons/hi2";
import EditChapters from './EditChapters';
function ChapterList({course,refreshData,edit=true}) {
  return (
    <div className='mt-12'>
        <h2 className='font-extrabold text-2xl text-slate-800 mb-6 flex items-center gap-2'>
            <span className="w-2 h-8 bg-gradient-premium rounded-full"></span>
            Curriculum Breakdown
        </h2>
        <div className='grid gap-4'>
            {course?.courseOutput?.course?.chapters?.length ? course?.courseOutput?.course?.chapters.map((chapter,index)=>(
               <div key={index} className='group bg-white border border-slate-100 p-6 rounded-2xl flex items-center justify-between hover:shadow-premium transition-all duration-300 hover:border-primary/20'>
                <div className='flex gap-6 items-center'>
                        <div className='relative flex-none'>
                            <h2 className='bg-slate-50 border border-slate-100 flex items-center justify-center h-12 w-12 text-primary font-bold rounded-xl text-xl transition-all duration-300 group-hover:bg-gradient-premium group-hover:text-white group-hover:border-transparent group-hover:scale-110 shadow-sm'>
                                {index+1}
                            </h2>
                        </div>
                        <div className=''>
                            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
                                {chapter?.name}
                                {edit && <div className="scale-75 origin-left opacity-0 group-hover:opacity-100 transition-opacity"><EditChapters course={course} index={index} refreshData={refreshData} /></div>}
                            </h2>
                            <p className='text-slate-500 mt-1 line-clamp-2 max-w-2xl'>{chapter?.about}</p>
                            <div className='flex items-center gap-4 mt-3'>
                                <p className='flex gap-1.5 text-indigo-600 items-center text-sm font-semibold bg-indigo-50 px-3 py-1 rounded-full'> 
                                    <HiOutlineClock className="text-base" /> 
                                    {chapter?.duration}
                                </p>
                            </div>
                        </div>
                    </div>
                    <HiOutlineCheckCircle className='text-4xl text-slate-100 transition-colors duration-300 group-hover:text-green-400 flex-none ml-4' />
                </div>
            )) : (
                <div className='rounded-xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500'>
                    No chapters are available for this course yet.
                </div>
            )}
        </div>
    </div>
  )
}

export default ChapterList
