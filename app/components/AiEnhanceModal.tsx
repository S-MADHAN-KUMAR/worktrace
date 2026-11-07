'use client'

import { useState } from 'react'

interface AiEnhanceModalProps {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  originalContent: string
  enhancedContent: string
  modelUsed: string
  imageCount: number
  onClose: () => void
  onApply: (content: string) => void
  onAppend: (content: string) => void
  onRegenerate: (customInstruction?: string) => void
  onOpenSettings: () => void
  onOpenWhatsApp: (contentToSend: string) => void
}

export default function AiEnhanceModal({
  isOpen,
  isLoading,
  error,
  originalContent,
  enhancedContent,
  modelUsed,
  imageCount,
  onClose,
  onApply,
  onAppend,
  onRegenerate,
  onOpenSettings,
  onOpenWhatsApp,
}: AiEnhanceModalProps) {
  const [activeTab, setActiveTab] = useState<'enhanced' | 'original'>('enhanced')
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [showRefine, setShowRefine] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enhancedContent)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch (err) {
      console.error('Failed to copy enhanced report:', err)
    }
  }

  const handleSendToWhatsApp = () => {
    onOpenWhatsApp(enhancedContent)
  }

  return (
    <div
      className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-[#0c0c0c] border border-[#242424] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#ededed]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4fc64]/10 border border-[#d4fc64]/30 flex items-center justify-center text-[#d4fc64] text-base">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-medium text-white tracking-tight">
                  AI Work Report Enhancement
                </h2>
                {modelUsed && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#2a2a2a] bg-[#141414] text-[#a3a3a3]">
                    {modelUsed.split('/').pop()}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#737373]">
                {imageCount > 0 ? `${imageCount} screenshot(s) analyzed · ` : ''}Powered by OpenRouter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-[#d4fc64] transition-colors text-xs font-mono flex items-center gap-1"
              title="Configure AI Settings"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-white flex items-center justify-center transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-[#242424]" />
                <div className="absolute inset-0 rounded-full border-2 border-t-[#d4fc64] animate-spin" />
                <div className="absolute inset-2 rounded-full bg-[#d4fc64]/10 flex items-center justify-center text-sm">
                  ⚡
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Synthesizing Work Report...</h3>
                <p className="text-xs font-mono text-[#737373] max-w-sm">
                  {imageCount > 0
                    ? `Inspecting ${imageCount} screenshot(s) and structuring technical highlights with OpenRouter...`
                    : 'Transforming raw notes into an executive daily report with OpenRouter...'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-10 space-y-4">
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-200">
                <div className="font-semibold text-red-100 mb-1 flex items-center gap-1.5">
                  <span>✕</span> Enhancement Failed
                </div>
                <p className="leading-relaxed">{error}</p>
              </div>

              <div className="flex items-center gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-4 py-2 rounded-full border border-[#383838] bg-[#141414] hover:bg-[#222] text-xs font-mono text-white transition-all"
                >
                  Configure API Key in Settings ⚙️
                </button>
                <button
                  type="button"
                  onClick={() => onRegenerate()}
                  className="px-4 py-2 rounded-full bg-[#d4fc64] hover:bg-[#c8f9b6] text-black font-semibold text-xs font-mono transition-all"
                >
                  Retry ↺
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab Switcher */}
              <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('enhanced')}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all border ${
                      activeTab === 'enhanced'
                        ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-[#d4fc64] font-medium'
                        : 'border-[#242424] text-[#737373] hover:text-white'
                    }`}
                  >
                    ✨ Enhanced Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('original')}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all border ${
                      activeTab === 'original'
                        ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-[#d4fc64] font-medium'
                        : 'border-[#242424] text-[#737373] hover:text-white'
                    }`}
                  >
                    📝 Original Raw Notes
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-white transition-all"
                  >
                    {copyFeedback ? '✓ Copied' : 'Copy Text'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRefine(!showRefine)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-[#d4fc64] transition-all"
                  >
                    Refine ↺
                  </button>
                </div>
              </div>

              {/* Refinement input drawer */}
              {showRefine && (
                <div className="p-3 rounded-xl border border-[#2a2a2a] bg-[#111111] space-y-2">
                  <label className="text-[11px] font-mono text-[#a3a3a3]">
                    Additional tweak or instruction:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refinePrompt}
                      onChange={e => setRefinePrompt(e.target.value)}
                      placeholder="e.g. 'Make it more concise', 'Focus more on backend PRs', 'Remove emojis'..."
                      className="flex-1 bg-[#050505] border border-[#242424] focus:border-[#d4fc64] text-xs font-mono text-[#ededed] px-3 py-1.5 rounded-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onRegenerate(refinePrompt)
                        setShowRefine(false)
                        setRefinePrompt('')
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#d4fc64] hover:bg-[#c8f9b6] text-black text-xs font-mono font-medium transition-all"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              )}

              {/* Main Text Content */}
              {activeTab === 'enhanced' ? (
                <div className="rounded-xl border border-[#222] bg-[#070707] p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-[#ededed] max-h-[50vh] overflow-y-auto">
                  {enhancedContent}
                </div>
              ) : (
                <div className="rounded-xl border border-[#222] bg-[#070707] p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-[#888] max-h-[50vh] overflow-y-auto">
                  {originalContent || 'No raw notes provided.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!isLoading && !error && (
          <div className="px-5 sm:px-6 py-4 border-t border-[#1c1c1c] bg-[#080808] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(37,211,102,0.15)]"
              >
                <span>📲</span>
                <span>Send via WhatsApp</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onAppend(enhancedContent)
                  onClose()
                }}
                className="px-3.5 py-2 rounded-full border border-[#242424] text-xs font-mono text-[#a3a3a3] hover:text-white hover:border-[#383838] transition-all"
                title="Append to existing notes"
              >
                Append Below
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(enhancedContent)
                  onClose()
                }}
                className="px-5 py-2 rounded-full bg-[#d4fc64] hover:bg-[#c8f9b6] text-black font-semibold text-xs font-mono shadow-[0_0_15px_rgba(212,252,100,0.25)] transition-all flex items-center gap-1.5"
              >
                <span>✓ Apply to Description</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
