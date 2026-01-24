'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { useTheme } from '../components/ThemeProvider' // Theme logic is bypassed for forced dark mode
import Link from 'next/link'
import Calendar from '../components/Calendar'
import TaskSection from '../components/TaskSection'
import Loader from '../components/Loader'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface WorkUpdate {
  id: string
  date: string
  description: string | null
  is_leave: boolean
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  // const { theme, toggleTheme } = useTheme() // Disabled for Cyberpunk Mode

  useEffect(() => {
    const authenticated = localStorage.getItem('authenticated')
    if (!authenticated) {
      router.push('/login')
      return
    }
    loadWorkUpdates()
  }, [router])

  const loadWorkUpdates = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('work_updates')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setWorkUpdates(data || [])
    } catch (error) {
      console.error('Error loading work updates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleUpdate = () => {
    loadWorkUpdates()
  }

  const handleLogout = () => {
    localStorage.removeItem('authenticated')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="bg-[#050505] min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="w-16 h-16 border-4 border-t-[#CCFF00] border-r-[#CCFF00] border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[#CCFF00] font-mono text-sm tracking-widest uppercase animate-pulse">Initializing System...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#CCFF00] selection:text-black flex flex-col relative overflow-hidden">

      {/* Top HUD Bar */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-sm border-b border-[#1F1F1F]">
        <div className="max-w-[1920px] mx-auto px-6 h-20 flex items-center justify-between relative">

          {/* Decorative Top Marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent opacity-50"></div>

          <div className="flex items-center gap-6">
            {/* Logo / Title Block */}
            <div className="flex items-center gap-4 group cursor-pointer">
              <img src="/logo_laptop.png" alt="WT Logo" className="w-10 h-10 object-contain rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter leading-none glitch-text" data-text="WORKTRACE ">
                  WORKTRACE
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-mono text-gray-500 tracking-[0.2em]">SYSTEM ONLINE v2.0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Clock / Status (Static visual for now) */}
            <div className="hidden md:flex flex-col items-end mr-6 border-r border-[#1F1F1F] pr-6">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Net_Link_Status</span>
              <span className="text-neon font-mono text-sm">ENCRYPTED // SECURE</span>
            </div>

            <div className="h-full flex items-center gap-2">
              <Link href="/dashboard/stats">
                <button className="btn-cyber font-mono text-xs flex items-center gap-2 mr-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>DATA_VISUALIZATION</span>
                </button>
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>TERMINATE_SESSION</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-6 py-8 relative z-10">

        {/* Background Decorative Lines */}
        <div className="absolute top-0 left-8 bottom-0 w-[1px] bg-[#1F1F1F] pointer-events-none"></div>
        <div className="absolute top-0 right-8 bottom-0 w-[1px] bg-[#1F1F1F] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-20">

          {/* Left Panel: Calendar & Stats */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="panel-base p-1 clip-corner-2 panel-glow">
              {/* Corner Markers */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#CCFF00]"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#CCFF00]"></div>

              <div className="bg-[#080808] p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-mono text-[#CCFF00] uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#CCFF00]"></span>
                    Chronological_Grid
                  </h3>
                  <div className="text-[10px] font-mono text-gray-600">MOD_CAL_01</div>
                </div>

                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  workUpdates={workUpdates}
                />
              </div>
            </div>

            {/* Stats / Info Panel */}
            <div className="panel-base p-6 clip-corner-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-grid opacity-10"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-[#1F1F1F] flex items-center justify-center border border-[#333]">
                  <span className="text-[#CCFF00] font-tech text-xl">OT</span>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Operational_Target</div>
                  <div className="text-xl font-bold text-white tracking-widest">OTC TRADING</div>
                </div>
              </div>
              <div className="h-[1px] w-full bg-[#1F1F1F] mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">Total_Entries</div>
                  <div className="text-lg font-mono text-[#CCFF00]">{workUpdates.length}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">System_load</div>
                  <div className="text-lg font-mono text-blue-400">42%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Task Terminal */}
          <div className="lg:col-span-8 h-full min-h-[500px]">
            <div className="panel-base h-full relative clip-corner-1">
              {/* Decorative Tech Header on Panel */}
              <div className="h-8 bg-[#0F0F0F] border-b border-[#1F1F1F] flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-[10px] font-mono text-gray-600 uppercase">Input_Terminal_v4.exe</div>
              </div>

              <div className="p-1 h-[calc(100%-2rem)]">
                <TaskSection
                  selectedDate={selectedDate}
                  workUpdates={workUpdates}
                  onUpdate={handleUpdate}
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
