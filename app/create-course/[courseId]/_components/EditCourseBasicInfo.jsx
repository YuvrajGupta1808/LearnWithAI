import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogClose,
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
import { Button } from '@/components/ui/button';
import { updateCourseById } from '@/lib/insforgeDb';
function EditCourseBasicInfo({course,refreshData}) {

    const [name,setName]=useState();
    const [description,setDescription]=useState();

    useEffect(()=>{
        if (course?.courseOutput?.course) {
            setName(course?.courseOutput?.course?.name);
            setDescription(course?.courseOutput?.course?.description);
        }
    },[course])

    const onUpdateHandler=async()=>{
        // Create a deep copy to avoid direct mutation
        const updatedCourseOutput = JSON.parse(JSON.stringify(course.courseOutput));
        updatedCourseOutput.course.name = name;
        updatedCourseOutput.course.description = description;

        await updateCourseById(course?.id, {
            courseOutput: updatedCourseOutput
        });

        refreshData(true)
    }

  return (
    <Dialog>
    <DialogTrigger>
        <button className="p-2 bg-slate-100 hover:bg-primary hover:text-white transition-all rounded-lg shadow-sm">
            <HiPencilSquare className="text-xl"/>
        </button>
    </DialogTrigger>
    <DialogContent className="bg-white rounded-3xl border-none shadow-premium max-w-lg">
        <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-slate-800">Refine Course Details</DialogTitle>
        <DialogDescription className="pt-4">
            <div className='space-y-6'>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Course Title</label>
                    <Input 
                        defaultValue={course?.courseOutput?.course?.name}
                        className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 h-12 text-lg"
                        placeholder="e.g. Advanced React Architecture"
                        onChange={(event)=>setName(event?.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Detailed Description</label>
                    <Textarea 
                        className="h-48 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 text-base leading-relaxed" 
                        defaultValue={course?.courseOutput?.course?.description}
                        placeholder="What will students learn in this course?"
                        onChange={(event)=>setDescription(event?.target.value)}
                    />
                </div>
            </div>
        </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-8">
            <DialogClose asChild>
                <Button onClick={onUpdateHandler} className="w-full py-6 text-lg rounded-xl bg-gradient-premium shadow-lg shadow-purple-200">
                    Update Course Info
                </Button>
            </DialogClose>
        </DialogFooter>
    </DialogContent>
</Dialog>

  )
}

export default EditCourseBasicInfo