import React from 'react'
import { HiOutlineChartBar,HiOutlineClock,HiOutlineBookOpen,HiOutlinePlayCircle } from "react-icons/hi2";
function CourseDetail({course}) {
  return (
    <div className='bg-white border border-slate-100 p-8 rounded-3xl shadow-premium mt-6'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
            <div className='flex items-center gap-4 group cursor-default'>
                <div className='p-3 bg-purple-50 rounded-2xl group-hover:bg-purple-100 transition-colors'>
                    <HiOutlineChartBar className='text-3xl text-primary' />
                </div>
                <div>
                    <h2 className='text-xs font-bold uppercase tracking-widest text-slate-400'>Skill Level</h2>
                    <h2 className='font-bold text-lg text-slate-700'>{course?.level}</h2>
                </div>
            </div>
            
            <div className='flex items-center gap-4 group cursor-default'>
                <div className='p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors'>
                    <HiOutlineClock className='text-3xl text-indigo-600' />
                </div>
                <div>
                    <h2 className='text-xs font-bold uppercase tracking-widest text-slate-400'>Duration</h2>
                    <h2 className='font-bold text-lg text-slate-700'>{course?.courseOutput?.course?.duration}</h2>
                </div>
            </div>
            
            <div className='flex items-center gap-4 group cursor-default'>
                <div className='p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-100 transition-colors'>
                    <HiOutlineBookOpen className='text-3xl text-blue-600' />
                </div>
                <div>
                    <h2 className='text-xs font-bold uppercase tracking-widest text-slate-400'>Chapters</h2>
                    <h2 className='font-bold text-lg text-slate-700'>{course?.courseOutput?.course?.numberOfChapters}</h2>
                </div>
            </div>
            
            <div className='flex items-center gap-4 group cursor-default'>
                <div className='p-3 bg-rose-50 rounded-2xl group-hover:bg-rose-100 transition-colors'>
                    <HiOutlinePlayCircle className='text-3xl text-rose-600' />
                </div>
                <div>
                    <h2 className='text-xs font-bold uppercase tracking-widest text-slate-400'>Multimedia</h2>
                    <h2 className='font-bold text-lg text-slate-700'>{course?.includeVideo === 'Yes' ? 'Video Included' : 'Text Only'}</h2>
                </div>
            </div>
        </div>
    </div>
  )
}

export default CourseDetail