'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModalCube from '../components/ModalCube'

export default function TimePage() {
  const [time, setTime] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/session')
      .then(response => response.json())
      .then(data => {
        if (!data.authenticated) router.push('/login')
      })
      .catch(() => router.push('/login'))

    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const rawHours = time.getHours()
  const hours = (rawHours % 12 || 12).toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')
  const period = rawHours >= 12 ? 'PM' : 'AM'
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-[#d4fc64] selection:text-black flex flex-col justify-between relative overflow-hidden">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-modal-grid opacity-25 pointer-events-none" />

      {/* Ambient background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none filter blur-[120px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(212,252,100,0.5) 0%, rgba(106,195,85,0.2) 40%, transparent 75%)',
        }}
      />

      {/* Top Header */}
      <header className="relative z-30 w-full max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#d4fc64] rotate-45 transform" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#6ac355] rotate-45 transform" />
          </div>
          <span className="font-semibold tracking-tight text-base sm:text-lg text-white">Worktrace</span>
          <span className="text-xs font-mono text-[#737373] ml-2 hidden sm:inline-block">/ Chrono Specimen</span>
        </div>

        <Link href="/dashboard">
          <button className="border border-[#2f2f2f] hover:border-[#4f4f4f] bg-[#111111]/80 hover:bg-[#1c1c1c] text-[#ededed] hover:text-[#d4fc64] font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all text-xs flex items-center gap-1.5 sm:gap-2">
            <span>← <span className="hidden xs:inline">Return to </span>Dashboard</span>
          </button>
        </Link>
      </header>

      {/* Main Specimen Display */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-5xl mx-auto w-full text-center">
        {/* Status chip */}
        <div className="mb-5 sm:mb-6 inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#242424] bg-[#111111]/80 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-mono text-[#a3a3a3] uppercase tracking-wider">
            Atomic Time Sync Active
          </span>
        </div>

        {/* Time Digits Display */}
        <div className="flex items-baseline justify-center gap-1 sm:gap-3 md:gap-5 font-mono select-none flex-nowrap">
          <span className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.15)]">
            {hours}
          </span>
          <span className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-[#d4fc64] animate-pulse">
            :
          </span>
          <span className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.15)]">
            {minutes}
          </span>
          <span className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-[#d4fc64] animate-pulse">
            :
          </span>
          <span className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-[#d4fc64] drop-shadow-[0_0_30px_rgba(212,252,100,0.3)]">
            {seconds}
          </span>
          <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-medium text-[#737373] ml-1 sm:ml-2">
            {period}
          </span>
        </div>

        {/* Formatted Date */}
        <div className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl font-mono text-[#a3a3a3] tracking-wide sm:tracking-wider px-2">
          {dateStr}
        </div>

        {/* Central Modal Glowing Cube Visual */}
        <div className="mt-6 sm:mt-8">
          <ModalCube size="md" interactive={false} />
        </div>

        {/* Specimen Telemetry Cards */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-2xl w-full">
          <div className="p-3 rounded-xl border border-[#242424] bg-[#111111]/60">
            <p className="text-[10px] font-mono uppercase text-[#737373]">Zone</p>
            <p className="text-xs font-mono text-white mt-1">UTC +05:30</p>
          </div>
          <div className="p-3 rounded-xl border border-[#242424] bg-[#111111]/60">
            <p className="text-[10px] font-mono uppercase text-[#737373]">Standard</p>
            <p className="text-xs font-mono text-white mt-1">ISO-8601</p>
          </div>
          <div className="p-3 rounded-xl border border-[#242424] bg-[#111111]/60">
            <p className="text-[10px] font-mono uppercase text-[#737373]">Latency</p>
            <p className="text-xs font-mono text-[#d4fc64] mt-1">&lt; 1 ms</p>
          </div>
          <div className="p-3 rounded-xl border border-[#242424] bg-[#111111]/60">
            <p className="text-[10px] font-mono uppercase text-[#737373]">Precision</p>
            <p className="text-xs font-mono text-white mt-1">Millisecond</p>
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-20 w-full border-t border-[#1c1c1c] py-4 px-4 sm:px-6 text-center text-xs font-mono text-[#525252]">
        Worktrace Time Infrastructure · Built with precision
      </footer>
    </div>
  )
}
