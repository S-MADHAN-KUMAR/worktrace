'use client'

import { useState, useEffect } from 'react'
import {
  AiConfig,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_PROMPT,
  PROMPT_PRESETS,
  getStoredAiConfig,
  saveStoredAiConfig,
} from '@/lib/ai'

interface AiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (newConfig: AiConfig) => void
}

export default function AiSettingsModal({ isOpen, onClose, onSave }: AiSettingsModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('google/gemini-2.0-flash-001')
  const [customModel, setCustomModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [showKey, setShowKey] = useState(false)
  const [activePreset, setActivePreset] = useState<string>('standard')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredAiConfig()
      setApiKey(cfg.apiKey)
      const foundInDefaults = DEFAULT_MODELS.some(m => m.id === cfg.model)
      if (foundInDefaults) {
        setModel(cfg.model)
        setCustomModel('')
      } else {
        setModel('custom')
        setCustomModel(cfg.model)
      }
      setSystemPrompt(cfg.systemPrompt)
      setSaveStatus(null)
      setTestResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey)
    if (PROMPT_PRESETS[presetKey]) {
      setSystemPrompt(PROMPT_PRESETS[presetKey].prompt)
    }
  }

  const handleResetPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
    setActivePreset('standard')
  }

  const handleSave = () => {
    const finalModel = model === 'custom' ? (customModel.trim() || 'google/gemini-2.0-flash-001') : model
    const saved = saveStoredAiConfig({
      apiKey,
      model: finalModel,
      systemPrompt,
    })

    setSaveStatus('Preferences saved successfully.')
    if (onSave) onSave(saved)
    setTimeout(() => {
      setSaveStatus(null)
      onClose()
    }, 900)
  }

  const handleTestKey = async () => {
    setIsTesting(true)
    setTestResult(null)
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
        setTestResult({
          success: true,
          message: `Connected successfully with model: ${data.model || effectiveModel}`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network test error'
      setTestResult({ success: false, message })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c0c0c] border border-[#242424] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#ededed]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4fc64]/10 border border-[#d4fc64]/30 flex items-center justify-center text-[#d4fc64] font-mono text-sm">
              AI
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-medium text-white tracking-tight flex items-center gap-2">
                OpenRouter AI Settings
              </h2>
              <p className="text-[11px] font-mono text-[#737373]">
                Customizable system prompt & multimodal enhancement engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* OpenRouter API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64]" />
                OpenRouter API Key
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-[#d4fc64] hover:underline"
              >
                Get API Key ↗
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-or-v1-xxxxxxxxxxxxxxxx..."
                className="w-full bg-[#050505] border border-[#242424] focus:border-[#d4fc64] focus:ring-1 focus:ring-[#d4fc64] text-xs font-mono text-[#ededed] px-3.5 py-2.5 pr-20 rounded-xl focus:outline-none transition-all placeholder-[#444]"
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

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] font-mono text-[#666]">
                Stored locally in your browser. Never exposed publicly.
              </p>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !apiKey.trim()}
                className="text-[11px] font-mono text-[#a3a3a3] hover:text-[#d4fc64] disabled:opacity-40 transition-colors"
              >
                {isTesting ? 'Testing...' : 'Test Connection ⚡'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-mono border ${
                  testResult.success
                    ? 'bg-[#d4fc64]/10 border-[#d4fc64]/40 text-[#d4fc64]'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                {testResult.success ? '✓' : '✕'} {testResult.message}
              </div>
            )}
          </div>

          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6ac355]" />
              AI Model
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_MODELS.map(m => {
                const isSelected = model === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModel(m.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-white shadow-[0_0_15px_rgba(212,252,100,0.1)]'
                        : 'border-[#242424] bg-[#080808] hover:border-[#333] text-[#a3a3a3] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{m.name}</span>
                    </div>
                    <p className="text-[10px] text-[#737373] leading-snug line-clamp-1">{m.description}</p>
                  </button>
                )
              })}

              {/* Custom Model Card */}
              <button
                type="button"
                onClick={() => setModel('custom')}
                className={`text-left p-2.5 rounded-xl border transition-all ${
                  model === 'custom'
                    ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-white'
                    : 'border-[#242424] bg-[#080808] hover:border-[#333] text-[#a3a3a3] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white">Custom Model ID</span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#161616] text-[#a3a3a3]">
                    Any
                  </span>
                </div>
                <p className="text-[10px] text-[#737373]">Provide any model slug on OpenRouter</p>
              </button>
            </div>

            {model === 'custom' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                  placeholder="e.g. anthropic/claude-3-opus, mistralai/mistral-large"
                  className="w-full bg-[#050505] border border-[#242424] focus:border-[#d4fc64] text-xs font-mono text-[#ededed] px-3.5 py-2 rounded-xl focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Customizable System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffea71]" />
                Customizable System Prompt
              </label>
              <button
                type="button"
                onClick={handleResetPrompt}
                className="text-[11px] font-mono text-[#737373] hover:text-[#d4fc64] transition-colors"
              >
                Reset Default ↺
              </button>
            </div>

            {/* Presets Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-[#555] uppercase mr-1">Presets:</span>
              {Object.entries(PROMPT_PRESETS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetSelect(key)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                    activePreset === key
                      ? 'border-[#d4fc64] bg-[#d4fc64]/10 text-[#d4fc64]'
                      : 'border-[#242424] bg-[#111111] text-[#737373] hover:text-white'
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
              rows={8}
              placeholder="Define instructions for how the AI should structure and write your daily report..."
              className="w-full bg-[#050505] border border-[#242424] focus:border-[#d4fc64] focus:ring-1 focus:ring-[#d4fc64] text-xs font-mono text-[#ededed] p-3.5 rounded-xl focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
              <span>Instruct the model on tone, structure, and what to emphasize.</span>
              <span>{systemPrompt.length} chars</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#1c1c1c] bg-[#080808] flex items-center justify-between">
          <div className="text-xs font-mono text-[#d4fc64]">{saveStatus || ''}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#242424] text-xs font-mono text-[#a3a3a3] hover:text-white hover:border-[#383838] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-[#d4fc64] hover:bg-[#c8f9b6] text-black font-semibold text-xs font-mono shadow-[0_0_15px_rgba(212,252,100,0.25)] transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
