import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  import { HiPencilSquare } from "react-icons/hi2";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogClose } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { updateCourseById } from '@/lib/insforgeDb';

function EditChapters({course,index,refreshData}) {

    const Chapters=course?.courseOutput?.course?.chapters;
    const [name,setName]=useState();
    const [about,setAbout]=useState();

    useEffect(()=>{
        if (Chapters && Chapters[index]) {
            setName(Chapters[index].name);
            setAbout(Chapters[index].about)
        }
    },[course, index])

    const onUpdateHandler=async()=>{
        if (!course?.courseOutput?.course?.chapters?.[index]) return;
        // Create a deep copy to avoid direct mutation
        const updatedCourseOutput = JSON.parse(JSON.stringify(course.courseOutput));
        updatedCourseOutput.course.chapters[index].name = name;
        updatedCourseOutput.course.chapters[index].about = about;

        const result=await updateCourseById(course?.id, {
            courseOutput: updatedCourseOutput
        });

        console.log(result);
        refreshData(true)
    }

  return (
    <Dialog>
    <DialogTrigger>
        <button className="p-1.5 bg-slate-50 hover:bg-primary hover:text-white transition-all rounded-md border border-slate-100 shadow-sm">
            <HiPencilSquare className="text-lg"/>
        </button>
    </DialogTrigger>
    <DialogContent className="bg-white rounded-3xl border-none shadow-premium max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-slate-800">Refine Chapter</DialogTitle>
        <DialogDescription className="pt-4">
            <div className='space-y-6'>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Chapter Name</label>
                    <Input 
                        defaultValue={Chapters?.[index]?.name || ''}
                        className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 h-12 text-lg"
                        onChange={(event)=>setName(event?.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">What's this chapter about?</label>
                    <Textarea 
                        className="h-40 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-base leading-relaxed" 
                        defaultValue={Chapters?.[index]?.about || ''}
                        onChange={(event)=>setAbout(event?.target.value)}
                    />
                </div>
            </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-8">
            <DialogClose asChild>
                <Button onClick={onUpdateHandler} className="w-full py-6 text-lg rounded-xl bg-gradient-premium shadow-lg shadow-purple-200">
                    Update Chapter
                </Button>
            </DialogClose>
        </DialogFooter>
    </DialogContent>
  </Dialog>
  
  )
}

export default EditChapters
