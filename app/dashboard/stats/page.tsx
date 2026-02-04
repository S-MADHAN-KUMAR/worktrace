'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ContributionGraph from '@/app/components/ContributionGraph'
import { startOfMonth, endOfMonth, isWithinInterval, format, differenceInCalendarDays, subMonths } from 'date-fns'
import jsPDF from 'jspdf'

const RANGE_START = new Date(2025, 10, 1) // November 1, 2025
const RANGE_END = endOfMonth(new Date(2026, 11, 1)) // December 31, 2026

export const dynamic = 'force-dynamic'

interface WorkUpdate {
    id: string
    date: string
    description: string | null
    is_leave: boolean
    sick_leave?: boolean
    casual_leave?: boolean
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
    const [summaryLayout, setSummaryLayout] = useState<'list' | 'grid'>('list')
    const [exportStartMonth, setExportStartMonth] = useState<string>(() => {
        const start = RANGE_START
        return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    })
    const [exportEndMonth, setExportEndMonth] = useState<string>(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [isExporting, setIsExporting] = useState(false)
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
    const focusMonthDate = new Date() // Current month
    const filteredUpdates = viewMode === 'monthly'
        ? workUpdates.filter(u => isWithinInterval(new Date(u.date), { start: startOfMonth(focusMonthDate), end: endOfMonth(focusMonthDate) }))
        : workUpdates

    const totalEntries = filteredUpdates.length
    const leaveDays = filteredUpdates.filter(u => u.is_leave).length
    const sickLeaveDays = filteredUpdates.filter(u => u.sick_leave).length
    const casualLeaveDays = filteredUpdates.filter(u => u.casual_leave).length
    const workingDays = totalEntries - leaveDays - sickLeaveDays - casualLeaveDays

    // Calculate for this month (November 2025) and previous month (October 2025)
    const thisMonthStart = startOfMonth(RANGE_START)
    const thisMonthEnd = endOfMonth(RANGE_START)
    const prevMonthDate = subMonths(RANGE_START, 1)
    const prevMonthStart = startOfMonth(prevMonthDate)
    const prevMonthEnd = endOfMonth(prevMonthDate)

    const thisMonthUpdates = workUpdates.filter(u => isWithinInterval(new Date(u.date), { start: thisMonthStart, end: thisMonthEnd }))
    const prevMonthUpdates = workUpdates.filter(u => isWithinInterval(new Date(u.date), { start: prevMonthStart, end: prevMonthEnd }))

    const thisMonthSickLeave = thisMonthUpdates.filter(u => u.sick_leave).length
    const thisMonthCasualLeave = thisMonthUpdates.filter(u => u.casual_leave).length
    const prevMonthSickLeave = prevMonthUpdates.filter(u => u.sick_leave).length
    const prevMonthCasualLeave = prevMonthUpdates.filter(u => u.casual_leave).length

    const focusLabel = format(focusMonthDate, 'MMMM yyyy').toUpperCase()
    const rangeLabel = `${format(RANGE_START, 'MMMM yyyy').toUpperCase()} - ${format(RANGE_END, 'MMMM yyyy').toUpperCase()}`
    const scopeLabel = viewMode === 'range'
        ? rangeLabel
        : focusLabel

    const daysInView = viewMode === 'monthly'
        ? endOfMonth(focusMonthDate).getDate()
        : differenceInCalendarDays(RANGE_END, RANGE_START) + 1

    const handleExportPdf = () => {
        try {
            if (!exportStartMonth || !exportEndMonth) {
                alert('Please select both start and end months before exporting.')
                return
            }

            const [startYearStr, startMonthStr] = exportStartMonth.split('-')
            const [endYearStr, endMonthStr] = exportEndMonth.split('-')

            const startYear = parseInt(startYearStr, 10)
            const startMonthIdx = parseInt(startMonthStr, 10) - 1
            const endYear = parseInt(endYearStr, 10)
            const endMonthIdx = parseInt(endMonthStr, 10) - 1

            const rangeStart = new Date(startYear, startMonthIdx, 1)
            const rangeEnd = endOfMonth(new Date(endYear, endMonthIdx, 1))

            if (rangeStart > rangeEnd) {
                alert('Start month must be before or equal to end month.')
                return
            }

            setIsExporting(true)

            const rangeUpdates = workUpdates
                .filter(u =>
                    isWithinInterval(new Date(u.date), { start: rangeStart, end: rangeEnd })
                )
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            const doc = new jsPDF()
            const title = `Work Updates`
            const subtitle = `${format(rangeStart, 'MMM yyyy')} - ${format(rangeEnd, 'MMM yyyy')}`

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(16)
            doc.text(title, 14, 20)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(11)
            doc.text(subtitle, 14, 28)

            doc.setFontSize(9)

            // Table header
            let y = 38
            const lineHeight = 6
            const pageHeight = doc.internal.pageSize.height || 297
            const marginBottom = 20

            const renderTableHeader = () => {
                doc.setFont('helvetica', 'bold')
                const headerTop = y - lineHeight
                doc.text('DATE', 16, y)
                doc.text('TYPE', 62, y)
                doc.text('DESCRIPTION', 102, y)
                y += lineHeight
                const headerBottom = y
                doc.setLineWidth(0.2)
                // Header outer border
                doc.rect(14, headerTop, 182, headerBottom - headerTop)
                // Column separators
                doc.line(60, headerTop, 60, headerBottom)
                doc.line(100, headerTop, 100, headerBottom)
                y += lineHeight / 2
            }

            if (rangeUpdates.length === 0) {
                y = 40
                doc.text('No work entries found for this period.', 14, y)
            } else {
                renderTableHeader()

                rangeUpdates.forEach((u) => {
                    const entryDate = format(new Date(u.date), 'yyyy-MM-dd (EEE)')
                    const type = u.sick_leave
                        ? 'SICK LEAVE'
                        : u.casual_leave
                            ? 'CASUAL LEAVE'
                            : u.is_leave
                                ? 'LEAVE'
                                : 'WORK'

                    if (y + lineHeight * 2 > pageHeight - marginBottom) {
                        doc.addPage()
                        y = 20
                        renderTableHeader()
                    }

                    const rowTop = y - lineHeight / 2

                    doc.setFont('helvetica', 'normal')
                    doc.text(entryDate, 16, y)
                    doc.text(type, 62, y)

                    const desc = u.description && u.description.trim().length > 0
                        ? u.description
                        : type === 'WORK'
                            ? 'No description provided.'
                            : 'Leave day.'

                    const wrapped = doc.splitTextToSize(desc, 90)
                    wrapped.forEach((line: string) => {
                        if (y + lineHeight > pageHeight - marginBottom) {
                            doc.addPage()
                            y = 20
                            renderTableHeader()
                        }
                        doc.text(line, 102, y)
                        y += lineHeight
                    })

                    const rowBottom = y - lineHeight / 2

                    // Draw row borders
                    doc.setLineWidth(0.1)
                    // Outer rectangle
                    doc.rect(14, rowTop, 182, rowBottom - rowTop)
                    // Column separators
                    doc.line(60, rowTop, 60, rowBottom)
                    doc.line(100, rowTop, 100, rowBottom)

                    y += lineHeight / 2
                })
            }

            const fileName = `work-updates-${format(rangeStart, 'yyyy-MM')}-to-${format(rangeEnd, 'yyyy-MM')}.pdf`
            doc.save(fileName)
        } catch (error) {
            console.error('Error exporting PDF:', error)
            alert('Failed to export PDF. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    // Generate monthly leave summary from RANGE_START to current month
    const generateMonthlySummary = () => {
        const months = []
        let currentDate = new Date(RANGE_START)
        const now = new Date()
        
        while (currentDate <= now) {
            const monthStart = startOfMonth(currentDate)
            const monthEnd = endOfMonth(currentDate)
            const monthUpdates = workUpdates.filter(u => 
                isWithinInterval(new Date(u.date), { start: monthStart, end: monthEnd })
            )
            
            const sickLeave = monthUpdates.filter(u => u.sick_leave).length
            const casualLeave = monthUpdates.filter(u => u.casual_leave).length
            
            const sickStatus = sickLeave === 0 ? 'not taken' : `taken ${sickLeave} day${sickLeave > 1 ? 's' : ''}`
            const casualStatus = casualLeave === 0 ? 'not taken' : `taken ${casualLeave} day${casualLeave > 1 ? 's' : ''}`
            
            months.push({
                month: format(currentDate, 'MMM').toLowerCase(),
                year: format(currentDate, 'yyyy'),
                sickStatus,
                casualStatus,
                sickLeave,
                casualLeave,
                monthName: format(currentDate, 'MMMM yyyy'),
                totalDays: monthEnd.getDate(),
                workingDays: monthUpdates.filter(u => !u.is_leave && !u.sick_leave && !u.casual_leave).length,
                leaveDays: monthUpdates.filter(u => u.is_leave).length
            })
            
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        }
        
        return months.reverse() // Show from oldest to newest
    }

    const monthlySummary = generateMonthlySummary()

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
                    <div className="bg-[#0F0F0F] border-b border-[#1F1F1F] p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#CCFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="text-[#CCFF00] font-mono text-xs tracking-widest">ACTIVITY_CONTRIBUTION_HEATMAP</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex gap-1 self-end md:self-auto">
                                <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                                <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                                <div className="w-2 h-2 bg-[#CCFF00]"></div>
                            </div>
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

                {/* Monthly Leave Summary */}
                <div className="w-full panel-base p-1 clip-corner-2 relative bg-[#080808] border border-[#333]">
                    <div className="bg-[#0F0F0F] border-b border-[#1F1F1F] p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#CCFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-[#CCFF00] font-mono text-xs tracking-widest">MONTHLY_LEAVE_SUMMARY</span>
                            <span className="text-gray-600 font-mono text-xs ml-2">
                                ({format(RANGE_START, 'MMM yyyy')} - Current)
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-[#111] p-1 rounded-sm border border-[#333]">
                                <button
                                    onClick={() => setSummaryLayout('list')}
                                    className={`px-3 py-1 rounded-sm transition-all flex items-center gap-1 ${summaryLayout === 'list' ? 'bg-[#CCFF00] text-black' : 'text-gray-500 hover:text-white'}`}
                                    title="List View"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                </button>
                                <button
                                    onClick={() => setSummaryLayout('grid')}
                                    className={`px-3 py-1 rounded-sm transition-all flex items-center gap-1 ${summaryLayout === 'grid' ? 'bg-[#CCFF00] text-black' : 'text-gray-500 hover:text-white'}`}
                                    title="Grid View"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                                </button>
                            </div>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                                <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                                <div className="w-2 h-2 bg-[#CCFF00]"></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 overflow-x-auto">
                        {summaryLayout === 'list' ? (
                            // Simple List View
                            <div className="space-y-2 min-w-max">
                                {monthlySummary.map((summary, idx) => (
                                    <div 
                                        key={idx} 
                                        className="flex items-center justify-between gap-8 py-4 px-6 border border-[#1F1F1F] bg-[#0F0F0F]"
                                    >
                                        <div className="flex items-center gap-6 flex-1">
                                            <span className="font-mono font-bold text-[#CCFF00] min-w-[80px] text-lg">{summary.month.toUpperCase()}</span>
                                            <span className="text-gray-600 font-mono text-xs">{summary.year}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-orange-500/50 rounded-full"></div>
                                                <div className="font-mono text-sm">
                                                    <span className="text-gray-400">sick&nbsp;:&nbsp;</span>
                                                    <span className={summary.sickLeave === 0 ? 'text-gray-600' : 'text-orange-400 font-bold'}>
                                                        {summary.sickStatus}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-purple-500/50 rounded-full"></div>
                                                <div className="font-mono text-sm">
                                                    <span className="text-gray-400">casual&nbsp;:&nbsp;</span>
                                                    <span className={summary.casualLeave === 0 ? 'text-gray-600' : 'text-purple-400 font-bold'}>
                                                        {summary.casualStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Simple Grid View
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {monthlySummary.map((summary, idx) => (
                                    <div 
                                        key={idx} 
                                        className="border border-[#1F1F1F] p-6 bg-[#0F0F0F]"
                                    >
                                        <div className="mb-4">
                                            <span className="font-mono font-bold text-[#CCFF00] text-lg">{summary.month.toUpperCase()}</span>
                                            <span className="text-gray-600 font-mono text-xs ml-2">{summary.year}</span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-2 border-b border-[#1F1F1F]">
                                                <span className="text-gray-500 font-mono text-[10px]">TOTAL DAYS</span>
                                                <span className="text-white font-mono font-bold">{summary.totalDays}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2 border-b border-[#1F1F1F]">
                                                <span className="text-gray-500 font-mono text-[10px]">WORKING DAYS</span>
                                                <span className="text-[#CCFF00] font-mono font-bold">{summary.workingDays}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2 border-b border-[#1F1F1F]">
                                                <span className="text-gray-500 font-mono text-[10px]">TOTAL LEAVE</span>
                                                <span className="text-red-400 font-mono font-bold">{summary.leaveDays}</span>
                                            </div>
                                            
                                            <div className="pt-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-orange-500/50 rounded"></div>
                                                    <div className="text-orange-400 font-mono text-xs">Sick: {summary.sickLeave}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-purple-500/50 rounded"></div>
                                                    <div className="text-purple-400 font-mono text-xs">Casual: {summary.casualLeave}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Export Controls Below Summary */}
                    <div className="border-t border-[#1F1F1F] bg-[#050505]/60 px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            <span className="text-gray-500">Export Range</span>
                            <input
                                type="month"
                                value={exportStartMonth}
                                onChange={(e) => setExportStartMonth(e.target.value)}
                                className="bg-black text-xs font-mono text-[#CCFF00] border border-[#333] px-2 py-1 focus:outline-none focus:border-[#CCFF00]"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="month"
                                value={exportEndMonth}
                                onChange={(e) => setExportEndMonth(e.target.value)}
                                className="bg-black text-xs font-mono text-[#CCFF00] border border-[#333] px-2 py-1 focus:outline-none focus:border-[#CCFF00]"
                            />
                        </div>
                        <div className="flex items-center gap-3 justify-start lg:justify-end">
                            <button
                                onClick={handleExportPdf}
                                disabled={isExporting}
                                className="btn-cyber-filled px-4 py-2 text-[11px] font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? 'EXPORTING_PDF...' : 'EXPORT_PDF'}
                            </button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
