import { Button } from '@/components/ui/button';
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { HiOutlinePuzzle } from "react-icons/hi";
import { HiOutlineRectangleStack } from "react-icons/hi2";
import EditCourseBasicInfo from './EditCourseBasicInfo';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { isFirebaseConfigured, storage } from '@/configs/firebaseConfig';
import Link from 'next/link';
import { updateCourseById } from '@/lib/insforgeDb';
function CourseBasicInfo({course,refreshData,edit=true}) {

  const [selectedFile,setSelectedFile]=useState();


  useEffect(()=>{
    if(course)
    {
      setSelectedFile(course?.courseBanner)
    }
  },[course])

  /**
   * Select file and UPload to Firebase Storage
   * @param {*} event 
   */
  const onFileSelected=async(event)=>{
    if (!isFirebaseConfigured || !storage) {
      alert('Firebase Storage is not configured. Add Firebase environment variables before uploading course banners.');
      return;
    }
    const file=event.target.files[0];
    if (!file) return;
    setSelectedFile(URL.createObjectURL(file));

    const fileName=Date.now()+'.jpg'
    const storageRef=ref(storage,'ai-course/'+fileName);
    await uploadBytes(storageRef,file).then((snapshot)=>{
      console.log('Upload File Complete')
    }).then(resp=>{
      getDownloadURL(storageRef).then(async(downloadUrl)=>{
        console.log(downloadUrl);

        await updateCourseById(course?.id, {
          courseBanner:downloadUrl
        })

      })
    })

  }

  return (
    <div className='p-8 md:p-12 bg-white border border-slate-100 rounded-3xl shadow-premium mt-8 relative overflow-hidden group'>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10'>
            <div className='flex flex-col justify-center'>
                <div className='flex items-center gap-2 mb-4'>
                    <span className='px-3 py-1 bg-purple-50 text-primary text-xs font-bold rounded-full uppercase tracking-widest border border-purple-100'>
                        {course?.category}
                    </span>
                    <span className='px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest border border-indigo-100'>
                        {course?.level}
                    </span>
                </div>
                
                <h2 className='font-extrabold text-4xl md:text-5xl text-slate-900 leading-tight flex items-center gap-3'>
                    {course?.courseOutput?.course?.name} 
                    {edit && (
                        <div className="scale-75 origin-left">
                            <EditCourseBasicInfo course={course} refreshData={() => refreshData(true)} />
                        </div>
                    )}
                </h2>
                
                <p className='text-lg text-slate-500 mt-6 leading-relaxed'>
                    {course?.courseOutput?.course?.description}
                </p>

                <div className='mt-10 flex flex-col sm:flex-row gap-4'>
                    {!edit ? (
                        <Link href={'/course/' + course?.courseId + "/start"} className="flex-1">
                            <Button className="w-full py-7 text-lg rounded-2xl bg-gradient-premium shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all">
                                Start Learning Now
                            </Button>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 font-medium italic">
                             <HiOutlinePuzzle className="text-xl"/>
                             Customize your course before publishing
                        </div>
                    )}
                </div>
            </div>
            
            <div className='relative group/image'>
                <label htmlFor='upload-image' className="block relative aspect-video md:aspect-square overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 group-hover/image:shadow-primary/20">
                    <Image 
                        src={selectedFile ? selectedFile : '/placeholder.png'} 
                        width={500} 
                        height={500}
                        className='w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover/image:scale-105'
                        alt="Course Banner"
                    />
                    {edit && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <p className="text-white font-bold bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">
                                Change Banner Image
                            </p>
                        </div>
                    )}
                </label>
                {edit && (
                    <input 
                        type="file" 
                        id="upload-image" 
                        className='hidden' 
                        onChange={onFileSelected} 
                    />
                )}
            </div>
        </div>
    </div>
  )
}

export default CourseBasicInfo
