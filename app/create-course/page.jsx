"use client"
import { Button } from '@/components/ui/button';
import React, { useContext, useEffect, useState } from 'react'
import { HiMiniSquares2X2, HiLightBulb, HiClipboardDocumentCheck } from "react-icons/hi2";
import SelectCategory from './_components/SelectCategory';
import TopicDescription from './_components/TopicDescription';
import SelectOption from './_components/SelectOption';
import { UserInputContext } from '../_context/UserInputContext';
import { GenerateCourseLayout_AI } from '@/configs/AiModel';
import LoadingDialog from './_components/LoadingDialog';
import uuid4 from 'uuid4';
import { useRouter } from 'next/navigation';
import { createCourse } from '@/lib/insforgeDb';
import { isInsforgeConfigured } from '@/configs/insforgeClient';
function CreateCourse() {
  const StepperOptions = [
    {
      id: 1,
      name: 'Category',
      icon: <HiMiniSquares2X2 />
    },
    {
      id: 2,
      name: 'Topic & Desc',
      icon: <HiLightBulb />
    },
    {
      id: 3,
      name: 'Options',
      icon: <HiClipboardDocumentCheck />
    }
  ]
  const {userCourseInput,setUserCourseInput}=useContext(UserInputContext);
  const [loading,setLoading]=useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router=useRouter();
  useEffect(()=>{
    console.log(userCourseInput);
  },[userCourseInput])

  /**
   * Used to check Next Button Enable or Disable Status
   */
  const checkStatus=()=>{
      if(userCourseInput?.length==0)
      {
        return true;
      }
      if(activeIndex==0&&(userCourseInput?.category?.length==0||userCourseInput?.category==undefined))
      {
        return true;
      }
      if(activeIndex==1&&(userCourseInput?.topic?.length==0||userCourseInput?.topic==undefined))
      {
        return true;
      }
      else if(activeIndex==2&&(userCourseInput?.level==undefined||userCourseInput?.duration==undefined||userCourseInput?.displayVideo==undefined||userCourseInput?.noOfChapter==undefined))
      {
        return true;
      }
      return false;
  }

  const GenerateCourseLayout=async()=>{
    setLoading(true)
    const BASIC_PROMPT=`Generate a highly structured and educational course syllabus in JSON format. The output must be a single JSON object with the following schema:
    {
      "course": {
        "name": "Course Title",
        "description": "Comprehensive course overview",
        "duration": "Estimated time (e.g., 5 Hours)",
        "numberOfChapters": 5,
        "chapters": [
          {
            "name": "Chapter Title",
            "about": "Brief summary of what this chapter covers",
            "duration": "Time for this chapter"
          }
        ]
      }
    }`
    const USER_INPUT_PROMPT = `\n\nCourse Details:
    - Category: ${userCourseInput?.category}
    - Topic: ${userCourseInput?.topic}
    - Level: ${userCourseInput?.level}
    - Duration: ${userCourseInput?.duration}
    - Number of Chapters: ${userCourseInput?.noOfChapter}
    
    Ensure the content is accurate and follows the requested JSON structure strictly.`
    const FINAL_PROMPT=BASIC_PROMPT+USER_INPUT_PROMPT;
    
    try {
      const result=await GenerateCourseLayout_AI.sendMessage(FINAL_PROMPT);
      const courseLayout = JSON.parse(result.response?.text());
      await SaveCourseLayoutInDb(courseLayout);
    } catch (error) {
      console.error("Error generating course layout:", error);
      alert("Failed to generate course. Please check your API keys or try again.");
    } finally {
      setLoading(false);
    }
  }


  const SaveCourseLayoutInDb=async(courseLayout)=>{
    var id = uuid4();//Course Id
    try {
      await createCourse({
        courseId:id,
        name:userCourseInput?.topic,
        level:userCourseInput?.level,
        category:userCourseInput?.category,
        courseOutput:courseLayout,
        createdBy:'guest@example.com',
        userName:'Guest User',
        userProfileImage:'/placeholder.png'
      })
      router.replace('/create-course/'+id)
    } catch (error) {
      console.error("Error saving course to database:", error);
      throw error;
    }
  }

  return (
    <div className='min-h-screen bg-[#f4f7f9] pb-20'>
      {!isInsforgeConfigured && (
        <div className='mx-auto max-w-4xl px-5 pt-6'>
          <p className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900'>
            InsForge is not configured. Course generation is disabled until database keys are added in `.env.local`.
          </p>
        </div>
      )}
      {/* Stepper  */}
      <div className='flex flex-col justify-center items-center pt-14 px-5 text-center'>
        <p className='text-xs font-black uppercase tracking-[0.24em] text-primary'>LearnWithAI Studio</p>
        <h2 className='mt-3 text-4xl md:text-5xl font-black text-[#061625] tracking-tight'>Create Your Course</h2>
        <p className='text-slate-600 mt-3 text-base md:text-lg font-medium'>Follow the steps to generate a focused, lesson-ready curriculum.</p>
        
        <div className='flex items-center mt-10 bg-white p-4 md:p-5 rounded-xl shadow-modern border border-slate-200'>
          {StepperOptions.map((item, index) => (
            <div key={item.id} className='flex items-center'>
              <div className='flex flex-col items-center w-[60px] md:w-[120px] transition-all duration-300'>
                <div className={`p-3 md:p-4 rounded-lg text-xl md:text-2xl transition-all duration-300
                ${activeIndex >= index ? 'bg-primary text-[#061625]' : 'bg-slate-100 text-slate-400 opacity-80'}`}>
                  {item.icon}
                </div>
                <h2 className={`mt-3 font-black text-[10px] md:text-xs tracking-wide uppercase transition-colors duration-300
                ${activeIndex >= index ? 'text-primary' : 'text-slate-400'}`}>{item.name}</h2>
              </div>
              {index != StepperOptions?.length - 1 &&
                <div className={`h-[2px] w-[40px] md:w-[80px] lg:w-[120px] mx-2 rounded-full transition-all duration-700
             ${activeIndex - 1 >= index ? 'bg-primary' : 'bg-slate-200'}
             `}></div>}
            </div>
          ))}
        </div>
      </div>
      
      <div className='px-5 md:px-10 lg:px-20 mt-10'>
        <div className="mx-auto max-w-5xl bg-white p-6 md:p-10 rounded-xl shadow-premium border border-slate-200 min-h-[400px] transition-all duration-500">
          {/* Component  */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeIndex == 0 ? <SelectCategory /> :
              activeIndex == 1 ? <TopicDescription /> :
              <SelectOption />}
          </div>

          {/* Next Previous Button  */}
          <div className='flex justify-between mt-12 pt-8 border-t border-slate-200'>
            <Button 
              disabled={activeIndex == 0} 
              variant='ghost'
              className="px-6 py-6 text-base font-bold rounded-md hover:bg-slate-100 transition-all"
              onClick={() => setActiveIndex(activeIndex - 1)}
            >
              Previous
            </Button>
            
            {activeIndex < 2 && (
              <Button 
                disabled={checkStatus()} 
                className="px-8 py-6 text-base font-black rounded-md bg-primary text-[#061625] hover:bg-[#00d864]"
                onClick={() => setActiveIndex(activeIndex + 1)}
              >
                Next Step
              </Button>
            )}
            
            {activeIndex == 2 && (
              <Button 
                disabled={checkStatus() || !isInsforgeConfigured} 
                className="px-8 py-6 text-base font-black rounded-md bg-primary text-[#061625] hover:bg-[#00d864]"
                onClick={() => GenerateCourseLayout()}
              >
                Generate Course Layout
              </Button>
            )}
          </div>
        </div>
      </div>
      <LoadingDialog loading={loading} />
    </div>
  )
}

export default CreateCourse
