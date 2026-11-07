'use client'

import { useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isToday, startOfMonth, subMonths } from 'date-fns'

interface WorkUpdate {
  id: string
  date: string
  description: string | null
  is_leave: boolean
  sick_leave?: boolean
  casual_leave?: boolean
}

interface CalendarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  workUpdates: WorkUpdate[]
}

export default function Calendar({ selectedDate, onDateSelect, workUpdates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const monthStart = startOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) })
  const emptyDays = Array(getDay(monthStart)).fill(null)

  const updateForDay = (day: Date) => workUpdates.find(update =>
    update.date.split('T')[0] === format(day, 'yyyy-MM-dd')
  )

  return (
    <div className="select-none">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#737373]">{format(currentMonth, 'yyyy')}</p>
          <h2 className="text-xl font-medium tracking-tight text-white">{format(currentMonth, 'MMMM')}</h2>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
            className="h-8 w-8 rounded-full border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#444] hover:bg-[#1a1a1a] transition-all grid place-items-center text-sm" 
            aria-label="Previous month"
          >
            ‹
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
            className="h-8 w-8 rounded-full border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#444] hover:bg-[#1a1a1a] transition-all grid place-items-center text-sm" 
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="h-7 grid place-items-center text-[10px] sm:text-[11px] font-mono font-medium text-[#737373]">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const update = updateForDay(day)
          const selected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)
          
          let statusColor = null
          if (update?.is_leave) statusColor = '#cb5f5f'
          else if (update?.sick_leave) statusColor = '#ffea71'
          else if (update?.casual_leave) statusColor = '#8cab87'
          else if (update?.description?.trim()) statusColor = '#d4fc64'

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`relative aspect-square rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono transition-all duration-150 flex flex-col items-center justify-center ${
                selected 
                  ? 'bg-[#d4fc64] text-black font-semibold shadow-[0_0_18px_rgba(212,252,100,0.35)] scale-105 z-10' 
                  : today 
                    ? 'border border-[#d4fc64]/50 bg-[#d4fc64]/10 text-white font-medium hover:bg-[#d4fc64]/20' 
                    : 'text-[#a3a3a3] hover:text-white hover:bg-[#1c1c1c] border border-transparent'
              }`}
              aria-label={format(day, 'MMMM d, yyyy')}
            >
              <span>{format(day, 'd')}</span>
              {statusColor && !selected && (
                <span 
                  className="absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full shadow-sm" 
                  style={{ backgroundColor: statusColor }} 
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Status Legend in Modal Style */}
      <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex flex-wrap items-center gap-3.5 text-[11px] font-mono text-[#8b8b8b]">
        <span className="flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full bg-[#d4fc64] shadow-[0_0_6px_#d4fc64]" /> Active Entry
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full bg-[#cb5f5f]" /> Leave
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full bg-[#ffea71]" /> Sick
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-1.5 w-1.5 rounded-full bg-[#8cab87]" /> Casual
        </span>
      </div>
    </div>
  )
}
