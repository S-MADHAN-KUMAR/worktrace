'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import ModalCube from '../components/ModalCube'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [dbUrl, setDbUrl] = useState('')
  const [showDbConfig, setShowDbConfig] = useState(false)
  const [dbStatus, setDbStatus] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingDb, setIsTestingDb] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/dashboard')
        }
        if (data.dbPreview) {
          setDbStatus(data.dbPreview)
        }
      })
      .catch(() => {})
  }, [router])

  const handleTestConnectDb = async () => {
    if (!dbUrl.trim()) {
      setError('Please paste your Neon connection string first.')
      return
    }
    setError('')
    setSuccess('')
    setIsTestingDb(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_db', dbUrl: dbUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to connect to Neon database.')
      setSuccess('✓ Neon database connected and initialized!')
      setDbStatus(dbUrl.trim().replace(/:[^:@]+@/, ':***@'))
      setShowDbConfig(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Neon DB.')
    } finally {
      setIsTestingDb(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const payload: Record<string, string> = {
        name: name.trim(),
        password,
      }
      if (dbUrl.trim()) {
        payload.dbUrl = dbUrl.trim()
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        if (data.requiresRegistration) {
          setAuthMode('register')
        }
        throw new Error(data.error || 'Authentication failed. Please check credentials.')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.')
      setIsLoading(false)
    }
  }

  const clientLogos = [
    { name: 'Scale' },
    { name: 'Quora' },
    { name: 'Substack' },
    { name: 'Meta' },
    { name: 'Lovable' },
    { name: 'SUNO' },
    { name: 'Mistral AI' },
    { name: 'Cartesia' },
  ]

  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#d4fc64] selection:text-black">
      {/* Background tech grid */}
      <div className="absolute inset-0 bg-modal-grid opacity-20 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-30 w-full max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#d4fc64] rotate-45 transform" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#6ac355] rotate-45 transform" />
          </div>
          <span className="font-semibold tracking-tight text-base sm:text-lg text-white">Worktrace</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDbConfig(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#262626] bg-[#111111] hover:border-[#3a3a3a] text-xs font-mono text-[#a3a3a3] hover:text-[#d4fc64] transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64]" />
            <span>{dbStatus ? 'Neon DB Connected' : 'Connect Neon DB'}</span>
          </button>
        </div>
      </header>

      {/* Main Specimen & Auth Form */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 pt-2 sm:pt-4 pb-8 max-w-[1100px] mx-auto w-full">
        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.12] mb-3 px-2">
          <span className="bg-gradient-to-r from-[#f9fb04] via-[#d4fc64] to-white bg-clip-text text-transparent">
            Workspace infrastructure that
          </span>
          <br />
          <span className="text-white">developers love</span>
        </h1>

        <p className="text-sm sm:text-base text-[#a3a3a3] max-w-xl mx-auto leading-relaxed mb-6 px-2">
          Connected to your private Neon PostgreSQL database. Zero tracking overhead, complete privacy.
        </p>

        {/* Auth & Database Card */}
        <div className="w-full max-w-md mx-auto mb-6 px-2 text-left">
          <div className="bg-[#111111]/95 border border-[#242424] rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl relative">
            
            {/* Top Toggle Pills: Sign In vs Create Account */}
            <div className="flex items-center justify-between gap-2 p-1 bg-[#161616] rounded-xl border border-[#222222] mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin')
                  setError('')
                  setSuccess('')
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 text-center ${
                  authMode === 'signin'
                    ? 'bg-[#d4fc64] text-black font-semibold shadow-[0_0_12px_rgba(212,252,100,0.3)]'
                    : 'text-[#737373] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setError('')
                  setSuccess('')
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 text-center ${
                  authMode === 'register'
                    ? 'bg-[#d4fc64] text-black font-semibold shadow-[0_0_12px_rgba(212,252,100,0.3)]'
                    : 'text-[#737373] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Neon DB Connection Toggle Banner */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowDbConfig(prev => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-[#262626] bg-[#0c0c0c] hover:border-[#383838] transition-all text-xs font-mono text-[#a3a3a3]"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d4fc64]" />
                  <span>{dbStatus ? 'Using Private Neon DB' : 'Connect Your Neon DB'}</span>
                </span>
                <span className="text-[#d4fc64]">{showDbConfig ? '▲ Hide' : '▼ Configure'}</span>
              </button>

              {showDbConfig && (
                <div className="mt-2.5 p-3.5 rounded-xl border border-[#262626] bg-[#0c0c0c] space-y-2">
                  <label className="block text-[11px] font-mono text-[#737373]">
                    Neon PostgreSQL Connection URL
                  </label>
                  <input
                    type="password"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    placeholder="postgresql://neondb_owner:***@...neon.tech/neondb?sslmode=require"
                    className="w-full px-3 py-2 bg-black border border-[#2e2e2e] rounded-lg text-xs font-mono text-[#ededed] placeholder-[#444] focus:outline-none focus:border-[#d4fc64]"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleTestConnectDb}
                      disabled={isTestingDb || !dbUrl.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#262626] text-xs font-mono text-[#d4fc64] border border-[#333] transition-colors disabled:opacity-50"
                    >
                      {isTestingDb ? 'Connecting...' : 'Test & Save DB'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#737373] mb-1.5">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4fc64] focus:ring-1 focus:ring-[#d4fc64] transition-all placeholder-[#525252]"
                  placeholder="Your Name"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#737373] mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4fc64] focus:ring-1 focus:ring-[#d4fc64] transition-all placeholder-[#525252]"
                  placeholder="Choose password"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="py-2.5 px-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 font-mono">
                  {error}
                </div>
              )}

              {success && (
                <div className="py-2.5 px-3.5 rounded-xl bg-[#d4fc64]/10 border border-[#d4fc64]/40 text-xs text-[#d4fc64] font-mono">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !name.trim() || !password}
                className="w-full bg-[#d4fc64] text-black font-semibold py-3 rounded-full hover:bg-[#c8f9b6] transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,252,100,0.25)] flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="font-mono text-xs animate-pulse">Connecting to database...</span>
                ) : (
                  <span>{authMode === 'register' ? 'Create Account in Private DB →' : 'Sign In to Workspace →'}</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Modal Cube Specimen */}
        <div className="relative mt-2">
          <ModalCube size="hero" />
        </div>
      </main>

      {/* Bottom Grid Logo Strip */}
      <footer className="relative z-20 w-full border-t border-[#1c1c1c] bg-black/60 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 divide-x divide-y md:divide-y-0 divide-[#1c1c1c] border-x border-[#1c1c1c]">
            {clientLogos.map((client) => (
              <div
                key={client.name}
                className="h-12 sm:h-14 flex items-center justify-center text-[#737373] hover:text-[#d4fc64] transition-colors font-mono text-xs tracking-wider"
              >
                {client.name}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
