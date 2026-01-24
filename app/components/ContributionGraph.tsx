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
    endOfMonth,
    subMonths,
    eachWeekOfInterval
} from 'date-fns'

interface WorkUpdate {
    date: string
    is_leave: boolean
}

interface ContributionGraphProps {
    data: WorkUpdate[]
    mode?: 'yearly' | 'monthly'
    year?: number
    month?: number // 0-11
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({
    data,
    mode = 'yearly',
    year = new Date().getFullYear(),
    month = new Date().getMonth()
}) => {
    // Generate dates based on mode
    const dates = useMemo(() => {
        if (mode === 'yearly') {
            const start = startOfYear(new Date(year, 0, 1))
            const end = endOfYear(new Date(year, 0, 1))
            return eachDayOfInterval({ start, end })
        } else {
            const start = startOfMonth(new Date(year, month, 1))
            const end = endOfMonth(new Date(year, month, 1))
            return eachDayOfInterval({ start, end })
        }
    }, [mode, year, month])

    // Group dates into weeks for the yearly view
    const weeks = useMemo(() => {
        if (mode !== 'yearly') return []

        const start = startOfYear(new Date(year, 0, 1))
        const end = endOfYear(new Date(year, 0, 1))

        // Find the first Sunday/Monday before or on Jan 1st to align weeks
        const calendarStart = start
        const weeksArr: Date[][] = []
        let currentWeek: Date[] = []

        // Pad the first week if Jan 1st is not the start of the week
        const firstDayShift = getDay(start) // 0 (Sun) - 6 (Sat)
        // Adjust for Mon-Sun if needed, but GitHub usually starts Sun
        for (let i = 0; i < firstDayShift; i++) {
            currentWeek.push(null as any)
        }

        dates.forEach((date) => {
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
    }, [dates, mode, year])

    const getLevel = (date: Date) => {
        if (!date) return 0
        const entry = data.find(u => isSameDay(new Date(u.date), date))
        if (!entry) return 0
        return entry.is_leave ? 1 : 3 // 1 for leave, 3 for work
    }

    const getColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-[#1a1a1a]' // Empty/Void
            case 1: return 'bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.4)]' // Leave (Red to match your Leave status)
            case 2: return 'bg-[#CCFF00]/40'
            case 3: return 'bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.5)]' // Work (Main Cyberpunk Color)
            case 4: return 'bg-[#e5ff80] shadow-[0_0_12px_rgba(204,255,0,0.8)]' // Peak
            default: return 'bg-[#1a1a1a]'
        }
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    if (mode === 'monthly') {
        return (
            <div className="flex flex-col gap-4 p-4 bg-[#050505] rounded-sm border border-[#1f1f1f] font-mono">
                <div className="flex justify-between items-center text-gray-500 text-[10px] tracking-widest border-b border-[#1f1f1f] pb-2">
                    <span className="font-bold text-[#CCFF00]">CALENDAR_VIEW // {format(new Date(year, month), 'MMMM yyyy').toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {dayLabels.map(day => (
                        <div key={day} className="text-[9px] text-gray-600 text-center font-bold">{day.toUpperCase()}</div>
                    ))}
                    {Array.from({ length: getDay(dates[0]) }).map((_, i) => (
                        <div key={`pad-${i}`} className="w-5 h-5 md:w-9 md:h-9" />
                    ))}
                    {dates.map((date, i) => {
                        const level = getLevel(date)
                        return (
                            <div
                                key={i}
                                className={`w-5 h-5 md:w-9 md:h-9 rounded-sm ${getColor(level)} transition-all duration-300 group relative border border-transparent hover:border-[#CCFF00]/50`}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0f0f0f] text-[#CCFF00] text-[9px] rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#CCFF00]/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] font-mono">
                                    [{format(date, 'yyyy.MM.dd')}]
                                    {level > 0 && ` > ${level === 3 ? 'WORK_SUCCESS' : 'LEAVE_LOGGED'}`}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-gray-600 font-mono">
                    <span className="mr-2">ACTIVITY_LEVELS:</span>
                    <div className="w-3 h-3 bg-[#1a1a1a]"></div>
                    <div className="w-3 h-3 bg-red-500/80"></div>
                    <div className="w-3 h-3 bg-[#CCFF00]/40"></div>
                    <div className="w-3 h-3 bg-[#CCFF00]"></div>
                    <span className="ml-2 font-bold text-gray-400">HIGH</span>
                </div>
            </div>
        )
    }

    // Yearly View (Cyberpunk Heatmap)
    return (
        <div className="flex flex-col gap-2 p-4 bg-[#050505] rounded-sm border border-[#1f1f1f] font-mono w-full overflow-x-auto custom-scrollbar">
            <div className="flex gap-2 min-w-max">
                {/* Y-axis labels */}
                <div className="flex flex-col gap-1 pt-6 text-[9px] text-gray-600 w-8 font-bold">
                    <div className="h-3"></div>
                    <div className="h-3 leading-3 text-center">M</div>
                    <div className="h-3"></div>
                    <div className="h-3 leading-3 text-center">W</div>
                    <div className="h-3"></div>
                    <div className="h-3 leading-3 text-center">F</div>
                    <div className="h-3"></div>
                </div>

                <div className="flex flex-col gap-1">
                    {/* Month Labels */}
                    <div className="flex text-[9px] text-gray-600 h-4 items-end mb-1 font-bold">
                        {weeks.map((week, i) => {
                            const firstDay = week.find(d => d !== null)
                            if (firstDay && i > 0) {
                                const prevWeekFirstDay = weeks[i - 1].find(d => d !== null)
                                if (prevWeekFirstDay && firstDay.getMonth() !== prevWeekFirstDay.getMonth()) {
                                    return (
                                        <div key={i} className="flex-none text-[#CCFF00]/60" style={{ width: '16px' }}>
                                            {format(firstDay, 'MMM').toUpperCase()}
                                        </div>
                                    )
                                }
                            } else if (firstDay && i === 0) {
                                return (
                                    <div key={i} className="flex-none text-[#CCFF00]/60" style={{ width: '16px' }}>
                                        {format(firstDay, 'MMM').toUpperCase()}
                                    </div>
                                )
                            }
                            return <div key={i} className="flex-none" style={{ width: '16px' }} />
                        })}
                    </div>

                    {/* Columns (Weeks) */}
                    <div className="flex gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((date, dayIndex) => {
                                    if (!date) return <div key={dayIndex} className="w-3 h-3" />
                                    const level = getLevel(date)
                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`w-3 h-3 rounded-[1px] ${getColor(level)} transition-all duration-300 group relative cursor-crosshair border border-transparent hover:border-[#CCFF00]`}
                                        >
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0f0f0f] text-[#CCFF00] text-[9px] rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#CCFF00]/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] font-mono">
                                                [{format(date, 'yyyy.MM.dd')}]
                                                {level > 0 && ` > ${level === 3 ? 'WORK_SUCCESS' : 'LEAVE_LOGGED'}`}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 px-2 border-t border-[#1f1f1f] pt-2">
                <div className="text-[8px] text-gray-700 tracking-[0.2em]">SIGNAL_STRENGTH_INDICATOR</div>
                <div className="flex items-center gap-1 text-[9px] text-gray-600 font-mono">
                    <span className="mr-1">LOW</span>
                    <div className="w-2.5 h-2.5 bg-[#1a1a1a]"></div>
                    <div className="w-2.5 h-2.5 bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 bg-[#CCFF00]/40"></div>
                    <div className="w-2.5 h-2.5 bg-[#CCFF00] shadow-[0_0_5px_#CCFF00]"></div>
                    <span className="ml-1 text-[#CCFF00]">MAX</span>
                </div>
            </div>
        </div>
    )
}

export default ContributionGraph
