'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, addMonths, subMonths } from 'date-fns'

interface WorkUpdate {
  id: string
  date: string
  description: string | null
  is_leave: boolean
}

interface CalendarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  workUpdates: WorkUpdate[]
}

export default function Calendar({ selectedDate, onDateSelect, workUpdates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfWeek = getDay(monthStart)
  const emptyDays = Array(firstDayOfWeek).fill(null)

  const getWorkUpdateForDate = (date: Date): WorkUpdate | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return workUpdates.find(update => {
      const updateDateStr = update.date.split('T')[0]
      return updateDateStr === dateStr
    })
  }

  const isWorkingDay = (date: Date): boolean => {
    const dayOfWeek = getDay(date)
    return dayOfWeek !== 0 && dayOfWeek !== 6
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

  return (
    <div className="w-full">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#CCFF00] animate-pulse"></div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold font-tech text-white leading-none">
              {format(currentMonth, 'MMMM').toUpperCase()}
            </h2>
            <p className="text-[#CCFF00] text-[10px] font-mono tracking-widest">
              YEAR_{format(currentMonth, 'yyyy')}
            </p>
          </div>
        </div>

        <div className="flex gap-px">
          <button
            onClick={() => navigateMonth('prev')}
            className="w-8 h-8 flex items-center justify-center bg-[#111] border border-[#333] hover:border-[#CCFF00] hover:text-[#CCFF00] transition-colors"
          >
            &lt;
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="w-8 h-8 flex items-center justify-center bg-[#111] border border-[#333] hover:border-[#CCFF00] hover:text-[#CCFF00] transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="border border-[#1F1F1F] bg-[#1F1F1F] grid grid-cols-7 gap-px">
        {weekDays.map(day => (
          <div key={day} className="bg-[#0A0A0A] py-2 text-center text-[10px] font-mono font-bold text-gray-600 uppercase tracking-wider">
            {day}
          </div>
        ))}

        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="bg-[#050505] aspect-square" />
        ))}

        {daysInMonth.map(day => {
          const workUpdate = getWorkUpdateForDate(day)
          const isLeaveDay = workUpdate?.is_leave ?? false
          const hasTask = workUpdate && !isLeaveDay && workUpdate.description
          const isWeekend = !isWorkingDay(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentDay = isToday(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                relative bg-[#0A0A0A] aspect-square flex flex-col items-center justify-center
                transition-all duration-200 group
                ${isSelected ? 'bg-[#CCFF00] text-black' : 'text-gray-400 hover:bg-[#111]'}
                ${isWeekend && !isSelected ? 'opacity-30' : ''}
              `}
            >
              {/* Corner accent for today */}
              {isCurrentDay && !isSelected && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#CCFF00]"></div>
              )}

              <span className={`text-sm font-mono font-bold ${isSelected ? 'text-black' : ''}`}>
                {format(day, 'd')}
              </span>

              {/* Status Indicators */}
              <div className="absolute bottom-1 w-full flex justify-center gap-0.5 px-1">
                {hasTask && (
                  <div className={`h-[2px] w-[60%] ${isSelected ? 'bg-black' : 'bg-blue-500'} `}></div>
                )}
                {isLeaveDay && (
                  <div className={`h-[2px] w-[60%] ${isSelected ? 'bg-black' : 'bg-red-500'} `}></div>
                )}
              </div>

              {/* Selection Glitch Overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-[#CCFF00] mix-blend-overlay opacity-50"></div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-mono uppercase text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#CCFF00]"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-0.5 bg-blue-500"></div>
          <span>Data_Logged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-0.5 bg-red-500"></div>
          <span>Leave_Status</span>
        </div>
      </div>
    </div>
  )
}

