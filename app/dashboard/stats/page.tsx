'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ContributionGraph from '@/app/components/ContributionGraph'
import Loader from '@/app/components/Loader'
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
    fetch('/api/auth/session')
      .then(response => response.json())
      .then(data => {
        if (!data.authenticated) router.push('/login')
      })
      .catch(() => router.push('/login'))
    loadStatsData(RANGE_START, RANGE_END)
  }, [router])

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
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
    ]

    try {
      const year = new Date().getFullYear()
      const response = await fetch(`https://date.nager.at/Api/v3/PublicHolidays/${year}/IN`)

      if (response.ok && response.status !== 204) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          const today = new Date().toISOString().split('T')[0]
          const upcoming = data.filter((h: Holiday) => h.date >= today).slice(0, 5)
          setHolidays(upcoming.length > 0 ? upcoming : fallbackHolidays.filter(h => h.date >= today).slice(0, 5))
          return
        }
      }
      const today = new Date().toISOString().split('T')[0]
      setHolidays(fallbackHolidays.filter(h => h.date >= today).slice(0, 5))
    } catch {
      const today = new Date().toISOString().split('T')[0]
      setHolidays(fallbackHolidays.filter(h => h.date >= today).slice(0, 5))
    }
  }

  const loadStatsData = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true)
      const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
      const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      const response = await fetch(`/api/entries?start=${start}&end=${end}`, { cache: 'no-store' })
      if (response.status === 401) {
        router.push('/login')
        return
      }
      if (!response.ok) throw new Error('Failed to load stats')
      setWorkUpdates(await response.json())
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const focusMonthDate = new Date()
  const filteredUpdates = viewMode === 'monthly'
    ? workUpdates.filter(u => isWithinInterval(new Date(u.date), { start: startOfMonth(focusMonthDate), end: endOfMonth(focusMonthDate) }))
    : workUpdates

  const totalEntries = filteredUpdates.length
  const leaveDays = filteredUpdates.filter(u => u.is_leave).length
  const sickLeaveDays = filteredUpdates.filter(u => u.sick_leave).length
  const casualLeaveDays = filteredUpdates.filter(u => u.casual_leave).length
  const workingDays = totalEntries - leaveDays - sickLeaveDays - casualLeaveDays

  const focusLabel = format(focusMonthDate, 'MMMM yyyy')
  const rangeLabel = `${format(RANGE_START, 'MMM yyyy')} - ${format(RANGE_END, 'MMM yyyy')}`
  const scopeLabel = viewMode === 'range' ? rangeLabel : focusLabel

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
        .filter(u => isWithinInterval(new Date(u.date), { start: rangeStart, end: rangeEnd }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const doc = new jsPDF()
      const title = `Worktrace Activity Report`
      const subtitle = `${format(rangeStart, 'MMM yyyy')} - ${format(rangeEnd, 'MMM yyyy')}`

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(title, 14, 20)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(subtitle, 14, 28)

      doc.setFontSize(9)

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
        doc.rect(14, headerTop, 182, headerBottom - headerTop)
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
          doc.setLineWidth(0.1)
          doc.rect(14, rowTop, 182, rowBottom - rowTop)
          doc.line(60, rowTop, 60, rowBottom)
          doc.line(100, rowTop, 100, rowBottom)

          y += lineHeight / 2
        })
      }

      const fileName = `worktrace-report-${format(rangeStart, 'yyyy-MM')}-to-${format(rangeEnd, 'yyyy-MM')}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

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

      const sickStatus = sickLeave === 0 ? 'None' : `${sickLeave} day${sickLeave > 1 ? 's' : ''}`
      const casualStatus = casualLeave === 0 ? 'None' : `${casualLeave} day${casualLeave > 1 ? 's' : ''}`

      months.push({
        month: format(currentDate, 'MMM'),
        year: format(currentDate, 'yyyy'),
        sickStatus,
        casualStatus,
        sickLeave,
        casualLeave,
        monthName: format(currentDate, 'MMMM yyyy'),
        totalDays: monthEnd.getDate(),
        workingDays: monthUpdates.filter(u => !u.is_leave && !u.sick_leave && !u.casual_leave).length,
        leaveDays: monthUpdates.filter(u => u.is_leave).length,
      })

      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    }

    return months.reverse()
  }

  const monthlySummary = generateMonthlySummary()

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <Loader label="Computing activity analytics..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-[#d4fc64] selection:text-black flex flex-col relative overflow-hidden">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-modal-grid opacity-20 pointer-events-none" />

      {/* Sticky Header in Modal Style */}
      <header className="h-16 sm:h-18 border-b border-[#1f1f1f] bg-black/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#d4fc64] rotate-45 transform" />
            <span className="font-semibold tracking-tight text-white text-sm sm:text-base">Worktrace</span>
          </Link>
          <span className="text-xs font-mono text-[#737373] hidden sm:inline-block">/ Analytics Console</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* View mode toggle pill */}
          <div className="flex items-center bg-[#111111] p-0.5 sm:p-1 rounded-full border border-[#262626]">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-mono transition-all duration-200 ${
                viewMode === 'monthly'
                  ? 'bg-[#d4fc64] text-black font-semibold shadow-[0_0_10px_rgba(212,252,100,0.3)]'
                  : 'text-[#737373] hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('range')}
              className={`px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-mono transition-all duration-200 ${
                viewMode === 'range'
                  ? 'bg-[#d4fc64] text-black font-semibold shadow-[0_0_10px_rgba(212,252,100,0.3)]'
                  : 'text-[#737373] hover:text-white'
              }`}
            >
              Full Range
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings">
              <button className="border border-[#2f2f2f] hover:border-[#444] bg-[#161616] text-[#ededed] hover:text-[#d4fc64] font-medium px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5">
                <span>Settings</span>
              </button>
            </Link>

            <Link href="/dashboard">
              <button className="border border-[#2f2f2f] hover:border-[#444] bg-[#161616] text-[#ededed] hover:text-[#d4fc64] font-medium px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5">
                <span>← <span className="hidden xs:inline">Dashboard</span><span className="xs:hidden">Back</span></span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 relative z-10 flex flex-col gap-6 sm:gap-8">
        {/* Metric Cards Row */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3.5 sm:p-5">
            <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-1">
              <span>Working Days</span>
              <span className="w-2 h-2 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64]" />
            </div>
            <p className="text-2xl sm:text-3xl font-medium text-white tracking-tight">{workingDays}</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3.5 sm:p-5">
            <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-1">
              <span>Full Leave</span>
              <span className="w-2 h-2 rounded-full bg-[#cb5f5f]" />
            </div>
            <p className="text-2xl sm:text-3xl font-medium text-[#cb5f5f] tracking-tight">{leaveDays}</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3.5 sm:p-5">
            <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-1">
              <span>Sick Leave</span>
              <span className="w-2 h-2 rounded-full bg-[#ffea71]" />
            </div>
            <p className="text-2xl sm:text-3xl font-medium text-[#ffea71] tracking-tight">{sickLeaveDays}</p>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3.5 sm:p-5">
            <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-1">
              <span>Casual Leave</span>
              <span className="w-2 h-2 rounded-full bg-[#8cab87]" />
            </div>
            <p className="text-2xl sm:text-3xl font-medium text-[#8cab87] tracking-tight">{casualLeaveDays}</p>
          </div>
        </section>

        {/* Heatmap / Activity Section - Open layout (not in a card) */}
        <section className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#1f1f1f]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64]" />
                <h2 className="text-base sm:text-lg font-medium text-white">Activity Heatmap</h2>
              </div>
              <p className="text-xs font-mono text-[#737373] mt-1">{scopeLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#a3a3a3] px-2.5 py-1 rounded-full border border-[#262626] bg-[#141414]">
                {totalEntries} Total Records
              </span>
            </div>
          </div>

          <ContributionGraph
            data={workUpdates}
            mode={viewMode}
            year={focusMonthDate.getFullYear()}
            month={focusMonthDate.getMonth()}
            startDate={RANGE_START}
            endDate={RANGE_END}
          />
        </section>

        {/* Monthly Leave Summary & Export Card */}
        <section className="rounded-2xl border border-[#242424] bg-[#111111] overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1f1f1f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-base font-medium text-white">Monthly Absence & Leave Log</h2>
              <p className="text-xs font-mono text-[#737373] mt-0.5">
                From {format(RANGE_START, 'MMMM yyyy')} to Present
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-[#161616] p-1 rounded-full border border-[#262626]">
                <button
                  onClick={() => setSummaryLayout('list')}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                    summaryLayout === 'list' ? 'bg-[#d4fc64] text-black font-semibold' : 'text-[#737373] hover:text-white'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setSummaryLayout('grid')}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                    summaryLayout === 'grid' ? 'bg-[#d4fc64] text-black font-semibold' : 'text-[#737373] hover:text-white'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          {/* List or Grid Display */}
          <div className="p-4 sm:p-6">
            {summaryLayout === 'list' ? (
              <div className="divide-y divide-[#1c1c1c] border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0c0c0c]">
                {monthlySummary.map((summary, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-3.5 sm:py-4 px-4 sm:px-6 hover:bg-[#121212] transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <span className="font-medium text-white text-base min-w-[50px] sm:min-w-[60px]">
                        {summary.month}
                      </span>
                      <span className="text-xs font-mono text-[#737373]">{summary.year}</span>
                      <span className="text-xs font-mono text-[#a3a3a3] border border-[#242424] px-2 py-0.5 rounded-full bg-[#141414]">
                        {summary.workingDays} working days
                      </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ffea71]" />
                        <span className="text-[#737373]">Sick:</span>
                        <span className={summary.sickLeave === 0 ? 'text-[#525252]' : 'text-[#ffea71] font-semibold'}>
                          {summary.sickStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8cab87]" />
                        <span className="text-[#737373]">Casual:</span>
                        <span className={summary.casualLeave === 0 ? 'text-[#525252]' : 'text-[#8cab87] font-semibold'}>
                          {summary.casualStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {monthlySummary.map((summary, idx) => (
                  <div key={idx} className="rounded-xl border border-[#242424] p-4 sm:p-5 bg-[#0c0c0c]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-white text-base sm:text-lg">{summary.monthName}</span>
                      <span className="text-xs font-mono text-[#d4fc64]">{summary.workingDays} days active</span>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between py-1.5 border-b border-[#1c1c1c]">
                        <span className="text-[#737373]">Calendar Days</span>
                        <span className="text-white">{summary.totalDays}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#1c1c1c]">
                        <span className="text-[#737373]">Total Leave</span>
                        <span className="text-[#cb5f5f]">{summary.leaveDays}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#1c1c1c]">
                        <span className="text-[#737373]">Sick Days</span>
                        <span className="text-[#ffea71]">{summary.sickLeave}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-[#737373]">Casual Days</span>
                        <span className="text-[#8cab87]">{summary.casualLeave}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Export Controls in Modal Style */}
          <div className="border-t border-[#1f1f1f] bg-[#0c0c0c] px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#737373]">
              <span className="uppercase tracking-wider">Export Period:</span>
              <input
                type="month"
                value={exportStartMonth}
                onChange={(e) => setExportStartMonth(e.target.value)}
                className="bg-[#141414] text-xs font-mono text-white border border-[#2e2e2e] rounded-lg px-2.5 sm:px-3 py-1.5 focus:outline-none focus:border-[#d4fc64]"
              />
              <span>to</span>
              <input
                type="month"
                value={exportEndMonth}
                onChange={(e) => setExportEndMonth(e.target.value)}
                className="bg-[#141414] text-xs font-mono text-white border border-[#2e2e2e] rounded-lg px-2.5 sm:px-3 py-1.5 focus:outline-none focus:border-[#d4fc64]"
              />
            </div>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-[#d4fc64] text-black font-semibold px-5 py-2.5 sm:py-2 rounded-full hover:bg-[#c8f9b6] transition-all text-xs font-mono shadow-[0_0_15px_rgba(212,252,100,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {isExporting ? 'Generating Report...' : 'Download PDF Summary ↓'}
            </button>
          </div>
        </section>

        {/* Upcoming Holidays Card */}
        {holidays.length > 0 && (
          <section className="rounded-2xl border border-[#242424] bg-[#111111] p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#d4fc64]" />
              <h2 className="text-base font-medium text-white">Upcoming Public Holidays</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {holidays.map((h, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-[#222] bg-[#0c0c0c]">
                  <p className="text-[11px] font-mono text-[#d4fc64]">{h.date}</p>
                  <p className="text-xs font-medium text-white mt-1 line-clamp-1">{h.localName || h.name}</p>
                  <p className="text-[10px] font-mono text-[#737373] mt-0.5">{h.countryCode}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
