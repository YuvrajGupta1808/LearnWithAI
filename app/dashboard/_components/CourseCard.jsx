import Image from 'next/image'
import React from 'react'
import { HiOutlineBookOpen } from "react-icons/hi2";
import { HiMiniEllipsisVertical } from "react-icons/hi2";
import DropdownOption from './DropdownOption';
import Link from 'next/link';
import { deleteCourseById } from '@/lib/insforgeDb';


function CourseCard({course,refreshData,displayUser=false}) {
    const title = course?.courseOutput?.course?.name || course?.name || 'Untitled course';
    const chapterCount = course?.courseOutput?.course?.numberOfChapters
        || course?.courseOutput?.course?.chapters?.length
        || 0;
    const bannerSrc = course?.courseBanner || '/placeholder.png';
    const creatorImage = course?.userProfileImage || '/placeholder.png';

    const handleOnDelete=async()=>{
        const resp = await deleteCourseById(course?.id);
        
        if(resp)
        {
            refreshData()
        }
    }

  return (
    <div className='group relative bg-white rounded-xl border border-slate-200 shadow-modern card-hover overflow-hidden'>
        <Link href={course?.courseId ? '/course/'+course?.courseId : '/dashboard'}>
            <div className="relative h-48 overflow-hidden">
                <Image src={bannerSrc} width={300} height={200}
                className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                alt={title}
                />
                <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-primary text-[10px] font-black uppercase tracking-wider text-[#061625] rounded-md shadow-sm">
                    {course?.category || 'Course'}
                    </span>
                </div>
            </div>
        </Link>
        <div className='p-5'>
            <div className='flex justify-between items-start mb-3'>
                <h2 className='font-black text-[#061625] line-clamp-2 leading-snug group-hover:text-primary transition-colors'>
                    {title}
                </h2>
                {!displayUser && (
                    <div className="ml-2">
                        <DropdownOption handleOnDelete={() => handleOnDelete()}>
                            <div className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <HiMiniEllipsisVertical className="text-slate-400"/>
                            </div>
                        </DropdownOption>
                    </div>
                )}
            </div>
            
            <div className='flex items-center gap-4 mt-auto'>
                <div className='flex items-center gap-1.5 text-slate-500'>
                    <HiOutlineBookOpen className="text-sm"/>
                    <span className='text-xs font-medium'>{chapterCount} Chapters</span>
                </div>
                    <div className='px-2 py-1 bg-slate-100 text-[#061625] text-[10px] font-black rounded-md uppercase'>
                    {course?.level || 'Beginner'}
                </div>
            </div>

            {displayUser && (
                <div className='flex items-center gap-2 mt-4 pt-4 border-t border-slate-50'>
                    <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-white">
                        <Image src={creatorImage} fill className='object-cover' alt={course?.userName || 'Course creator'} />
                    </div>
                    <span className='text-[11px] font-semibold text-slate-600'>{course?.userName}</span>
                </div>
            )}
        </div>
    </div>
  )
}

export default CourseCard
