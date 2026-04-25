"use client"
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useContext } from 'react'
import { HiOutlineHome,HiOutlineSquare3Stack3D,HiOutlineShieldCheck,HiOutlinePower } from "react-icons/hi2";
;
import { UserCourseListContext } from '@/app/_context/UserCourseListContext';

function SideBar() {
    const {userCourseList,setUserCourseList}=useContext(UserCourseListContext);
    const Menu=[
        {
            id:1,
            name:'Home',
            icon:<HiOutlineHome />,
            path:'/dashboard'
        },
        {
            id:2,
            name:'Explore',
            icon:<HiOutlineSquare3Stack3D />,
            path:'/dashboard/explore'
        },
        {
            id:3,
            name:'Upgrade',
            icon:<HiOutlineShieldCheck />,
            path:'/dashboard/upgrade'
        },
        {
            id:4,
            name:'Logout',
            icon:<HiOutlinePower />,
            path:'/dashboard/logout'
        }
    ]
    const path=usePathname();
  return (
    <div className='fixed h-full md:w-64 p-5 bg-[#061625] text-white flex flex-col shadow-2xl'>
        <div className='mb-10 px-2'>
            <span className='text-xl font-black tracking-tight'>LearnWithAI</span>
        </div>

        <nav className='flex-1'>
            <ul className='space-y-2'>
                {Menu.map((item, index) => (
                    <Link href={item.path} key={item.id}>
                        <li className={`sidebar-item ${item.path === path ? 'sidebar-item-active' : ''}`}>
                            <div className='text-xl'>{item.icon}</div>
                            <span className='font-medium'>{item.name}</span>
                        </li>
                    </Link>
                ))}
            </ul>
        </nav>

        <div className='mt-auto pt-10'>
            <div className='p-4 bg-white/5 rounded-xl border border-white/10'>
                <div className='flex justify-between items-center mb-2'>
                    <span className='text-xs text-slate-400 font-medium'>Course Credits</span>
                    <span className='text-xs text-primary font-bold'>{userCourseList?.length || 0}/5</span>
                </div>
                <Progress value={((userCourseList?.length || 0) / 5) * 100} className="h-2 bg-white/10" />
                <p className='text-[10px] text-slate-500 mt-3 leading-tight'>
                    Upgrade your plan for unlimited AI course generation.
                </p>
                <Link href="/dashboard/upgrade">
                    <button className='w-full mt-4 py-2 px-4 bg-primary text-[#061625] hover:bg-[#00d864] text-xs font-black rounded-md transition-all'>
                        Upgrade Now
                    </button>
                </Link>
            </div>
        </div>
    </div>
  )
}

export default SideBar
