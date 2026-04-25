import { UserInputContext } from '@/app/_context/UserInputContext'
import CategoryList from '@/app/_shared/CategoryList'
import Image from 'next/image'
import React, { useContext } from 'react'

function SelectCategory() {
    const {userCourseInput,setUserCourseInput}=useContext(UserInputContext);
 
    const handleCategoryChange=(category)=>{
            setUserCourseInput(prev=>({
                ...prev,
                category:category
            }))
    }
    return (
    <div>
         <h2 className='mb-5 text-2xl font-black tracking-tight text-[#061625]'>Select the course category</h2>
   
    <div className='grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5'>
       
        {CategoryList.map((item,index)=>(
            <div key={item.name} className={`flex flex-col p-5 border 
            items-center rounded-lg hover:border-primary hover:bg-primary/5
            cursor-pointer transition ${userCourseInput?.category==item.name&&'border-primary bg-primary/10'}`}
            onClick={()=>handleCategoryChange(item.name)}
            >
                <Image src={item.icon} width={50} height={50} alt={item.name}/>
                <h2 className='mt-3 text-sm font-bold text-[#061625] hidden md:block'>{item.name}</h2>
            </div>
        ))}
    </div>
    </div>
  )
}

export default SelectCategory
