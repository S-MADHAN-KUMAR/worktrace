'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TimePage() {
    const [time, setTime] = useState(new Date())
    const router = useRouter()

    useEffect(() => {
        const authenticated = localStorage.getItem('authenticated')
        if (!authenticated) {
            router.push('/login')
            return
        }

        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [router])

    const rawHours = time.getHours()
    const hours = (rawHours % 12 || 12).toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    const seconds = time.getSeconds().toString().padStart(2, '0')
    const period = rawHours >= 12 ? 'PM' : 'AM'
    const date = time.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#CCFF00] selection:text-black flex flex-col relative overflow-hidden">
            
            {/* Animated Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none animate-pulse"></div>
            
            {/* Glitch Lines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-full h-[2px] bg-[#CCFF00] opacity-20 animate-scan" style={{ top: '20%' }}></div>
                <div className="absolute w-full h-[1px] bg-[#CCFF00] opacity-10 animate-scan-slow" style={{ top: '60%' }}></div>
                <div className="absolute w-full h-[2px] bg-[#CCFF00] opacity-15 animate-scan-reverse" style={{ top: '80%' }}></div>
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#CCFF00] rounded-full opacity-30 animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-[#CCFF00] opacity-30"></div>
            <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-[#CCFF00] opacity-30"></div>
            <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-[#CCFF00] opacity-30"></div>
            <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-[#CCFF00] opacity-30"></div>

            {/* Header */}
            <header className="bg-[#000000]/90 border-b border-[#CCFF00]/20 px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
                <Link href="/dashboard" className="inline-block">
                    <button className="btn-cyber-red font-mono text-xs flex items-center gap-2">
                        <span>← RETURN</span>
                    </button>
                </Link>
            </header>

            {/* Main Time Display */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
                
                {/* System Label */}
                <div className="mb-8 flex items-center gap-3 animate-pulse">
                    <div className="w-3 h-3 bg-[#CCFF00] rounded-full shadow-[0_0_20px_#CCFF00]"></div>
                    <span className="font-mono text-[#CCFF00] text-sm tracking-[0.3em] uppercase">
                        CHRONO_SYNC_ACTIVE
                    </span>
                    <div className="w-3 h-3 bg-[#CCFF00] rounded-full shadow-[0_0_20px_#CCFF00]"></div>
                </div>

                {/* Time Display */}
                <div className="relative">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 blur-3xl bg-[#CCFF00] opacity-20 animate-pulse"></div>
                    
                    {/* Main Time */}
                    <div className="relative flex items-center gap-4 md:gap-8">
                        <div className="time-digit-group">
                            <span className="time-digit">{hours[0]}</span>
                            <span className="time-digit">{hours[1]}</span>
                        </div>
                        <span className="time-separator">:</span>
                        <div className="time-digit-group">
                            <span className="time-digit">{minutes[0]}</span>
                            <span className="time-digit">{minutes[1]}</span>
                        </div>
                        <span className="time-separator">:</span>
                        <div className="time-digit-group">
                            <span className="time-digit opacity-70">{seconds[0]}</span>
                            <span className="time-digit opacity-70">{seconds[1]}</span>
                        </div>
                        <span className="time-period">{period}</span>
                    </div>
                </div>

                {/* Date Display */}
                <div className="mt-12 font-mono text-[#CCFF00] text-xl md:text-3xl tracking-[0.2em] uppercase opacity-60 text-center">
                    {date}
                </div>

                {/* Status Indicators */}
                <div className="mt-16 flex gap-8 font-mono text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse"></div>
                        <span>UTC+05:30</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        <span>12H_FORMAT</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                        <span>MILLISYNC_ENABLED</span>
                    </div>
                </div>

            </main>

            <style jsx>{`
                .time-digit-group {
                    display: flex;
                    gap: 0.5rem;
                }

                .time-digit {
                    font-size: clamp(6rem, 20vw, 18rem);
                    font-weight: 900;
                    font-family: 'Courier New', monospace;
                    color: #CCFF00;
                    text-shadow: 
                        0 0 10px rgba(204, 255, 0, 0.8),
                        0 0 20px rgba(204, 255, 0, 0.6),
                        0 0 40px rgba(204, 255, 0, 0.4),
                        0 0 80px rgba(204, 255, 0, 0.2);
                    line-height: 1;
                    position: relative;
                }

                .time-digit::before {
                    content: attr(data-text);
                    position: absolute;
                    left: 2px;
                    text-shadow: -2px 0 #ff00ff;
                    top: 0;
                    color: #CCFF00;
                    overflow: hidden;
                    animation: glitch 3s infinite;
                }

                .time-separator {
                    font-size: clamp(6rem, 20vw, 18rem);
                    font-weight: 900;
                    font-family: 'Courier New', monospace;
                    color: #CCFF00;
                    text-shadow: 
                        0 0 10px rgba(204, 255, 0, 0.8),
                        0 0 20px rgba(204, 255, 0, 0.6);
                    line-height: 1;
                }

                .time-period {
                    font-size: clamp(3rem, 8vw, 6rem);
                    font-weight: 900;
                    font-family: 'Courier New', monospace;
                    color: #CCFF00;
                    text-shadow: 
                        0 0 10px rgba(204, 255, 0, 0.8),
                        0 0 20px rgba(204, 255, 0, 0.6);
                    line-height: 1;
                    margin-left: 1rem;
                    opacity: 0.8;
                }

                @keyframes glitch {
                    0%, 90%, 100% {
                        opacity: 0;
                    }
                    91%, 94% {
                        opacity: 0.3;
                        transform: translateX(2px);
                    }
                    92%, 96% {
                        opacity: 0.2;
                        transform: translateX(-2px);
                    }
                }

                @keyframes scan {
                    0% {
                        transform: translateY(-100vh);
                    }
                    100% {
                        transform: translateY(100vh);
                    }
                }

                @keyframes scan-slow {
                    0% {
                        transform: translateY(-100vh);
                    }
                    100% {
                        transform: translateY(100vh);
                    }
                }

                @keyframes scan-reverse {
                    0% {
                        transform: translateY(100vh);
                    }
                    100% {
                        transform: translateY(-100vh);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0);
                    }
                    50% {
                        transform: translate(20px, -20px);
                    }
                }

                .animate-scan {
                    animation: scan 8s linear infinite;
                }

                .animate-scan-slow {
                    animation: scan-slow 12s linear infinite;
                }

                .animate-scan-reverse {
                    animation: scan-reverse 10s linear infinite;
                }

                .animate-float {
                    animation: float 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
