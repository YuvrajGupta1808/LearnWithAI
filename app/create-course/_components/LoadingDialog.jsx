import React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import Image from 'next/image'

  
function LoadingDialog({loading, progress = 0, total = 0}) {
  return (
    <AlertDialog open={loading}>
  <AlertDialogContent className="bg-white rounded-2xl border-none shadow-premium">
    <AlertDialogHeader>
      <AlertDialogDescription>
        <div className='flex flex-col items-center py-10'>
            <Image src={'/loader.gif'} width={100} height={100} alt="Loading..." className="rounded-full shadow-lg"/>
            <h2 className="text-2xl font-bold text-slate-800 mt-6 tracking-tight">AI is crafting your course</h2>
            <p className="text-slate-500 mt-2">This may take a minute or two as we generate deep insights.</p>
            
            {total > 0 && (
              <div className="mt-8 w-full max-w-xs">
                <div className="flex justify-between mb-2 text-sm font-bold text-primary">
                  <span>Generating Chapters</span>
                  <span>{progress} / {total}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div 
                    className="h-full bg-gradient-premium transition-all duration-500 ease-out rounded-full shadow-sm"
                    style={{ width: `${(progress / total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
  </AlertDialogContent>
</AlertDialog>

  )
}

export default LoadingDialog