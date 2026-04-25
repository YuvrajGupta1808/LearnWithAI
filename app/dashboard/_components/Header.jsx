import React from 'react'
import { HiOutlineBell, HiOutlineMagnifyingGlass } from 'react-icons/hi2'

function Header() {
  return (
    <div className='sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-md md:px-8'>
        <div className='hidden h-11 w-full max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 text-slate-500 md:flex'>
            <HiOutlineMagnifyingGlass className='text-lg' />
            <span className='text-sm font-medium'>Search courses, topics, or chapters</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
            <button aria-label='Notifications' className='flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-[#061625]'>
                <HiOutlineBell className='text-xl' />
            </button>
            <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800 leading-none">Guest User</span>
                <span className="text-[10px] font-medium text-slate-500 mt-1">Free Plan</span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#061625]">
                <span className="font-black text-primary">G</span>
            </div>
        </div>
    </div>
  )
}

export default Header
