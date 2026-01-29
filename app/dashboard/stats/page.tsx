'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ContributionGraph from '@/app/components/ContributionGraph'
import { startOfMonth, endOfMonth, isWithinInterval, format, differenceInCalendarDays } from 'date-fns'

const RANGE_START = new Date(2025, 10, 1) // November 1, 2025
const RANGE_END = endOfMonth(new Date(2026, 11, 1)) // December 31, 2026

export const dynamic = 'force-dynamic'

interface WorkUpdate {
    id: string
    date: string
    description: string | null
    is_leave: boolean
}

interface Holiday {
    date: string
    localName: string
    name: string
    countryCode: string
}

export default function StatsPage() {
    const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'monthly' | 'range'>('range')
    const router = useRouter()

    useEffect(() => {
        const authenticated = localStorage.getItem('authenticated')
        if (!authenticated) {
            router.push('/login')
            return
        }
        loadStatsData(RANGE_START, RANGE_END)
    }, [router])

    useEffect(() => {
        fetchHolidays()
    }, [])

    const fetchHolidays = async () => {
        // Fallback holiday data for India 2026
        const fallbackHolidays: Holiday[] = [
            { date: '2026-01-01', localName: 'New Year Day', name: "New Year's Day", countryCode: 'IN' },
            { date: '2026-01-15', localName: 'Pongal', name: 'Pongal', countryCode: 'IN' },
            { date: '2026-01-16', localName: 'Thiruvalluvar Day', name: 'Thiruvalluvar Day', countryCode: 'IN' },
            { date: '2026-01-17', localName: 'Uzhavar Thirunal', name: 'Uzhavar Thirunal', countryCode: 'IN' },
            { date: '2026-01-26', localName: 'Republic Day', name: 'Republic Day', countryCode: 'IN' },
            { date: '2026-02-01', localName: 'Thai Poosam', name: 'Thai Poosam', countryCode: 'IN' },
            { date: '2026-03-19', localName: 'Telugu New Year', name: 'Telugu New Year', countryCode: 'IN' },
            { date: '2026-03-21', localName: 'Ramzan', name: 'Ramzan (Id-ul-Fitr)', countryCode: 'IN' },
            { date: '2026-03-31', localName: 'Mahavir Jayanti', name: 'Mahavir Jayanti', countryCode: 'IN' },
            { date: '2026-04-14', localName: 'Tamil New Year / Ambedkar Jayanti', name: 'Tamil New Year / Dr. Ambedkar Birthday', countryCode: 'IN' },
            { date: '2026-05-01', localName: 'May Day', name: 'May Day', countryCode: 'IN' },
            { date: '2026-05-28', localName: 'Bakrid', name: 'Bakrid (Id-ul-Zuha)', countryCode: 'IN' },
            { date: '2026-06-26', localName: 'Muharram', name: 'Muharram', countryCode: 'IN' },
            { date: '2026-08-15', localName: 'Independence Day', name: 'Independence Day', countryCode: 'IN' },
            { date: '2026-08-26', localName: 'Milad-un-Nabi', name: 'Milad-un-Nabi', countryCode: 'IN' },
            { date: '2026-09-04', localName: 'Krishna Jayanthi', name: 'Krishna Jayanthi', countryCode: 'IN' },
            { date: '2026-09-14', localName: 'Vinayakar Chathurthi', name: 'Vinayakar Chathurthi', countryCode: 'IN' },
            { date: '2026-10-02', localName: 'Gandhi Jayanti', name: 'Gandhi Jayanti', countryCode: 'IN' },
            { date: '2026-10-19', localName: 'Ayutha Pooja', name: 'Ayutha Pooja', countryCode: 'IN' },
            { date: '2026-10-20', localName: 'Vijaya Dasami', name: 'Vijaya Dasami', countryCode: 'IN' },
            { date: '2026-11-08', localName: 'Deepavali', name: 'Deepavali', countryCode: 'IN' },
            { date: '2026-12-25', localName: 'Christmas', name: 'Christmas', countryCode: 'IN' },
        ];

        try {
            const year = new Date().getFullYear()
            const response = await fetch(`https://date.nager.at/Api/v3/PublicHolidays/${year}/IN`)

            if (response.ok && response.status !== 204) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json()
                    const today = new Date().toISOString().split('T')[0]
                    const upcoming = data.filter((h: Holiday) => h.date >= today).slice(0, 5)
                    setHolidays(upcoming.length > 0 ? upcoming : fallbackHolidays.filter(h => h.date >= today).slice(0, 5))
                    return;
                }
            }
            // If API fails or returns no content, use fallback
            const today = new Date().toISOString().split('T')[0]
            setHolidays(fallbackHolidays.filter(h => h.date >= today).slice(0, 5))
        } catch (error) {
            console.error('Error fetching holidays, using fallback:', error)
            const today = new Date().toISOString().split('T')[0]
            setHolidays(fallbackHolidays.filter(h => h.date >= today).slice(0, 5))
        }
    }

    const loadStatsData = async (startDate: Date, endDate: Date) => {
        try {
            setIsLoading(true)
            const startStr = startDate.toISOString()
            const endStr = endDate.toISOString()

            const { data, error } = await supabase
                .from('work_updates')
                .select('*')
                .gte('date', startStr)
                .lte('date', endStr)

            if (error) throw error
            setWorkUpdates(data || [])
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Calculations based on current view
    const focusMonthDate = RANGE_START
    const filteredUpdates = viewMode === 'monthly'
        ? workUpdates.filter(u => isWithinInterval(new Date(u.date), { start: startOfMonth(focusMonthDate), end: endOfMonth(focusMonthDate) }))
        : workUpdates

    const totalEntries = filteredUpdates.length
    const leaveDays = filteredUpdates.filter(u => u.is_leave).length
    const workingDays = totalEntries - leaveDays

    const focusLabel = format(focusMonthDate, 'MMMM yyyy').toUpperCase()
    const rangeLabel = `${format(RANGE_START, 'MMMM yyyy').toUpperCase()} - ${format(RANGE_END, 'MMMM yyyy').toUpperCase()}`
    const scopeLabel = viewMode === 'range'
        ? rangeLabel
        : focusLabel

    const daysInView = viewMode === 'monthly'
        ? endOfMonth(focusMonthDate).getDate()
        : differenceInCalendarDays(RANGE_END, RANGE_START) + 1

    if (isLoading) {
        return (
            <div className="bg-[#050505] min-h-screen flex items-center justify-center">
                <div className="text-[#CCFF00] font-mono animate-pulse">CALCULATING_METRICS...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#CCFF00] selection:text-black flex flex-col relative overflow-hidden">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* HUD Header */}
            <header className="bg-[#050505]/90 border-b border-[#1F1F1F] px-6 h-20 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <button className="btn-cyber-red font-mono text-xs flex items-center gap-2 mr-2">

                <span>RETURN</span>
              </button>
                    </Link>
                  
                    
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                    <div className="flex bg-[#111] p-1 rounded-sm border border-[#333]">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1 rounded-sm transition-all ${viewMode === 'monthly' ? 'bg-[#CCFF00] text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            MONTHLY
                        </button>
                        <button
                            onClick={() => setViewMode('range')}
                            className={`px-3 py-1 rounded-sm transition-all ${viewMode === 'range' ? 'bg-[#CCFF00] text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            RANGE
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 relative z-10 flex flex-col gap-8">

                {/* Main Graph Console */}
                <div className="w-full panel-base p-1 clip-corner-2 relative bg-[#080808] border border-[#333]">
                    {/* Console Header */}
                    <div className="bg-[#0F0F0F] border-b border-[#1F1F1F] p-4 flex justify-between items-center px-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#CCFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="text-[#CCFF00] font-mono text-xs tracking-widest">ACTIVITY_CONTRIBUTION_HEATMAP</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                            <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                            <div className="w-2 h-2 bg-[#CCFF00]"></div>
                        </div>
                    </div>

                    {/* Graph Container */}
                    <div className="relative w-full bg-[#050505] p-2 md:p-6">
                        <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono mb-4">
                            <span>DISPLAY_MODE // {viewMode.toUpperCase()}</span>
                            <span className="text-[#CCFF00] font-bold">{scopeLabel}</span>
                        </div>
                        <ContributionGraph
                            data={workUpdates}
                            mode={viewMode}
                            year={focusMonthDate.getFullYear()}
                            month={focusMonthDate.getMonth()}
                            startDate={RANGE_START}
                            endDate={RANGE_END}
                        />
                    </div>
                </div>

                {/* Upcoming Government Holidays Table */}
                <div className="panel-base p-1 clip-corner-1 relative bg-[#080808] border border-[#1F1F1F]">
                    <div className="bg-[#0F0F0F] border-b border-[#1F1F1F] p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-blue-500 font-mono text-xs tracking-widest uppercase">Upcoming_Chennai_Government_Holidays_2026</span>
                        </div>
                        <div className="text-[10px] font-mono text-gray-600">SOURCE: TN_GOVT_GAZETTE_SYNC</div>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#1F1F1F]">
                                    <th className="py-3 px-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-medium">Date</th>
                                    <th className="py-3 px-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-medium">Holiday Name</th>
                                    <th className="py-3 px-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F1F1F]">
                                {holidays.length > 0 ? holidays.map((holiday, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-4 px-4 font-mono text-sm text-[#CCFF00]">
                                            {new Date(holiday.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-4 px-4 font-mono text-sm text-white">
                                            {holiday.name}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-mono">
                                                OFFICIAL_LEAVE
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500 font-mono text-xs">
                                            NO_UPCOMING_HOLIDAYS_FOUND
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    )
}
