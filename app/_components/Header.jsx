import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { HiOutlineChevronDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2'

function Header() {
  return (
    <header className='sticky top-0 z-40 border-b border-white/10 bg-[#061625] text-white'>
      <div className='mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8'>
        <Link href='/' className='flex items-center gap-3'>
          <span className='text-xl font-black tracking-tight'>LearnWithAI</span>
        </Link>

        <nav className='hidden items-center gap-8 text-sm font-semibold text-slate-200 md:flex'>
          <Link href='/dashboard' className='flex items-center gap-1 hover:text-primary'>
            Catalog <HiOutlineChevronDown className='text-base' />
          </Link>
          <Link href='/create-course' className='hover:text-primary'>LearnWithAI Studio</Link>
          <Link href='/dashboard/explore' className='hover:text-primary'>Explore</Link>
          <Link href='/dashboard' className='hover:text-primary'>For teams</Link>
        </nav>

        <div className='flex items-center gap-3'>
          <button aria-label='Search courses' className='hidden size-10 items-center justify-center rounded-lg text-slate-200 transition hover:bg-white/10 hover:text-white sm:flex'>
            <HiOutlineMagnifyingGlass className='text-xl' />
          </button>
          <Link href='/dashboard' className='hidden sm:block'>
            <Button variant='outline' className='h-11 rounded-md border-white/40 bg-transparent px-5 font-bold text-white hover:bg-white hover:text-[#061625]'>
              Log in
            </Button>
          </Link>
          <Link href='/dashboard'>
            <Button className='h-11 rounded-md bg-primary px-5 font-black text-[#061625] hover:bg-[#00d864]'>
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
