'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loader from '@/app/components/Loader'
import {
  WhatsAppRecipient,
  getSavedRecipients,
  saveRecipients,
  cleanPhoneNumber,
  formatDisplayPhone,
  buildWhatsAppWebUrl,
  buildWhatsAppAppUrl,
} from '@/lib/whatsapp'
import {
  AiConfig,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_PROMPT,
  PROMPT_PRESETS,
  getStoredAiConfig,
  saveStoredAiConfig,
} from '@/lib/ai'

export default function SettingsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'ai' | 'sandbox'>('whatsapp')
  const [now, setNow] = useState(new Date())

  // WhatsApp Mobile Directory State
  const [recipients, setRecipients] = useState<WhatsAppRecipient[]>([])
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [isDefaultContact, setIsDefaultContact] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [preferredAppMode, setPreferredAppMode] = useState<'web' | 'desktop'>('web')

  // AI Configuration State
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [model, setModel] = useState('google/gemini-2.0-flash-001')
  const [customModel, setCustomModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [activePreset, setActivePreset] = useState<string>('standard')
  const [isTestingAi, setIsTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Sandbox State
  const [sandboxInput, setSandboxInput] = useState(
    '1. Fixed database pooling connection timeout\n2. Shipped responsive header on mobile\n3. Reviewed PR #48'
  )
  const [sandboxOutput, setSandboxOutput] = useState('')
  const [isSandboxRunning, setIsSandboxRunning] = useState(false)
  const [sandboxError, setSandboxError] = useState<string | null>(null)

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login')
        } else {
          if (data.user) setUserName(data.user)
          // Load stored configurations
          const savedContacts = getSavedRecipients()
          setRecipients(savedContacts)

          const aiCfg = getStoredAiConfig()
          setApiKey(aiCfg.apiKey)
          const found = DEFAULT_MODELS.some(m => m.id === aiCfg.model)
          if (found) {
            setModel(aiCfg.model)
            setCustomModel('')
          } else {
            setModel('custom')
            setCustomModel(aiCfg.model)
          }
          setSystemPrompt(aiCfg.systemPrompt)

          const savedAppMode = localStorage.getItem('worktrace_whatsapp_mode') as 'web' | 'desktop' | null
          if (savedAppMode) setPreferredAppMode(savedAppMode)

          setIsLoading(false)
        }
      })
      .catch(() => router.push('/login'))

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  // --- WhatsApp Handlers ---
  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)

    const cleaned = cleanPhoneNumber(newPhone)
    if (!cleaned || cleaned.length < 8) {
      setPhoneError('Please enter a valid phone number with country code (e.g. +91 98765 43210)')
      return
    }

    const contactName = newName.trim() || `Contact ${recipients.length + 1}`
    const newEntry: WhatsAppRecipient = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: contactName,
      phone: newPhone.trim(),
      selected: isDefaultContact,
    }

    const updated = [...recipients, newEntry]
    setRecipients(updated)
    saveRecipients(updated)
    setNewName('')
    setNewPhone('')
    setIsDefaultContact(true)
    showToast(`✓ Added ${contactName} to WhatsApp contacts.`)
  }

  const handleDeleteRecipient = (id: string) => {
    const target = recipients.find(r => r.id === id)
    const updated = recipients.filter(r => r.id !== id)
    setRecipients(updated)
    saveRecipients(updated)
    showToast(`Removed ${target?.name || 'contact'}.`)
  }

  const handleToggleSelect = (id: string) => {
    const updated = recipients.map(r => (r.id === id ? { ...r, selected: !r.selected } : r))
    setRecipients(updated)
    saveRecipients(updated)
  }

  const handleStartEdit = (contact: WhatsAppRecipient) => {
    setEditingId(contact.id)
    setEditName(contact.name)
    setEditPhone(contact.phone)
  }

  const handleSaveEdit = (id: string) => {
    const cleaned = cleanPhoneNumber(editPhone)
    if (!cleaned || cleaned.length < 8) {
      showToast('✕ Invalid phone number format.')
      return
    }

    const updated = recipients.map(r =>
      r.id === id ? { ...r, name: editName.trim() || r.name, phone: editPhone.trim() } : r
    )
    setRecipients(updated)
    saveRecipients(updated)
    setEditingId(null)
    showToast('✓ Contact updated.')
  }

  const handleTestWhatsApp = (phone: string, name: string) => {
    const testMsg = `Hello ${name}! This is a test message dispatched from Worktrace.`
    const url =
      preferredAppMode === 'desktop'
        ? buildWhatsAppAppUrl(phone, testMsg)
        : buildWhatsAppWebUrl(phone, testMsg)
    window.open(url, '_blank', 'noopener,noreferrer')
    showToast(`✓ Opening WhatsApp for ${name}...`)
  }

  const handleModeChange = (mode: 'web' | 'desktop') => {
    setPreferredAppMode(mode)
    localStorage.setItem('worktrace_whatsapp_mode', mode)
    showToast(`✓ Preferred WhatsApp dispatch set to ${mode === 'web' ? 'WhatsApp Web' : 'WhatsApp App'}.`)
  }

  // --- AI Handlers ---
  const handleSaveAi = () => {
    const effectiveModel = model === 'custom' ? (customModel.trim() || 'google/gemini-2.0-flash-001') : model
    saveStoredAiConfig({
      apiKey,
      model: effectiveModel,
      systemPrompt,
    })
    showToast('✓ OpenRouter AI preferences saved.')
  }

  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey)
    if (PROMPT_PRESETS[presetKey]) {
      setSystemPrompt(PROMPT_PRESETS[presetKey].prompt)
    }
  }

  const handleTestAiKey = async () => {
    setIsTestingAi(true)
    setAiTestResult(null)
    const effectiveKey = apiKey.trim()
    const effectiveModel = model === 'custom' ? (customModel.trim() || 'google/gemini-2.0-flash-001') : model

    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: effectiveKey,
          model: effectiveModel,
          content: 'Ping test. Output "Connection OK".',
          systemPrompt: 'Respond only with: Connection OK',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setAiTestResult({
          success: true,
          message: `Connected successfully with model: ${data.model || effectiveModel}`,
        })
      } else {
        setAiTestResult({
          success: false,
          message: data.error || 'Connection failed',
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network test error'
      setAiTestResult({ success: false, message })
    } finally {
      setIsTestingAi(false)
    }
  }

  // --- Sandbox Handler ---
  const handleRunSandbox = async () => {
    if (!sandboxInput.trim()) return
    setIsSandboxRunning(true)
    setSandboxError(null)

    try {
      const effectiveModel = model === 'custom' ? (customModel.trim() || 'google/gemini-2.0-flash-001') : model
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sandboxInput.trim(),
          systemPrompt,
          model: effectiveModel,
          apiKey: apiKey.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enhance sample content')
      }

      setSandboxOutput(data.enhancedContent)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sandbox run failed'
      setSandboxError(msg)
    } finally {
      setIsSandboxRunning(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-[#ededed]">
        <Loader label="Loading configuration & directory..." />
      </main>
    )
  }

  const selectedCount = recipients.filter(r => r.selected).length

  return (
    <main className="min-h-screen bg-black text-[#ededed] font-sans relative selection:bg-[#d4fc64] selection:text-black">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-modal-grid opacity-20 pointer-events-none" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#d4fc64] text-black px-4 py-2 rounded-full text-xs font-mono font-medium shadow-[0_0_20px_rgba(212,252,100,0.35)] animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className="h-16 sm:h-18 border-b border-[#1f1f1f] bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-[3px] bg-[#d4fc64] rotate-45 transform" />
              <span className="w-3.5 h-3.5 rounded-[3px] bg-[#6ac355] rotate-45 transform" />
            </div>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white text-sm sm:text-base hover:text-[#d4fc64] transition-colors">
                Worktrace
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[#2e2e2e] bg-[#141414] text-[#a3a3a3]">
                Settings
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/time"
              className="hidden sm:flex h-9 items-center gap-2 px-3.5 rounded-full border border-[#262626] bg-[#111111] text-xs font-mono text-[#a3a3a3] hover:text-[#d4fc64] hover:border-[#3a3a3a] transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64] animate-pulse" />
              <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </Link>

            <Link
              href="/dashboard"
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full border border-[#2f2f2f] bg-[#161616] hover:border-[#444] text-xs font-medium text-white hover:text-[#d4fc64] grid place-items-center transition-all"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/stats"
              className="h-8 sm:h-9 px-3 sm:px-4 rounded-full border border-[#2f2f2f] bg-[#161616] hover:border-[#444] text-xs font-medium text-white hover:text-[#d4fc64] grid place-items-center transition-all"
            >
              Analytics
            </Link>

            {userName && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#262626] bg-[#111111] text-xs font-mono text-[#a3a3a3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64]" />
                {userName}
              </span>
            )}

            <button
              onClick={logout}
              className="h-8 sm:h-9 w-8 sm:w-9 rounded-full border border-[#262626] bg-[#111111] text-[#a3a3a3] hover:text-[#cb5f5f] hover:border-[#cb5f5f]/50 grid place-items-center transition-all text-xs"
              aria-label="Log out"
              title="Log out"
            >
              ↗
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Page Header */}
        <section className="mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-[#1c1c1c] flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64]" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-[#737373]">
                Infrastructure & Integrations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white">
              Workspace Settings
            </h1>
            <p className="text-xs sm:text-sm font-mono text-[#888] mt-1.5 max-w-2xl leading-relaxed">
              Add WhatsApp mobile numbers for daily report dispatch and configure your OpenRouter AI models & custom prompts.
            </p>
          </div>

          {/* Quick Stats Telemetry Cards */}
          <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:min-w-[140px] rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3 sm:px-4 sm:py-3 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] mb-1">
                <span>WhatsApp Directory</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
              </div>
              <p className="text-lg sm:text-xl font-medium text-white tracking-tight">
                {recipients.length} <span className="text-xs font-mono text-[#737373]">numbers</span>
              </p>
            </div>

            <div className="flex-1 sm:min-w-[140px] rounded-xl sm:rounded-2xl border border-[#242424] bg-[#111111] p-3 sm:px-4 sm:py-3 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] mb-1">
                <span>AI API Status</span>
                <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-[#d4fc64]' : 'bg-[#cb5f5f]'}`} />
              </div>
              <p className="text-lg sm:text-xl font-medium text-white tracking-tight">
                {apiKey ? 'Configured' : 'Key Missing'}
              </p>
            </div>
          </div>
        </section>

        {/* Tab Selector in Modal System Style */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 border-b border-[#1c1c1c] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-full text-xs font-mono transition-all duration-200 border flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-[#25D366]/15 border-[#25D366] text-[#25D366] font-medium shadow-[0_0_15px_rgba(37,211,102,0.15)]'
                : 'border-[#242424] bg-[#111111] text-[#737373] hover:text-white hover:border-[#383838]'
            }`}
          >
            <span>📱</span>
            <span>WhatsApp Mobile Numbers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 border border-[#25D366]/30">
              {recipients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-full text-xs font-mono transition-all duration-200 border flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-[#d4fc64]/15 border-[#d4fc64] text-[#d4fc64] font-medium shadow-[0_0_15px_rgba(212,252,100,0.15)]'
                : 'border-[#242424] bg-[#111111] text-[#737373] hover:text-white hover:border-[#383838]'
            }`}
          >
            <span>✨</span>
            <span>OpenRouter AI & Prompts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 rounded-full text-xs font-mono transition-all duration-200 border flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-[#ffea71]/15 border-[#ffea71] text-[#ffea71] font-medium shadow-[0_0_15px_rgba(255,234,113,0.15)]'
                : 'border-[#242424] bg-[#111111] text-[#737373] hover:text-white hover:border-[#383838]'
            }`}
          >
            <span>⚡</span>
            <span>Live Test Sandbox</span>
          </button>
        </div>

        {/* Tab 1: WhatsApp Mobile Numbers Management */}
        {activeTab === 'whatsapp' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Card: Add Mobile Contact Form */}
            <div className="lg:col-span-5 rounded-2xl border border-[#242424] bg-[#111111] p-5 sm:p-6 shadow-xl space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] shadow-[0_0_8px_#25D366]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373]">
                    Add New Mobile Number
                  </span>
                </div>
                <h2 className="text-lg font-medium text-white">Add WhatsApp Recipient</h2>
                <p className="text-xs font-mono text-[#737373] mt-1">
                  Save team leads, managers, or clients to dispatch daily work reports with screenshots.
                </p>
              </div>

              <form onSubmit={handleAddRecipient} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#a3a3a3] uppercase mb-1.5">
                    Contact Name / Role
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Engineering Lead, John Doe, Client Sarah"
                    className="w-full bg-[#070707] border border-[#242424] focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] text-xs font-mono text-[#ededed] px-3.5 py-2.5 rounded-xl focus:outline-none transition-all placeholder-[#444]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#a3a3a3] uppercase mb-1.5 flex items-center justify-between">
                    <span>Mobile Phone Number</span>
                    <span className="text-[10px] text-[#737373]">Include Country Code</span>
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210 or +1 415 555 2671"
                    className="w-full bg-[#070707] border border-[#242424] focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] text-xs font-mono text-[#ededed] px-3.5 py-2.5 rounded-xl focus:outline-none transition-all placeholder-[#444]"
                  />
                  <p className="text-[10px] font-mono text-[#555] mt-1">
                    Format: +[Country Code][Number] · India (+91), USA/CA (+1), UK (+44), UAE (+971)
                  </p>
                </div>

                {phoneError && (
                  <p className="text-xs font-mono text-[#cb5f5f]">✕ {phoneError}</p>
                )}

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs font-mono text-[#a3a3a3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefaultContact}
                      onChange={e => setIsDefaultContact(e.target.checked)}
                      className="accent-[#25D366] rounded"
                    />
                    <span>Select as active recipient by default</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-semibold text-xs font-mono shadow-[0_0_15px_rgba(37,211,102,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>+ Add to Mobile Directory</span>
                </button>
              </form>

              {/* Dispatch Preferences Sub-card */}
              <div className="pt-4 border-t border-[#1c1c1c] space-y-2.5">
                <label className="text-xs font-mono uppercase text-[#a3a3a3] block">
                  WhatsApp Launch Target
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('web')}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-left ${
                      preferredAppMode === 'web'
                        ? 'border-[#25D366] bg-[#25D366]/10 text-white'
                        : 'border-[#242424] bg-[#070707] text-[#737373] hover:text-white'
                    }`}
                  >
                    <div className="font-medium text-white mb-0.5">WhatsApp Web</div>
                    <div className="text-[10px] text-[#737373]">Opens in browser tab</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('desktop')}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-left ${
                      preferredAppMode === 'desktop'
                        ? 'border-[#25D366] bg-[#25D366]/10 text-white'
                        : 'border-[#242424] bg-[#070707] text-[#737373] hover:text-white'
                    }`}
                  >
                    <div className="font-medium text-white mb-0.5">Desktop App</div>
                    <div className="text-[10px] text-[#737373]">Opens installed app</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Card: Saved Mobile Directory */}
            <div className="lg:col-span-7 rounded-2xl border border-[#242424] bg-[#111111] p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#1c1c1c]">
                <div>
                  <h2 className="text-lg font-medium text-white">Saved Mobile Directory</h2>
                  <p className="text-xs font-mono text-[#737373]">
                    {recipients.length} contact(s) saved · {selectedCount} active for report dispatch
                  </p>
                </div>

                {recipients.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = recipients.map(r => ({ ...r, selected: true }))
                        setRecipients(updated)
                        saveRecipients(updated)
                        showToast('✓ All contacts marked active for dispatch.')
                      }}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-[#242424] bg-[#070707] text-[#a3a3a3] hover:text-white hover:border-[#383838]"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = recipients.map(r => ({ ...r, selected: false }))
                        setRecipients(updated)
                        saveRecipients(updated)
                        showToast('Deselected all.')
                      }}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-[#242424] bg-[#070707] text-[#a3a3a3] hover:text-[#cb5f5f] hover:border-[#cb5f5f]/40"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Directory List */}
              {recipients.length === 0 ? (
                <div className="py-12 border border-dashed border-[#242424] rounded-2xl text-center space-y-3 p-6">
                  <div className="w-12 h-12 rounded-2xl border border-[#242424] bg-[#141414] text-[#25D366] text-xl flex items-center justify-center mx-auto">
                    📱
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">No mobile numbers registered</h3>
                    <p className="text-xs font-mono text-[#737373] max-w-sm mx-auto mt-1">
                      Add your first recipient using the form on the left. They will automatically appear in your daily dashboard WhatsApp dispatch queue.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {recipients.map(contact => {
                    const isEditing = editingId === contact.id

                    return (
                      <div
                        key={contact.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          contact.selected
                            ? 'border-[#25D366]/40 bg-[#25D366]/5'
                            : 'border-[#222] bg-[#070707] opacity-80 hover:opacity-100'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="bg-[#111] border border-[#333] text-xs font-mono text-white p-2 rounded-lg"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={editPhone}
                                onChange={e => setEditPhone(e.target.value)}
                                className="bg-[#111] border border-[#333] text-xs font-mono text-white p-2 rounded-lg"
                                placeholder="Phone"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 text-[11px] font-mono border border-[#333] rounded-lg text-[#888] hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(contact.id)}
                                className="px-3 py-1 text-[11px] font-mono bg-[#25D366] text-black font-semibold rounded-lg"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!!contact.selected}
                                onChange={() => handleToggleSelect(contact.id)}
                                className="accent-[#25D366] rounded cursor-pointer"
                                title="Toggle default selection"
                              />

                              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#282828] text-xs font-mono text-white flex items-center justify-center font-bold">
                                {contact.name.slice(0, 2).toUpperCase()}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{contact.name}</span>
                                  {contact.selected && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366]">
                                      Default Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-mono text-[#888] mt-0.5">
                                  {formatDisplayPhone(contact.phone)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleTestWhatsApp(contact.phone, contact.name)}
                                className="px-2.5 py-1 rounded-lg border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#25D366] text-[11px] font-mono transition-all flex items-center gap-1"
                                title="Send test ping to WhatsApp"
                              >
                                <span>📲</span>
                                <span>Test Chat</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEdit(contact)}
                                className="p-1.5 rounded-lg border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-white text-xs font-mono"
                                title="Edit contact"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteRecipient(contact.id)}
                                className="p-1.5 rounded-lg border border-[#262626] bg-[#141414] hover:bg-red-950/40 text-[#a3a3a3] hover:text-[#cb5f5f] hover:border-red-800/40 text-xs font-mono"
                                title="Delete contact"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: OpenRouter AI Engine & Custom Prompts */}
        {activeTab === 'ai' && (
          <div className="rounded-2xl border border-[#242424] bg-[#111111] p-5 sm:p-8 shadow-xl space-y-8 max-w-4xl mx-auto">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#1c1c1c]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373]">
                    OpenRouter Intelligence Engine
                  </span>
                </div>
                <h2 className="text-xl font-medium text-white">OpenRouter AI Configuration</h2>
                <p className="text-xs font-mono text-[#737373] mt-1">
                  Connect your OpenRouter key, pick your model, and tailor your daily report system prompt.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAi}
                  className="px-5 py-2 rounded-full bg-[#d4fc64] hover:bg-[#c8f9b6] text-black font-semibold text-xs font-mono shadow-[0_0_15px_rgba(212,252,100,0.25)] transition-all cursor-pointer"
                >
                  Save AI Settings
                </button>
              </div>
            </div>

            {/* API Key Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64]" />
                  OpenRouter API Key
                </label>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#d4fc64] hover:underline"
                >
                  Get OpenRouter Key ↗
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxx..."
                  className="w-full bg-[#070707] border border-[#242424] focus:border-[#d4fc64] focus:ring-1 focus:ring-[#d4fc64] text-xs font-mono text-[#ededed] px-3.5 py-2.5 pr-20 rounded-xl focus:outline-none transition-all placeholder-[#444]"
                  spellCheck={false}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-2 py-1 text-[10px] font-mono rounded border border-[#262626] bg-[#141414] text-[#a3a3a3] hover:text-white"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="text-[#666]">
                  Stored locally in your browser. (Can also be set in .env as OPENROUTER_API_KEY)
                </span>
                <button
                  type="button"
                  onClick={handleTestAiKey}
                  disabled={isTestingAi || !apiKey.trim()}
                  className="text-[#a3a3a3] hover:text-[#d4fc64] disabled:opacity-40 transition-colors"
                >
                  {isTestingAi ? 'Testing...' : 'Test Connection ⚡'}
                </button>
              </div>

              {aiTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    aiTestResult.success
                      ? 'bg-[#d4fc64]/10 border-[#d4fc64]/40 text-[#d4fc64]'
                      : 'bg-red-950/40 border-red-800/60 text-red-300'
                  }`}
                >
                  {aiTestResult.success ? '✓' : '✕'} {aiTestResult.message}
                </div>
              )}
            </div>

            {/* AI Model Selector */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6ac355]" />
                Select AI Model
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DEFAULT_MODELS.map(m => {
                  const isSelected = model === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModel(m.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-white shadow-[0_0_15px_rgba(212,252,100,0.1)]'
                          : 'border-[#242424] bg-[#070707] hover:border-[#383838] text-[#a3a3a3] hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-medium text-white mb-1">{m.name}</div>
                      <p className="text-[10px] text-[#737373] leading-relaxed">{m.description}</p>
                    </button>
                  )
                })}

                {/* Custom Model Card */}
                <button
                  type="button"
                  onClick={() => setModel('custom')}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    model === 'custom'
                      ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-white'
                      : 'border-[#242424] bg-[#070707] hover:border-[#383838] text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  <div className="text-xs font-medium text-white mb-1">Custom OpenRouter Model</div>
                  <p className="text-[10px] text-[#737373] leading-relaxed">Enter any model slug available on OpenRouter</p>
                </button>
              </div>

              {model === 'custom' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    placeholder="e.g. mistralai/mistral-large, qwen/qwen-2.5-72b-instruct"
                    className="w-full bg-[#070707] border border-[#242424] focus:border-[#d4fc64] text-xs font-mono text-[#ededed] px-3.5 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* System Prompt Customizer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffea71]" />
                  Customizable System Prompt
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
                    setActivePreset('standard')
                    showToast('Reset system prompt to default.')
                  }}
                  className="text-xs font-mono text-[#737373] hover:text-[#d4fc64] transition-colors"
                >
                  Reset to Default ↺
                </button>
              </div>

              {/* Preset Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-[#555] uppercase">Presets:</span>
                {Object.entries(PROMPT_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`text-xs font-mono px-3 py-1 rounded-full border transition-all cursor-pointer ${
                      activePreset === key
                        ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-[#d4fc64]'
                        : 'border-[#242424] bg-[#070707] text-[#737373] hover:text-white'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              <textarea
                value={systemPrompt}
                onChange={e => {
                  setSystemPrompt(e.target.value)
                  setActivePreset('custom')
                }}
                rows={9}
                placeholder="Write instructions for how the AI should structure your daily work reports..."
                className="w-full bg-[#070707] border border-[#242424] focus:border-[#d4fc64] focus:ring-1 focus:ring-[#d4fc64] text-xs font-mono text-[#ededed] p-4 rounded-xl focus:outline-none resize-y leading-relaxed"
                spellCheck={false}
              />

              <div className="flex items-center justify-between text-xs font-mono text-[#666]">
                <span>This prompt will be used whenever you click &quot;Enhance with AI&quot;.</span>
                <span>{systemPrompt.length} chars</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1c1c1c] flex justify-end">
              <button
                type="button"
                onClick={handleSaveAi}
                className="px-6 py-2.5 rounded-full bg-[#d4fc64] hover:bg-[#c8f9b6] text-black font-semibold text-xs font-mono shadow-[0_0_15px_rgba(212,252,100,0.25)] transition-all cursor-pointer"
              >
                Save All AI Settings →
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Live Test Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="rounded-2xl border border-[#242424] bg-[#111111] p-5 sm:p-8 shadow-xl space-y-6 max-w-4xl mx-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#ffea71] shadow-[0_0_8px_#ffea71]" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373]">
                  Interactive Test Sandbox
                </span>
              </div>
              <h2 className="text-xl font-medium text-white">Test Prompt & Dispatch Preview</h2>
              <p className="text-xs font-mono text-[#737373] mt-1">
                Try out your customized AI prompt on sample notes and preview the formatted report before using it on your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#a3a3a3]">
                  <span>Sample Raw Notes:</span>
                  <span>{sandboxInput.length} chars</span>
                </div>
                <textarea
                  value={sandboxInput}
                  onChange={e => setSandboxInput(e.target.value)}
                  rows={9}
                  className="w-full bg-[#070707] border border-[#242424] focus:border-[#d4fc64] text-xs font-mono text-white p-3.5 rounded-xl focus:outline-none resize-none leading-relaxed"
                  placeholder="Enter sample work notes here..."
                />
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  disabled={isSandboxRunning || !sandboxInput.trim()}
                  className="w-full py-2 rounded-xl bg-[#d4fc64] hover:bg-[#c8f9b6] text-black font-semibold text-xs font-mono transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {isSandboxRunning ? (
                    <span className="animate-pulse">Generating via OpenRouter...</span>
                  ) : (
                    <span>⚡ Test AI Enhancement</span>
                  )}
                </button>
              </div>

              {/* Output Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#a3a3a3]">
                  <span>AI Enhanced Output:</span>
                  {sandboxOutput && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sandboxOutput)
                        showToast('✓ Copied sandbox output.')
                      }}
                      className="text-[#d4fc64] hover:underline"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <div className="w-full h-[216px] bg-[#070707] border border-[#242424] text-xs font-mono text-[#ededed] p-3.5 rounded-xl overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {sandboxOutput || (
                    <span className="text-[#555]">
                      Click &quot;Test AI Enhancement&quot; on the left to see how your current prompt and model format this report.
                    </span>
                  )}
                </div>

                {sandboxError && (
                  <p className="text-xs font-mono text-[#cb5f5f]">✕ {sandboxError}</p>
                )}

                {sandboxOutput && recipients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const primary = recipients[0]
                      const url =
                        preferredAppMode === 'desktop'
                          ? buildWhatsAppAppUrl(primary.phone, sandboxOutput)
                          : buildWhatsAppWebUrl(primary.phone, sandboxOutput)
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                    className="w-full py-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-mono transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>📲</span>
                    <span>Test Send to {recipients[0]?.name}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
