import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineChartBar, HiOutlineClock, HiOutlineCodeBracket, HiOutlinePlayCircle, HiOutlineRectangleStack, HiOutlineSparkles, HiOutlineStar } from 'react-icons/hi2'

const topicLogos = ['Python', 'SQL', 'ChatGPT', 'Power BI', 'Excel', 'React', 'R']

const courseChips = ['AI', 'Beginner', '5 chapters', 'Video lessons', 'Course outline']

function Hero() {
  return ( 
    <main className="bg-[#061625] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-[0.16]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.65) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.65) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          transform: 'perspective(700px) rotateX(54deg) scale(1.35)',
          transformOrigin: 'center top'
        }} />

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
          <div>
            <div className="mb-10 inline-flex items-center gap-3 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
              <HiOutlineSparkles className="text-lg" />
              AI course generator
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
              Learn faster with courses built for your exact goal
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-200 sm:text-xl">
              Turn any topic into a structured curriculum with chapters, practice prompts, videos, and a study path you can start immediately.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button className="h-14 rounded-md bg-primary px-8 text-base font-black text-[#061625] shadow-none hover:bg-[#00d864]">
                  Start Learning for Free
                </Button>
              </Link>
              <Link href="/create-course">
                <Button variant="outline" className="h-14 rounded-md border-white/20 bg-white px-8 text-base font-black text-[#061625] hover:bg-slate-100">
                  Build a Course
                </Button>
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <HiOutlineStar className="text-primary" />
                4.8
              </span>
              <span className="text-slate-500">from generated learner plans</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-500 sm:block" />
              <span>Beginner to advanced paths</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 text-[#061625] shadow-premium">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Course preview</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Build a dashboard with AI</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  A complete learning path generated from one topic brief.
                </p>
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#061625] text-primary">
                <HiOutlineAcademicCap className="text-2xl" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-sm font-bold">
              <div className="rounded-lg bg-slate-100 p-3">
                <HiOutlineClock className="mb-2 text-lg text-slate-500" />
                4 hr
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <HiOutlinePlayCircle className="mb-2 text-lg text-slate-500" />
                12 videos
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <HiOutlineCodeBracket className="mb-2 text-lg text-slate-500" />
                35 tasks
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {['Plan dashboard KPIs', 'Create responsive layouts', 'Add charts and filters'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary font-black text-[#061625]">{index + 1}</span>
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {courseChips.map((chip) => (
                <span key={chip} className="rounded-md bg-[#17283a] px-3 py-2 text-xs font-bold text-white">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0d2033]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6 text-sm font-bold text-slate-300 sm:px-8">
          {topicLogos.map((topic) => (
            <span key={topic} className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 text-[#061625]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">What you get</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">A course page, not just a prompt result</h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-7 text-slate-600">
              Each generated course includes the structure learners expect: overview, chapters, timing, levels, video support, and progress tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-modern">
              <HiOutlineBookOpen className="text-3xl text-primary"/>
              <h3 className="mt-6 text-xl font-black tracking-tight">Structured syllabi</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">Turn a rough topic into an ordered lesson plan with chapter goals and durations.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-modern">
              <HiOutlineRectangleStack className="text-3xl text-primary"/>
              <h3 className="mt-6 text-xl font-black tracking-tight">Rich learning assets</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">Pair chapters with useful videos, exercises, and explanations for each learning stage.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-modern">
              <HiOutlineChartBar className="text-3xl text-primary"/>
              <h3 className="mt-6 text-xl font-black tracking-tight">Clear progress paths</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">Use levels, chapter counts, and study time to make every course easier to scan.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Hero
