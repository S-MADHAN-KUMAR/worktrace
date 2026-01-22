'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface WorkUpdate {
    id: string
    date: string
    description: string | null
    is_leave: boolean
}

export default function StatsPage() {
    const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const authenticated = localStorage.getItem('authenticated')
        if (!authenticated) {
            router.push('/login')
            return
        }
        loadMonthData()
    }, [router])

    const loadMonthData = async () => {
        try {
            setIsLoading(true)
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

            const { data, error } = await supabase
                .from('work_updates')
                .select('*')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth)

            if (error) throw error
            setWorkUpdates(data || [])
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Graph Data Calculation
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const graphData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        // Find update for this day
        const update = workUpdates.find(u => new Date(u.date).getDate() === day)

        // Value mapping: 100 (Work), 50 (Leave), 0 (No Entry)
        let value = 0
        let status = 'NONE'
        if (update) {
            if (update.is_leave) {
                value = 50
                status = 'LEAVE'
            } else {
                value = 100
                status = 'WORK'
            }
        }
        return { day, value, status }
    })

    // SVG Geometry
    const width = 800
    const height = 300
    const padding = 40

    // Create points string for polyline
    const points = graphData.map((d, i) => {
        const x = padding + (i / (daysInMonth - 1)) * (width - 2 * padding)
        const y = height - padding - (d.value / 100) * (height - 2 * padding)
        return `${x},${y}`
    }).join(' ')

    // Calculations for Cards
    const totalEntries = workUpdates.length
    const leaveDays = workUpdates.filter(u => u.is_leave).length
    const workingDays = totalEntries - leaveDays
    const currentMonthName = new Date().toLocaleString('default', { month: 'long' }).toUpperCase()

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
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="btn-cyber-filled px-4 py-2 flex items-center gap-2 text-xs text-[#050505]">
                        <span className="text-lg">«</span>
                        <span>RETURN_DASHBOARD</span>
                    </Link>
                    <h1 className="text-xl font-bold font-tech tracking-widest text-white/50">
                        TARGET_CONSOLE // <span className="text-[#CCFF00]">{currentMonthName}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                    <div className="hidden md:block animate-pulse text-[#CCFF00]">● LIVE_FEED</div>
                    <div>ID: USER_01 // SECURE</div>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 relative z-10 flex flex-col gap-8">

                {/* Main Graph Console */}
                <div className="w-full panel-base p-1 clip-corner-2 relative bg-[#080808] border border-[#333]">
                    {/* Console Header */}
                    <div className="bg-[#0F0F0F] border-b border-[#1F1F1F] p-2 flex justify-between items-center px-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#CCFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="text-[#CCFF00] font-mono text-xs tracking-widest">ACTIVITY_SIGNAL_TRACE</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                            <div className="w-2 h-2 bg-[#1F1F1F] border border-gray-700"></div>
                            <div className="w-2 h-2 bg-[#CCFF00]"></div>
                        </div>
                    </div>

                    {/* Graph Container */}
                    <div className="relative w-full h-[300px] md:h-[400px] bg-[#050505] overflow-hidden p-4">
                        {/* Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                            {/* X/Y Axes */}
                            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="1" />
                            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="1" />

                            {/* Grid Lines H */}
                            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1F1F1F" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1F1F1F" strokeWidth="1" strokeDasharray="4 4" />

                            {/* X-axis Labels */}
                            {graphData.map((d, i) => {
                                // Show label every 5 days or for first/last day
                                if (d.day === 1 || d.day === daysInMonth || d.day % 5 === 0) {
                                    const x = padding + (i / (daysInMonth - 1)) * (width - 2 * padding)
                                    return (
                                        <g key={`label-${i}`}>
                                            <line x1={x} y1={height - padding} x2={x} y2={height - padding + 5} stroke="#333" strokeWidth="1" />
                                            <text
                                                x={x}
                                                y={height - padding + 20}
                                                textAnchor="middle"
                                                className="fill-gray-600 font-mono text-[10px]"
                                            >
                                                {d.day.toString().padStart(2, '0')}
                                            </text>
                                        </g>
                                    )
                                }
                                return null
                            })}

                            {/* The Signal Line */}
                            <polyline
                                points={points}
                                fill="none"
                                stroke="#CCFF00"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                className="drop-shadow-[0_0_8px_rgba(204,255,0,0.6)]"
                            />

                            {/* Data Points */}
                            {graphData.map((d, i) => {
                                const x = padding + (i / (daysInMonth - 1)) * (width - 2 * padding)
                                const y = height - padding - (d.value / 100) * (height - 2 * padding)
                                return (
                                    <g key={i}>
                                        <circle cx={x} cy={y} r="3" fill="#050505" stroke={d.status === 'WORK' ? '#CCFF00' : d.status === 'LEAVE' ? '#EF4444' : '#333'} strokeWidth="2" />
                                        {/* Target Indicator for selected/latest */}
                                        {i === daysInMonth - 1 && (
                                            <g className="animate-pulse">
                                                <circle cx={x} cy={y} r="8" fill="none" stroke="#CCFF00" strokeWidth="1" opacity="0.5" />
                                                <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="#CCFF00" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
                                            </g>
                                        )}
                                    </g>
                                )
                            })}
                        </svg>

                        {/* Labels */}
                        <div className="absolute left-2 top-[35px] text-[10px] font-mono text-gray-500">100 // WORK</div>
                        <div className="absolute left-2 top-[50%] -translate-y-1/2 text-[10px] font-mono text-gray-500">50 // LEAVE</div>
                        <div className="absolute left-2 bottom-[35px] text-[10px] font-mono text-gray-500">00 // VOID</div>

                        <div className="absolute bottom-1 right-4 text-[10px] font-mono text-[#CCFF00]">T-MINUS: {daysInMonth} DAYS</div>
                    </div>
                </div>

                {/* Bottom Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Card 1: Work */}
                    <div className="panel-base p-6 bg-[#0A0A0A] border-l-4 border-l-[#CCFF00] relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-[#CCFF00]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.75l-2.5 1zm0 2.25l-5-2.5-5 2.5 10 5 10-5-5-2.5-5 2.5z" /></svg>
                        </div>
                        <h3 className="text-gray-500 font-mono text-xs tracking-widest mb-1">AGGREGATE_WORK</h3>
                        <div className="text-4xl font-black font-tech text-white mb-2">{workingDays} <span className="text-sm font-mono text-gray-600">DAYS</span></div>
                        <div className="w-full bg-[#1F1F1F] h-1">
                            <div className="h-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]" style={{ width: `${(workingDays / daysInMonth) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Card 2: Leave */}
                    <div className="panel-base p-6 bg-[#0A0A0A] border-l-4 border-l-red-500 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                        </div>
                        <h3 className="text-gray-500 font-mono text-xs tracking-widest mb-1">LEAVE_STATUS</h3>
                        <div className="text-4xl font-black font-tech text-white mb-2">{leaveDays} <span className="text-sm font-mono text-gray-600">DAYS</span></div>
                        <div className="w-full bg-[#1F1F1F] h-1">
                            <div className="h-full bg-red-500 shadow-[0_0_10px_red]" style={{ width: `${(leaveDays / daysInMonth) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Card 3: Optimization */}
                    <div className="panel-base p-6 bg-[#050505] border border-[#1F1F1F] flex flex-col justify-between">
                        <div className="text-xs font-mono text-[#CCFF00] mb-2 border-b border-[#333] pb-2">
                            SYSTEM_ADVISORY
                        </div>
                        <div className="space-y-2 font-mono text-[10px] text-gray-400">
                            <div className="flex justify-between">
                                <span>EFFICIENCY_RATE:</span>
                                <span className="text-white">94.2%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>NEXT_TARGET:</span>
                                <span className="text-white">MAINTAIN</span>
                            </div>
                            <div className="flex justify-between">
                                <span>SYNC_STATUS:</span>
                                <span className="text-[#CCFF00] animate-pulse">OPTIMAL</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
