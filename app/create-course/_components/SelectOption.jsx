import React, { useContext } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { UserInputContext } from '@/app/_context/UserInputContext';
function SelectOption() {

    const {userCourseInput,setUserCourseInput}=useContext(UserInputContext);

    const handleInputChange=(fieldName,value)=>{
        setUserCourseInput(prev=>({
            ...prev,
            [fieldName]:value
        }))
    }

    return (
        <div className='mx-auto max-w-3xl'>
            <h2 className='mb-6 text-2xl font-black tracking-tight text-[#061625]'>Tune the learning path</h2>
            <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                <div>
                    <label className='text-sm font-black uppercase tracking-[0.16em] text-[#061625]'>Difficulty Level</label>
                    <Select onValueChange={(value)=>handleInputChange('level',value)}
                    defaultValue={userCourseInput?.level}>
                        <SelectTrigger className="mt-3 h-14 rounded-lg border-slate-300 text-lg font-semibold">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advance">Advance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className='text-sm font-black uppercase tracking-[0.16em] text-[#061625]'>Course Duration</label>
                    <Select 
                    defaultValue={userCourseInput?.duration}
                    onValueChange={(value)=>handleInputChange('duration',value)}>
                        <SelectTrigger className="mt-3 h-14 rounded-lg border-slate-300 text-lg font-semibold">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1 Hourse">1 Hours</SelectItem>
                            <SelectItem value="2 Hourse">2 Hourse</SelectItem>
                            <SelectItem value="More than 3 Hourse">More than 3 Hourse</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className='text-sm font-black uppercase tracking-[0.16em] text-[#061625]'>Add Video</label>
                    <Select 
                    defaultValue={userCourseInput?.displayVideo}
                    onValueChange={(value)=>handleInputChange('displayVideo',value)}>
                        <SelectTrigger className="mt-3 h-14 rounded-lg border-slate-300 text-lg font-semibold">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className='text-sm font-black uppercase tracking-[0.16em] text-[#061625]'>No of Chapters</label>
                    <Input type="number" className="mt-3 h-14 rounded-lg border-slate-300 text-lg font-semibold"
                    defaultValue={userCourseInput?.noOfChapter}
                    onChange={(event)=>handleInputChange('noOfChapter',event.target.value)}/>
                </div>


            </div>
        </div>
    )
}

export default SelectOption
