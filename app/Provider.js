"use client"
import React, { useState } from 'react'
import { UserCourseListContext } from './_context/UserCourseListContext'

function Provider({children}) {
    const [userCourseList,setUserCourseList]=useState([]);
  return (
    <UserCourseListContext.Provider value={{userCourseList,setUserCourseList}}>
        {children}
    </UserCourseListContext.Provider>
  )
}

export default Provider
