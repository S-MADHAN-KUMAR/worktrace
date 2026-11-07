'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  WhatsAppRecipient,
  getSavedRecipients,
  saveRecipients,
  formatReportForWhatsApp,
  cleanPhoneNumber,
  formatDisplayPhone,
  copyImageToClipboard,
  buildWhatsAppWebUrl,
  buildWhatsAppAppUrl,
  shareViaNativeSheet,
  dataUrlToBlob,
} from '@/lib/whatsapp'

interface ScreenshotItem {
  id: string
  url: string
  file?: File
}

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  currentDescription: string
  userName?: string
  screenshots: ScreenshotItem[]
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  selectedDate,
  currentDescription,
  userName,
  screenshots,
}: WhatsAppModalProps) {
  const [recipients, setRecipients] = useState<WhatsAppRecipient[]>([])
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Attachments & Message
  const [includeScreenshot, setIncludeScreenshot] = useState(true)
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number>(0)
  const [customMessage, setCustomMessage] = useState('')
  const [appMode, setAppMode] = useState<'web' | 'desktop'>('web')

  // Notification / Feedback
  const [copyToast, setCopyToast] = useState<string | null>(null)
  const [dispatchIndex, setDispatchIndex] = useState<number | null>(null)
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({})

  // Format initial message
  const dateStr = useMemo(() => {
    if (!selectedDate) return 'Today'
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [selectedDate])

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedRecipients()
      setRecipients(saved)
      const formatted = formatReportForWhatsApp({
        dateStr,
        content: currentDescription || 'No work description entered.',
        userName,
      })
      setCustomMessage(formatted)
      setIncludeScreenshot(screenshots.length > 0)
      setSelectedScreenshotIndex(0)
      setDispatchIndex(null)
      setSentMap({})
      setPhoneError(null)
    }
  }, [isOpen, dateStr, currentDescription, userName, screenshots.length])

  if (!isOpen) return null

  const selectedRecipients = recipients.filter(r => r.selected)

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)

    const cleaned = cleanPhoneNumber(newPhone)
    if (!cleaned || cleaned.length < 7) {
      setPhoneError('Please enter a valid phone number with country code (e.g. +91 98765 43210)')
      return
    }

    const contactName = newName.trim() || `Contact ${recipients.length + 1}`
    const newRecipient: WhatsAppRecipient = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: contactName,
      phone: newPhone.trim(),
      selected: true,
    }

    const updated = [...recipients, newRecipient]
    setRecipients(updated)
    saveRecipients(updated)
    setNewName('')
    setNewPhone('')
  }

  const handleToggleRecipient = (id: string) => {
    const updated = recipients.map(r => (r.id === id ? { ...r, selected: !r.selected } : r))
    setRecipients(updated)
    saveRecipients(updated)
  }

  const handleDeleteRecipient = (id: string) => {
    const updated = recipients.filter(r => r.id !== id)
    setRecipients(updated)
    saveRecipients(updated)
  }

  const handleSelectAll = (selectAll: boolean) => {
    const updated = recipients.map(r => ({ ...r, selected: selectAll }))
    setRecipients(updated)
    saveRecipients(updated)
  }

  const handleCopyScreenshot = async () => {
    if (screenshots.length === 0) return
    const activeShot = screenshots[selectedScreenshotIndex] || screenshots[0]
    setCopyToast('Preparing image for clipboard...')

    const success = await copyImageToClipboard(activeShot.file || activeShot.url)
    if (success) {
      setCopyToast('✓ Screenshot copied! Press Ctrl+V in WhatsApp chat to attach.')
    } else {
      setCopyToast('✕ Could not copy image to clipboard automatically. Right click thumbnail to copy.')
    }
    setTimeout(() => setCopyToast(null), 4500)
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customMessage)
      setCopyToast('✓ Message text copied to clipboard!')
      setTimeout(() => setCopyToast(null), 2500)
    } catch {
      setCopyToast('✕ Failed to copy text')
      setTimeout(() => setCopyToast(null), 2500)
    }
  }

  const handleNativeShare = async () => {
    let files: File[] = []
    if (includeScreenshot && screenshots.length > 0) {
      const activeShot = screenshots[selectedScreenshotIndex] || screenshots[0]
      if (activeShot.file) {
        files = [activeShot.file]
      } else if (activeShot.url.startsWith('data:')) {
        const blob = dataUrlToBlob(activeShot.url)
        files = [new File([blob], `worktrace_screenshot_${Date.now()}.png`, { type: 'image/png' })]
      }
    }

    const shared = await shareViaNativeSheet({
      title: `Daily Work Report - ${dateStr}`,
      text: customMessage,
      files,
    })

    if (shared) {
      setCopyToast('✓ Native share dialog opened.')
      setTimeout(() => setCopyToast(null), 3000)
    }
  }

  const openWhatsAppForRecipient = async (recipient: WhatsAppRecipient) => {
    // 1. Copy screenshot to clipboard first if attached so user can just Ctrl+V
    if (includeScreenshot && screenshots.length > 0) {
      const activeShot = screenshots[selectedScreenshotIndex] || screenshots[0]
      await copyImageToClipboard(activeShot.file || activeShot.url)
    }

    // 2. Open chat URL
    const url =
      appMode === 'desktop'
        ? buildWhatsAppAppUrl(recipient.phone, customMessage)
        : buildWhatsAppWebUrl(recipient.phone, customMessage)

    window.open(url, '_blank', 'noopener,noreferrer')

    // 3. Mark as sent
    setSentMap(prev => ({ ...prev, [recipient.id]: true }))
    setCopyToast(
      `✓ WhatsApp opened for ${recipient.name}! Screenshot is copied on clipboard — just press Ctrl+V to attach.`
    )
    setTimeout(() => setCopyToast(null), 5500)
  }

  const startBatchDispatch = async () => {
    if (selectedRecipients.length === 0) return

    // If single recipient, open directly
    if (selectedRecipients.length === 1) {
      await openWhatsAppForRecipient(selectedRecipients[0])
      return
    }

    // If multiple recipients, initiate dispatch queue
    setDispatchIndex(0)
    await openWhatsAppForRecipient(selectedRecipients[0])
  }

  const advanceDispatchQueue = async () => {
    if (dispatchIndex === null) return
    const nextIndex = dispatchIndex + 1
    if (nextIndex < selectedRecipients.length) {
      setDispatchIndex(nextIndex)
      await openWhatsAppForRecipient(selectedRecipients[nextIndex])
    } else {
      setDispatchIndex(null)
      setCopyToast('🎉 All selected recipients processed!')
      setTimeout(() => setCopyToast(null), 4000)
    }
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
        {/* Toast Alert Banner */}
        {copyToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#d4fc64] text-black px-4 py-2 rounded-full text-xs font-mono font-medium shadow-[0_0_20px_rgba(212,252,100,0.35)] flex items-center gap-2 max-w-[90%] text-center">
            <span>{copyToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] text-base">
              📲
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-medium text-white tracking-tight flex items-center gap-2">
                Send Report via WhatsApp
              </h2>
              <p className="text-[11px] font-mono text-[#737373]">
                Dispatch to multiple persons with screenshots & formatted report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-[#141414] p-0.5 rounded-lg border border-[#262626] text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setAppMode('web')}
                className={`px-2 py-1 rounded ${
                  appMode === 'web' ? 'bg-[#25D366] text-black font-semibold' : 'text-[#737373] hover:text-white'
                }`}
              >
                Web
              </button>
              <button
                type="button"
                onClick={() => setAppMode('desktop')}
                className={`px-2 py-1 rounded ${
                  appMode === 'desktop' ? 'bg-[#25D366] text-black font-semibold' : 'text-[#737373] hover:text-white'
                }`}
              >
                App
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-white flex items-center justify-center transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* Section 1: Recipients Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                1. Recipient Persons ({selectedRecipients.length} Selected)
              </label>

              {recipients.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-[#737373] hover:text-[#d4fc64] transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-[#333]">·</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-[#737373] hover:text-[#cb5f5f] transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Add Person Form */}
            <form onSubmit={handleAddRecipient} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name (e.g. Lead, Alex, Boss)"
                className="flex-1 bg-[#050505] border border-[#242424] focus:border-[#25D366] text-xs font-mono text-[#ededed] px-3.5 py-2 rounded-xl focus:outline-none"
              />
              <input
                type="text"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Phone with country code (e.g. +91 9876543210)"
                className="flex-1 bg-[#050505] border border-[#242424] focus:border-[#25D366] text-xs font-mono text-[#ededed] px-3.5 py-2 rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1c1c1c] hover:bg-[#25D366] text-[#ededed] hover:text-black font-mono text-xs rounded-xl border border-[#2f2f2f] hover:border-[#25D366] transition-all font-medium whitespace-nowrap"
              >
                + Add Person
              </button>
            </form>

            {phoneError && (
              <p className="text-[11px] font-mono text-[#cb5f5f]">✕ {phoneError}</p>
            )}

            {/* Saved Recipients Checkbox List */}
            {recipients.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {recipients.map(r => {
                  const isSent = !!sentMap[r.id]
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleToggleRecipient(r.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        r.selected
                          ? 'border-[#25D366]/40 bg-[#25D366]/10 text-white'
                          : 'border-[#222] bg-[#080808] text-[#737373] hover:border-[#333]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={!!r.selected}
                          onChange={() => {}} // handled by parent div
                          className="rounded border-[#333] text-[#25D366] focus:ring-0 accent-[#25D366]"
                        />
                        <div className="truncate">
                          <p className="text-xs font-medium text-white truncate">{r.name}</p>
                          <p className="text-[10px] font-mono text-[#737373]">{formatDisplayPhone(r.phone)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-2">
                        {isSent && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#25D366]/20 text-[#25D366]">
                            ✓ Sent
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            handleDeleteRecipient(r.id)
                          }}
                          className="w-5 h-5 rounded hover:bg-black/50 text-[#666] hover:text-[#cb5f5f] flex items-center justify-center text-xs"
                          title="Remove recipient"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-[#262626] text-center text-xs font-mono text-[#737373]">
                No recipients added yet. Add your manager, lead, or teammates above to save them.
              </div>
            )}
          </div>

          {/* Section 2: Screenshot Attachment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc64]" />
                2. Screenshot Evidence ({screenshots.length} Available)
              </label>

              {screenshots.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono text-[#a3a3a3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeScreenshot}
                      onChange={e => setIncludeScreenshot(e.target.checked)}
                      className="accent-[#d4fc64] rounded"
                    />
                    Include Screenshot
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyScreenshot}
                    className="text-[11px] font-mono text-[#d4fc64] hover:underline"
                  >
                    Copy Screenshot to Clipboard 📋
                  </button>
                </div>
              )}
            </div>

            {includeScreenshot && screenshots.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {screenshots.map((shot, index) => (
                    <div
                      key={shot.id}
                      onClick={() => setSelectedScreenshotIndex(index)}
                      className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        selectedScreenshotIndex === index
                          ? 'border-[#d4fc64] ring-2 ring-[#d4fc64]/40 scale-105'
                          : 'border-[#262626] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={shot.url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                      {selectedScreenshotIndex === index && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#d4fc64] text-black rounded-full flex items-center justify-center text-[8px] font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-2.5 rounded-lg bg-[#141414] border border-[#242424] text-[11px] font-mono text-[#a3a3a3] flex items-center justify-between">
                  <span>
                    💡 <strong>Pro-Tip:</strong> Clicking &quot;Send&quot; automatically copies the selected screenshot to your clipboard. When WhatsApp opens, just press <strong>Ctrl+V</strong> to attach!
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-[#222] bg-[#070707] text-xs font-mono text-[#737373]">
                {screenshots.length === 0
                  ? 'No screenshots attached to this date yet. You can paste screenshots (Ctrl+V) on the dashboard.'
                  : 'Screenshots attachment toggled off. Only text report will be sent.'}
              </div>
            )}
          </div>

          {/* Section 3: Message Text Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-[#a3a3a3] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffea71]" />
                3. WhatsApp Formatted Message
              </label>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-mono text-[#a3a3a3] hover:text-white transition-colors"
              >
                Copy Message Text 📋
              </button>
            </div>

            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              rows={6}
              className="w-full bg-[#050505] border border-[#242424] focus:border-[#25D366] text-xs font-mono text-[#ededed] p-3.5 rounded-xl focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
              <span>Uses WhatsApp syntax (*bold*, bullet points, emojis).</span>
              <span>{customMessage.length} chars</span>
            </div>
          </div>

          {/* Multi-Person Dispatch Queue Control */}
          {dispatchIndex !== null && selectedRecipients.length > 1 && (
            <div className="p-4 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-white">
                  Multi-Person Dispatch Queue ({dispatchIndex + 1} of {selectedRecipients.length})
                </span>
                <span className="text-[11px] font-mono text-[#25D366]">
                  {dispatchIndex + 1 === selectedRecipients.length ? 'Final Recipient' : 'In Progress'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#25D366] h-full transition-all duration-300"
                    style={{
                      width: `${((dispatchIndex + 1) / selectedRecipients.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs font-mono text-[#a3a3a3]">
                  Next Person: <strong className="text-white">{selectedRecipients[dispatchIndex]?.name}</strong> (
                  {formatDisplayPhone(selectedRecipients[dispatchIndex]?.phone || '')})
                </div>

                <button
                  type="button"
                  onClick={advanceDispatchQueue}
                  className="px-4 py-1.5 rounded-full bg-[#25D366] text-black font-semibold text-xs font-mono hover:bg-[#20ba59] transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                >
                  {dispatchIndex + 1 < selectedRecipients.length
                    ? `Send to ${selectedRecipients[dispatchIndex + 1]?.name} →`
                    : 'Done! Finish Queue ✓'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#1c1c1c] bg-[#080808] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-3.5 py-2 rounded-full border border-[#242424] text-xs font-mono text-[#a3a3a3] hover:text-white hover:border-[#383838] transition-all flex items-center gap-1.5"
              title="Share via device OS share sheet"
            >
              <span>📱</span>
              <span>Device Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#242424] text-xs font-mono text-[#a3a3a3] hover:text-white hover:border-[#383838] transition-all"
            >
              Close
            </button>

            <button
              type="button"
              onClick={startBatchDispatch}
              disabled={selectedRecipients.length === 0}
              className="px-6 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-black font-semibold text-xs font-mono shadow-[0_0_20px_rgba(37,211,102,0.25)] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>📲</span>
              <span>
                {selectedRecipients.length <= 1
                  ? `Send to ${selectedRecipients[0]?.name || 'Person'}`
                  : `Send to ${selectedRecipients.length} Selected Persons →`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
