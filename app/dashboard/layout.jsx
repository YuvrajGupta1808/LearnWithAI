"use client"
import React, { useState } from 'react'
import SideBar from './_components/SideBar'
import Header from './_components/Header'
import { UserCourseListContext } from '../_context/UserCourseListContext'

function DashboardLayout({children}) {

  // const [userCourseList,setUserCourseList]=useState([]);
  return (
    // <UserCourseListContext.Provider value={{userCourseList,setUserCourseList}}>
    <div className='min-h-screen bg-[#f4f7f9]'>
        <div className='md:w-64 hidden md:block fixed'>
            <SideBar/>
        </div>
        <div className='md:ml-64 min-h-screen flex flex-col'>
          <Header/>
          <div className='p-5 md:p-8 lg:p-10 flex-1'>
          {children}
          </div>
        </div>
    </div>
    // </UserCourseListContext.Provider>
  )
}

export default DashboardLayout
