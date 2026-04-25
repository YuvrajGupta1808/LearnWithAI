import { UserInputContext } from '@/app/_context/UserInputContext';
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import React, { useContext } from 'react'

function TopicDescription() {
    const {userCourseInput,setUserCourseInput}=useContext(UserInputContext);

    const handleInputChange=(fieldName,value)=>{
        setUserCourseInput(prev=>({
            ...prev,
            [fieldName]:value
        }))
    }
  return (
    <div className='mx-auto max-w-2xl'>
        {/* Input Topic  */}
        <div className='mt-5'>
            <label className='text-sm font-black uppercase tracking-[0.16em] text-[#061625]'>Course topic</label>
            <Input placeholder={'Topic'} 
            className="mt-3 h-14 rounded-lg border-slate-300 text-lg font-semibold" 
            defaultValue={userCourseInput?.topic}
            onChange={(e)=>handleInputChange('topic',e.target.value)}
            />
            <p className='mt-2 text-sm font-medium text-slate-500'>Example: Python for marketing analytics, Yoga basics, or Dashboard design.</p>
        </div>
        <div className='mt-6'>
            <label className='text-sm font-black uppercase tracking-[0.16em] text-[#061625]'>Course brief</label>
            <Textarea placeholder="About your course" 
            className="mt-3 min-h-32 rounded-lg border-slate-300 text-base font-medium" 
            defaultValue={userCourseInput?.description}
            onChange={(e)=>handleInputChange('description',e.target.value)}
            />
        </div>
        {/* Text Area Desc  */}
    </div>
  )
}

export default TopicDescription
