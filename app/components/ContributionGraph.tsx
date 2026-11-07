'use client'

import React, { useMemo } from 'react'
import {
  format,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  getDay,
  isSameDay,
  startOfMonth,
  endOfMonth
} from 'date-fns'

interface WorkUpdate {
  date: string
  is_leave: boolean
  sick_leave?: boolean
  casual_leave?: boolean
}

interface ContributionGraphProps {
  data: WorkUpdate[]
  mode?: 'yearly' | 'monthly' | 'range'
  year?: number
  month?: number // 0-11
  startDate?: Date | string
  endDate?: Date | string
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  mode = 'yearly',
  year = new Date().getFullYear(),
  month = new Date().getMonth(),
  startDate,
  endDate
}) => {
  const dates = useMemo(() => {
    if (mode === 'yearly') {
      const start = startOfYear(new Date(year, 0, 1))
      const end = endOfYear(new Date(year, 0, 1))
      return eachDayOfInterval({ start, end })
    } else {
      if (mode === 'monthly') {
        const start = startOfMonth(new Date(year, month, 1))
        const end = endOfMonth(new Date(year, month, 1))
        return eachDayOfInterval({ start, end })
      }

      if (!startDate || !endDate) return []
      const start = startOfMonth(new Date(startDate))
      const end = endOfMonth(new Date(endDate))
      return eachDayOfInterval({ start, end })
    }
  }, [mode, year, month, startDate, endDate])

  const weeks = useMemo(() => {
    if (mode === 'monthly') return []

    const rangeDates = dates
    if (!rangeDates.length) return []

    const weeksArr: Date[][] = []
    let currentWeek: Date[] = []

    const firstDayShift = getDay(rangeDates[0])
    for (let i = 0; i < firstDayShift; i++) {
      currentWeek.push(null as any)
    }

    rangeDates.forEach((date) => {
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(date)
    })

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as any)
      }
      weeksArr.push(currentWeek)
    }

    return weeksArr
  }, [dates, mode])

  const getLevel = (date: Date) => {
    if (!date) return 0
    const entry = data.find(u => isSameDay(new Date(u.date), date))
    if (!entry) return 0
    if (entry.is_leave) return 1
    if (entry.sick_leave) return 2
    if (entry.casual_leave) return 4
    return 3
  }

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-[#181818] border border-[#222222]'
      case 1: return 'bg-[#cb5f5f] shadow-[0_0_6px_rgba(203,95,95,0.4)]'
      case 2: return 'bg-[#ffea71] shadow-[0_0_6px_rgba(255,234,113,0.4)]'
      case 3: return 'bg-[#d4fc64] shadow-[0_0_10px_rgba(212,252,100,0.5)]'
      case 4: return 'bg-[#8cab87] shadow-[0_0_6px_rgba(140,171,135,0.4)]'
      default: return 'bg-[#181818] border border-[#222222]'
    }
  }

  if (mode === 'monthly') {
    const maxLevel = Math.max(...dates.map(d => getLevel(d)), 3)
    const chartHeight = 220

    return (
      <div className="flex flex-col gap-4 font-sans w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4fc64] shadow-[0_0_6px_#d4fc64]" />
            <h3 className="text-sm font-medium text-white">
              Activity Breakdown — {format(new Date(year, month), 'MMMM yyyy')}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#737373]">Daily Log Distribution</span>
        </div>

        {/* Monthly Bar Chart */}
        <div className="relative w-full pt-4" style={{ height: `${chartHeight}px` }}>
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full border-t border-[#1c1c1c] relative" />
            ))}
          </div>

          <div className="absolute inset-0 flex items-end gap-1 sm:gap-1.5 px-1 sm:px-2">
            {dates.map((date, i) => {
              const level = getLevel(date)
              const height = level > 0 ? (level / maxLevel) * 100 : 8
              const isWork = level === 3
              const isLeave = level === 1
              const isSick = level === 2
              const isCasual = level === 4

              return (
                <div
                  key={i}
                  className="flex-1 group relative cursor-pointer transition-all duration-200 hover:opacity-80"
                  style={{ height: `${height}%`, minWidth: '4px' }}
                >
                  <div
                    className={`w-full h-full rounded-t-sm transition-all ${
                      isWork
                        ? 'bg-[#d4fc64] shadow-[0_0_12px_rgba(212,252,100,0.4)]'
                        : isLeave
                        ? 'bg-[#cb5f5f]'
                        : isSick
                        ? 'bg-[#ffea71]'
                        : isCasual
                        ? 'bg-[#8cab87]'
                        : 'bg-[#1c1c1c]'
                    }`}
                  />

                  {/* Sleek Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#181818] text-white text-[11px] font-mono rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#2e2e2e] shadow-2xl">
                    <p className="text-xs font-semibold text-white">{format(date, 'MMM d, yyyy')}</p>
                    <p className="text-[10px] text-[#a3a3a3]">
                      {isWork ? 'Logged Active' : isLeave ? 'Leave' : isSick ? 'Sick Leave' : isCasual ? 'Casual Leave' : 'No Activity'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="absolute -bottom-6 left-1 sm:left-2 right-1 sm:right-2 flex justify-between text-[10px] font-mono text-[#737373]">
            {dates.filter((_, i) => i % 5 === 0 || i === dates.length - 1).map((date, i) => (
              <span key={i}>{format(date, 'd MMM')}</span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#737373] mt-8 pt-3 border-t border-[#1f1f1f]">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#d4fc64]" /> Active Log
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#cb5f5f]" /> Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#ffea71]" /> Sick Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#8cab87]" /> Casual Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#1c1c1c] border border-[#282828]" /> Empty
            </span>
          </div>
          <span>Monthly Metric</span>
        </div>
      </div>
    )
  }

  // Yearly / Range View Heatmap - Direct fit layout with NO card and NO horizontal scroll
  return (
    <div className="flex flex-col gap-3 font-sans w-full">
      <div className="flex gap-2 sm:gap-3 w-full min-w-0">
        <div className="flex flex-col gap-0.5 sm:gap-1 pt-5 sm:pt-6 text-[9px] sm:text-[10px] font-mono text-[#737373] w-3.5 sm:w-5 text-center select-none shrink-0">
          <div className="h-2.5 sm:h-3" />
          <div className="h-2.5 sm:h-3 leading-none">M</div>
          <div className="h-2.5 sm:h-3" />
          <div className="h-2.5 sm:h-3 leading-none">W</div>
          <div className="h-2.5 sm:h-3" />
          <div className="h-2.5 sm:h-3 leading-none">F</div>
          <div className="h-2.5 sm:h-3" />
        </div>

        <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 min-w-0 w-full">
          {/* Month Labels */}
          <div className="flex text-[9px] sm:text-[10px] font-mono text-[#737373] h-4 items-end mb-1 gap-0.5 sm:gap-1 w-full select-none min-w-0">
            {weeks.map((week, i) => {
              const firstDay = week.find(d => d !== null)
              if (firstDay && i > 0) {
                const prevWeekFirstDay = weeks[i - 1].find(d => d !== null)
                if (prevWeekFirstDay && firstDay.getMonth() !== prevWeekFirstDay.getMonth()) {
                  return (
                    <div key={i} className="flex-1 min-w-0 relative h-4">
                      <span className="absolute left-0 bottom-0 text-[9px] sm:text-[10px] text-[#a3a3a3] whitespace-nowrap pointer-events-none">
                        {format(firstDay, 'MMM')}
                      </span>
                    </div>
                  )
                }
              } else if (firstDay && i === 0) {
                return (
                  <div key={i} className="flex-1 min-w-0 relative h-4">
                    <span className="absolute left-0 bottom-0 text-[9px] sm:text-[10px] text-[#a3a3a3] whitespace-nowrap pointer-events-none">
                      {format(firstDay, 'MMM')}
                    </span>
                  </div>
                )
              }
              return <div key={i} className="flex-1 min-w-0" />
            })}
          </div>

          {/* Grid Cells */}
          <div className="flex gap-0.5 sm:gap-1 w-full min-w-0">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 sm:gap-1 flex-1 min-w-0">
                {week.map((date, dayIndex) => {
                  if (!date) return <div key={dayIndex} className="w-full aspect-square" />
                  const level = getLevel(date)
                  return (
                    <div
                      key={dayIndex}
                      className={`w-full aspect-square rounded-[2px] sm:rounded-[3px] ${getColor(level)} transition-all duration-200 group relative cursor-pointer hover:ring-2 hover:ring-[#d4fc64]/50`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[#181818] text-white text-[11px] font-mono rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#2e2e2e] shadow-2xl">
                        <span className="font-semibold">{format(date, 'MMM d, yyyy')}</span>
                        {level > 0 && (
                          <span className="block text-[10px] text-[#a3a3a3]">
                            {level === 3 ? 'Active Log' : level === 1 ? 'Leave' : level === 2 ? 'Sick Leave' : 'Casual Leave'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#1f1f1f] text-xs font-mono text-[#737373] w-full">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-[#181818] border border-[#222]" />
          <div className="w-3 h-3 rounded-[2px] bg-[#cb5f5f]" />
          <div className="w-3 h-3 rounded-[2px] bg-[#d4fc64]/40" />
          <div className="w-3 h-3 rounded-[2px] bg-[#d4fc64] shadow-[0_0_6px_#d4fc64]" />
          <span>More</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d4fc64]" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#cb5f5f]" /> Away
          </span>
        </div>
      </div>
    </div>
  )
}

export default ContributionGraph
