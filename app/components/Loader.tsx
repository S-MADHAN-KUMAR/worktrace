'use client'

import React from 'react'

export default function Loader({ label = 'Initializing environment...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="relative w-12 h-12">
        {/* Soft lime glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-[#d4fc64]/20 filter blur-md animate-pulse"></div>
        {/* Track */}
        <div className="absolute inset-0 rounded-full border-[2.5px] border-[#242424]"></div>
        {/* Active glowing spinner */}
        <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-[#d4fc64] border-r-[#f9fb04] animate-spin"></div>
        {/* Inner dot */}
        <div className="absolute inset-[18px] rounded-full bg-[#d4fc64] shadow-[0_0_10px_#d4fc64] animate-pulse"></div>
      </div>
      <p className="text-xs text-[#a3a3a3] font-mono tracking-wider">{label}</p>
    </div>
  )
}
