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
    // Generate dates based on mode
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

    // Group dates into weeks for the yearly view
    const weeks = useMemo(() => {
        if (mode === 'monthly') return []

        const rangeDates = dates
        if (!rangeDates.length) return []

        // Find the first Sunday/Monday before or on Jan 1st to align weeks
        const weeksArr: Date[][] = []
        let currentWeek: Date[] = []

        // Pad the first week if Jan 1st is not the start of the week
        const firstDayShift = getDay(rangeDates[0]) // 0 (Sun) - 6 (Sat)
        // Adjust for Mon-Sun if needed, but GitHub usually starts Sun
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
        if (entry.is_leave) return 1 // Regular leave
        if (entry.sick_leave) return 2 // Sick leave
        if (entry.casual_leave) return 4 // Casual leave
        return 3 // Work
    }

    const getColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-[#1a1a1a]' // Empty/Void
            case 1: return 'bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.4)]' // Leave (Red)
            case 2: return 'bg-orange-500/80 shadow-[0_0_5px_rgba(234,88,12,0.4)]' // Sick Leave (Orange)
            case 3: return 'bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.5)]' // Work (Main Cyberpunk Color)
            case 4: return 'bg-purple-500/80 shadow-[0_0_5px_rgba(168,85,247,0.4)]' // Casual Leave (Purple)
            default: return 'bg-[#1a1a1a]'
        }
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    if (mode === 'monthly') {
        const maxLevel = Math.max(...dates.map(d => getLevel(d)), 3)
        const chartHeight = 200

        return (
            <div className="flex flex-col gap-4 p-4 bg-[#050505] rounded-sm border border-[#1f1f1f] font-mono">
                <div className="flex justify-between items-center text-gray-500 text-[10px] tracking-widest border-b border-[#1f1f1f] pb-2">
                    <span className="font-bold text-[#CCFF00]">TRADING_GRAPH // {format(new Date(year, month), 'MMMM yyyy').toUpperCase()}</span>
                </div>

                {/* Trading Chart */}
                <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
                    {/* Y-axis grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-full border-t border-[#1f1f1f] relative">
                                <span className="absolute -left-8 -top-2 text-[8px] text-gray-700">{maxLevel - (i * maxLevel / 4)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Chart bars */}
                    <div className="absolute inset-0 flex items-end gap-[2px] px-8">
                        {dates.map((date, i) => {
                            const level = getLevel(date)
                            const height = level > 0 ? (level / maxLevel) * 100 : 0
                            const isLeave = level === 1
                            const isSickLeave = level === 2
                            const isWork = level === 3
                            const isCasualLeave = level === 4

                            return (
                                <div
                                    key={i}
                                    className="flex-1 group relative cursor-crosshair transition-all duration-300 hover:opacity-80"
                                    style={{ height: `${height}%`, minWidth: '4px' }}
                                >
                                    {/* Bar */}
                                    <div
                                        className={`w-full h-full relative ${
                                            isWork
                                                ? 'bg-gradient-to-t from-[#CCFF00] to-[#e5ff80] shadow-[0_0_10px_rgba(204,255,0,0.5)]'
                                                : isLeave
                                                ? 'bg-gradient-to-t from-red-500 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                : isSickLeave
                                                ? 'bg-gradient-to-t from-orange-500 to-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.5)]'
                                                : isCasualLeave
                                                ? 'bg-gradient-to-t from-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                                                : 'bg-[#1a1a1a]'
                                        }`}
                                    >
                                        {/* Highlight on top */}
                                        {level > 0 && (
                                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30"></div>
                                        )}
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0f0f0f] text-[#CCFF00] text-[9px] rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#CCFF00]/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] font-mono">
                                        <div className="flex flex-col gap-1">
                                            <span>[{format(date, 'MMM dd, yyyy')}]</span>
                                            {level > 0 && (
                                                <span className="text-[8px]">
                                                    {isWork ? '▲ WORK_SUCCESS' : isLeave ? '▼ LEAVE_LOGGED' : isSickLeave ? '▼ SICK_LEAVE' : '▼ CASUAL_LEAVE'} ({level})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute -bottom-6 left-8 right-8 flex justify-between text-[8px] text-gray-600">
                        {dates.filter((_, i) => i % 5 === 0 || i === dates.length - 1).map((date, i) => (
                            <span key={i}>{format(date, 'dd')}</span>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between gap-4 text-[9px] text-gray-600 font-mono mt-8 pt-2 border-t border-[#1f1f1f]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-gradient-to-t from-[#CCFF00] to-[#e5ff80]"></div>
                            <span>WORK</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-gradient-to-t from-red-500 to-red-400"></div>
                            <span>LEAVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-gradient-to-t from-orange-500 to-orange-400"></div>
                            <span>SICK_LEAVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-gradient-to-t from-purple-500 to-purple-400"></div>
                            <span>CASUAL_LEAVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-[#1a1a1a]"></div>
                            <span>NO_DATA</span>
                        </div>
                    </div>
                    <span className="text-gray-700">MARKET_ANALYSIS_MODE</span>
                </div>
            </div>
        )
    }

    // Yearly View (Cyberpunk Heatmap)
    return (
        <div className="flex flex-col gap-2 p-4 bg-[#050505] rounded-sm border border-[#1f1f1f] font-mono w-full overflow-x-auto custom-scrollbar">
            <div className="flex gap-2 w-full min-w-0">
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
                    <div className="flex text-[9px] text-gray-600 h-4 items-end mb-1 font-bold gap-1 w-full">
                        {weeks.map((week, i) => {
                            const firstDay = week.find(d => d !== null)
                            if (firstDay && i > 0) {
                                const prevWeekFirstDay = weeks[i - 1].find(d => d !== null)
                                if (prevWeekFirstDay && firstDay.getMonth() !== prevWeekFirstDay.getMonth()) {
                                    return (
                                        <div key={i} className="flex-1 min-w-[12px] text-[#CCFF00]/60 text-center">
                                            {format(firstDay, 'MMM').toUpperCase()}
                                        </div>
                                    )
                                }
                            } else if (firstDay && i === 0) {
                                return (
                                    <div key={i} className="flex-1 min-w-[12px] text-[#CCFF00]/60 text-center">
                                        {format(firstDay, 'MMM').toUpperCase()}
                                    </div>
                                )
                            }
                            return <div key={i} className="flex-1 min-w-[12px]" />
                        })}
                    </div>

                    {/* Columns (Weeks) */}
                    <div className="flex gap-1 w-full">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1 flex-1 min-w-[12px]">
                                {week.map((date, dayIndex) => {
                                    if (!date) return <div key={dayIndex} className="w-full aspect-square" />
                                    const level = getLevel(date)
                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`w-full aspect-square rounded-[1px] ${getColor(level)} transition-all duration-300 group relative cursor-crosshair border border-transparent hover:border-[#CCFF00]`}
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
