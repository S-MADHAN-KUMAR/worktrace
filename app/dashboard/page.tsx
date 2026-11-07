'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Calendar from '../components/Calendar'
import TaskSection from '../components/TaskSection'
import Loader from '../components/Loader'

interface WorkUpdate {
  id: string
  date: string
  description: string | null
  is_leave: boolean
  sick_leave?: boolean
  casual_leave?: boolean
}

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const [now, setNow] = useState(new Date())

  const loadWorkUpdates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/entries', { cache: 'no-store' })
      if (response.status === 401) {
        router.push('/login')
        return
      }
      if (!response.ok) throw new Error('Failed to load entries')
      setWorkUpdates(await response.json())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/session')
      .then(response => response.json())
      .then(data => {
        if (!data.authenticated) router.push('/login')
        else {
          if (data.user) setUserName(data.user)
          loadWorkUpdates()
        }
      })
      .catch(() => router.push('/login'))

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [router])

  const monthEntries = useMemo(() => {
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    return workUpdates.filter(update => {
      const date = new Date(update.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
  }, [workUpdates, now])

  const activeDays = monthEntries.filter(update => update.description?.trim() || (!update.is_leave && !update.sick_leave && !update.casual_leave)).length
  const leaveDays = monthEntries.filter(update => update.is_leave || update.sick_leave || update.casual_leave).length

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-[#ededed]">
        <Loader label="Loading workspace records..." />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-[#ededed] font-sans relative selection:bg-[#d4fc64] selection:text-black">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-modal-grid opacity-20 pointer-events-none" />

      {/* Modal Style Sticky Header */}
      <header className="h-16 sm:h-18 border-b border-[#1f1f1f] bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-[3px] bg-[#d4fc64] rotate-45 transform" />
              <span className="w-3.5 h-3.5 rounded-[3px] bg-[#6ac355] rotate-45 transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-sm sm:text-base">Worktrace</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[#2e2e2e] bg-[#141414] text-[#a3a3a3]">
                  v0.1
                </span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/time"
              className="hidden sm:flex h-9 items-center gap-2 px-3.5 rounded-full border border-[#262626] bg-[#111111] text-xs font-mono text-[#a3a3a3] hover:text-[#d4fc64] hover:border-[#3a3a3a] transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64] animate-pulse" />
              <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </Link>

            <Link
              href="/dashboard/stats"
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full border border-[#2f2f2f] bg-[#161616] hover:border-[#444] text-xs font-medium text-white hover:text-[#d4fc64] grid place-items-center transition-all"
            >
              Analytics
            </Link>

            {userName && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#262626] bg-[#111111] text-xs font-mono text-[#a3a3a3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64]" />
                {userName}
              </span>
            )}

            <button
              onClick={logout}
              className="h-8 sm:h-9 w-8 sm:w-9 rounded-full border border-[#262626] bg-[#111111] text-[#a3a3a3] hover:text-[#cb5f5f] hover:border-[#cb5f5f]/50 grid place-items-center transition-all text-xs"
              aria-label="Log out"
              title="Log out"
            >
              ↗
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Top Greeting & Metric Summary */}
        <section className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 pb-5 sm:pb-6 border-b border-[#1c1c1c]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span className="text-xs font-mono text-[#737373]">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white">
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}{userName ? `, ${userName}` : ''}.
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:min-w-[130px] rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3.5 sm:px-5 sm:py-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-1">
                <span>Active Days</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64]" />
              </div>
              <p className="text-xl sm:text-2xl font-medium text-white tracking-tight">{activeDays}</p>
            </div>

            <div className="flex-1 sm:min-w-[130px] rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3.5 sm:px-5 sm:py-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-1">
                <span>Time Away</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#cb5f5f]" />
              </div>
              <p className="text-xl sm:text-2xl font-medium text-[#cb5f5f] tracking-tight">{leaveDays}</p>
            </div>
          </div>
        </section>

        {/* 2-Column Dashboard Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] gap-5 sm:gap-6 items-stretch">
          <aside className="rounded-2xl border border-[#242424] bg-[#111111] p-4 sm:p-6 shadow-xl">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              workUpdates={workUpdates}
            />
          </aside>

          <section className="min-h-[500px] sm:min-h-[640px] rounded-2xl border border-[#242424] bg-[#111111] shadow-xl overflow-hidden flex flex-col">
            <TaskSection
              selectedDate={selectedDate}
              workUpdates={workUpdates}
              onUpdate={loadWorkUpdates}
              userName={userName}
            />
          </section>
        </section>
      </div>
    </main>
  )
}
