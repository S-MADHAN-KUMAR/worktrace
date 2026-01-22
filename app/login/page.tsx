'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
// import { useTheme } from '../components/ThemeProvider'

export const dynamic = 'force-dynamic'

const VALID_PASSWORD = 'allah'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  // const { theme, toggleTheme } = useTheme()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800))

    if (password === VALID_PASSWORD) {
      localStorage.setItem('authenticated', 'true')
      router.push('/dashboard')
    } else {
      setError('ACCESS DENIED // INVALID_CREDENTIALS')
      setPassword('')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505] font-mono">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
      <div className="scanlines"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="panel-base p-1 clip-corner-4 bg-[#0A0A0A] border border-[#1F1F1F]">
          <div className="p-8 relative overflow-hidden">
            {/* Spinning decorative ring */}
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 border border-[#1F1F1F] rounded-full animate-spin-slow opacity-50"></div>

            <div className="text-center mb-10 relative">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#CCFF00] mb-4 clip-corner-2">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-widest text-white mb-2 uppercase glitch-text" data-text="SECURE ACCESS">
                SECURE_ACCESS
              </h1>
              <p className="text-[#CCFF00] text-xs tracking-[0.2em] opacity-80">
                SYSTEM_LOCKED
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="relative group">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Password_Input</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full px-4 py-3 bg-black border border-[#333] text-[#CCFF00] font-mono text-center tracking-[0.5em] focus:outline-none focus:border-[#CCFF00] transition-all"
                  placeholder="***"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="animate-pulse">
                  <p className="text-xs font-bold text-red-500 text-center tracking-widest border border-red-900 bg-red-500/10 py-2">
                    &gt; {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full btn-cyber-filled flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-pulse">VERIFYING...</span>
                ) : (
                  <>
                    <span>AUTHENTICATE</span>
                    <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Decor */}
          <div className="bg-[#050505] p-2 flex justify-between items-center text-[9px] text-gray-600 font-mono uppercase border-t border-[#1F1F1F]">
            <span>ID: UNKNOWN</span>
            <span>PORT: 3000</span>
          </div>
        </div>
      </div>

    </div>
  )
}
