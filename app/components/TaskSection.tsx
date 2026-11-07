'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import AiSettingsModal from './AiSettingsModal'
import AiEnhanceModal from './AiEnhanceModal'
import WhatsAppModal from './WhatsAppModal'
import { getStoredAiConfig, optimizeImageForAi } from '@/lib/ai'

interface WorkUpdate {
  id: string
  date: string
  description: string | null
  is_leave: boolean
  sick_leave?: boolean
  casual_leave?: boolean
}

interface WorkUpdateImage {
  id: string
  work_update_id: string
  image_url: string
}

interface TaskSectionProps {
  selectedDate: Date | null
  workUpdates: WorkUpdate[]
  onUpdate: () => void
  userName?: string
}

export default function TaskSection({
  selectedDate,
  workUpdates,
  onUpdate,
  userName,
}: TaskSectionProps) {
  const [description, setDescription] = useState('')
  const [isLeave, setIsLeave] = useState(false)
  const [sickLeave, setSickLeave] = useState(false)
  const [casualLeave, setCasualLeave] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<WorkUpdateImage[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [pasteNotification, setPasteNotification] = useState<string | null>(null)
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // AI Enhancement State
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false)
  const [isAiEnhanceOpen, setIsAiEnhanceOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [enhancedReport, setEnhancedReport] = useState('')
  const [modelUsed, setModelUsed] = useState('')

  // WhatsApp State
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const currentWorkUpdate = useMemo(() => {
    if (!selectedDate) return null
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return workUpdates.find(update => {
      const updateDateStr = update.date.split('T')[0]
      return updateDateStr === dateStr
    }) || null
  }, [selectedDate, workUpdates])

  const loadExistingImages = useCallback(async (workUpdateId: string) => {
    try {
      const response = await fetch(`/api/entries/${workUpdateId}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load images')
      setExistingImages(await response.json())
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }, [])

  useEffect(() => {
    if (selectedDate && currentWorkUpdate) {
      setDescription(currentWorkUpdate.description || '')
      setIsLeave(currentWorkUpdate.is_leave || false)
      setSickLeave(currentWorkUpdate.sick_leave || false)
      setCasualLeave(currentWorkUpdate.casual_leave || false)
      loadExistingImages(currentWorkUpdate.id)
    } else if (selectedDate) {
      setDescription('')
      setIsLeave(false)
      setSickLeave(false)
      setCasualLeave(false)
      setExistingImages([])
    } else {
      setDescription('')
      setIsLeave(false)
      setSickLeave(false)
      setCasualLeave(false)
      setImages([])
      setImagePreviews([])
      setExistingImages([])
    }
  }, [selectedDate, currentWorkUpdate, loadExistingImages])

  useEffect(() => {
    if (!selectedDate) return

    const handleDocumentPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        e.preventDefault()
        const newPreviews = files.map(file => URL.createObjectURL(file))
        setImages(prev => [...prev, ...files])
        setImagePreviews(prev => [...prev, ...newPreviews])
        setPasteNotification(`${files.length} screenshot(s) attached from clipboard`)
        setTimeout(() => setPasteNotification(null), 3500)
      }
    }

    document.addEventListener('paste', handleDocumentPaste)
    return () => {
      document.removeEventListener('paste', handleDocumentPaste)
    }
  }, [selectedDate])

  useEffect(() => {
    if (existingImages.length === 0 && imagePreviews.length === 0) {
      setHoveredImage(null)
      setLightboxImage(null)
    }
  }, [existingImages, imagePreviews])

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (newFiles.length === 0) return

    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setImages(prev => [...prev, ...newFiles])
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      const target = prev[index]
      if (target) {
        URL.revokeObjectURL(target)
        setHoveredImage(current => (current === target ? null : current))
        setLightboxImage(current => (current === target ? null : current))
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeExistingImage = async (imageId: string, imageUrl: string) => {
    try {
      const response = await fetch(`/api/entries/${imageId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to remove image')

      setHoveredImage(current => (current === imageUrl ? null : current))
      setLightboxImage(current => (current === imageUrl ? null : current))
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error removing image:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-[#d4fc64]', 'bg-[#d4fc64]/10')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-[#d4fc64]', 'bg-[#d4fc64]/10')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-[#d4fc64]', 'bg-[#d4fc64]/10')
    }

    const files = e.dataTransfer.files
    handleImageSelect(files)
  }

  const uploadImage = async (file: File, workUpdateId: string): Promise<string> => {
    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    const response = await fetch(`/api/entries/${workUpdateId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    })
    if (!response.ok) throw new Error('Failed to save image')
    const image = await response.json()
    return image.image_url
  }

  const handleSave = async () => {
    if (!selectedDate) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          description: description.trim(),
          is_leave: isLeave,
          sick_leave: sickLeave,
          casual_leave: casualLeave,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server responded with status ${response.status}`)
      }

      const savedUpdate = await response.json()
      for (const image of images) {
        await uploadImage(image, savedUpdate.id)
      }

      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      setImages([])
      setImagePreviews([])
      setSaveSuccess('Entry saved successfully.')
      setTimeout(() => setSaveSuccess(null), 4000)
      onUpdate()
    } catch (error: unknown) {
      console.error('Error saving work update:', error)
      const message = error instanceof Error ? error.message : 'Failed to save work update.'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  // Combined screenshots for WhatsApp & AI
  const allScreenshots = useMemo(() => {
    return [
      ...existingImages.map(img => ({ id: img.id, url: img.image_url })),
      ...images.map((file, idx) => ({ id: `new-${idx}`, url: imagePreviews[idx], file })),
    ]
  }, [existingImages, images, imagePreviews])

  // AI Enhancement Runner
  const handleEnhance = async (customInstruction?: string) => {
    if (!selectedDate) return

    setIsAiEnhanceOpen(true)
    setIsAiLoading(true)
    setAiError(null)

    try {
      const config = getStoredAiConfig()

      // Collect all image sources
      const rawImageSources: Array<File | string> = [
        ...images,
        ...existingImages.map(img => img.image_url),
      ]

      // Downscale/compress images for fast multimodal transmission
      const optimizedImages: string[] = []
      for (const src of rawImageSources) {
        const optimized = await optimizeImageForAi(src)
        if (optimized) optimizedImages.push(optimized)
      }

      let contentToSend = description.trim()
      if (customInstruction?.trim()) {
        contentToSend = contentToSend
          ? `${contentToSend}\n\n[User Instruction: ${customInstruction.trim()}]`
          : `[User Instruction: ${customInstruction.trim()}]`
      }

      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToSend,
          images: optimizedImages,
          systemPrompt: config.systemPrompt,
          model: config.model,
          apiKey: config.apiKey,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance work report')
      }

      setEnhancedReport(data.enhancedContent)
      setModelUsed(data.model || config.model)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI enhancement request failed'
      setAiError(message)
    } finally {
      setIsAiLoading(false)
    }
  }

  if (!selectedDate) {
    return (
      <div className="h-full min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-[#111111] text-[#a3a3a3]">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-[#242424] bg-[#161616] flex items-center justify-center mb-4 text-[#d4fc64]">
          <span className="text-xl">📅</span>
        </div>
        <h3 className="text-base sm:text-lg font-medium text-white mb-2">No Date Selected</h3>
        <p className="text-xs text-[#737373] max-w-xs mx-auto leading-relaxed font-mono">
          Select a date on the calendar to log daily tasks, attach screenshots, or record time away.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative p-4 sm:p-6 bg-[#111111] overflow-hidden text-[#ededed]">
      {pasteNotification && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-[#d4fc64] text-black px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-mono font-medium z-50 shadow-[0_0_15px_rgba(212,252,100,0.3)] animate-pulse">
          ✓ {pasteNotification}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 pb-4 border-b border-[#1f1f1f]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#d4fc64] shadow-[0_0_8px_#d4fc64]" />
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-[#737373]">
              Daily Workspace Log
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>

        {/* Mode Selector Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsLeave(false)
              setSickLeave(false)
              setCasualLeave(false)
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-mono transition-all duration-200 border ${
              !isLeave && !sickLeave && !casualLeave
                ? 'bg-[#d4fc64]/10 border-[#d4fc64] text-[#d4fc64] font-medium'
                : 'border-[#262626] text-[#737373] hover:text-white hover:border-[#383838]'
            }`}
          >
            ● Active
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !isLeave
              setIsLeave(next)
              if (next) {
                setSickLeave(false)
                setCasualLeave(false)
                setDescription('')
              }
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-mono transition-all duration-200 border ${
              isLeave
                ? 'bg-[#cb5f5f]/15 border-[#cb5f5f] text-[#cb5f5f] font-medium'
                : 'border-[#262626] text-[#737373] hover:text-white hover:border-[#383838]'
            }`}
          >
            Leave
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !sickLeave
              setSickLeave(next)
              if (next) {
                setIsLeave(false)
                setCasualLeave(false)
                setDescription('')
              }
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-mono transition-all duration-200 border ${
              sickLeave
                ? 'bg-[#ffea71]/15 border-[#ffea71] text-[#ffea71] font-medium'
                : 'border-[#262626] text-[#737373] hover:text-white hover:border-[#383838]'
            }`}
          >
            Sick
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !casualLeave
              setCasualLeave(next)
              if (next) {
                setIsLeave(false)
                setSickLeave(false)
                setDescription('')
              }
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-mono transition-all duration-200 border ${
              casualLeave
                ? 'bg-[#8cab87]/15 border-[#8cab87] text-[#8cab87] font-medium'
                : 'border-[#262626] text-[#737373] hover:text-white hover:border-[#383838]'
            }`}
          >
            Casual
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {saveError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-300 flex items-center justify-between">
            <span>✕ {saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-white ml-2">
              ✕
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-[#d4fc64]/10 border border-[#d4fc64]/40 text-xs font-mono text-[#d4fc64] flex items-center justify-between shadow-[0_0_15px_rgba(212,252,100,0.15)]">
            <span>✓ {saveSuccess}</span>
            <button onClick={() => setSaveSuccess(null)} className="text-[#d4fc64] hover:text-white ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Description Section with AI and WhatsApp Controls */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#737373] mb-2">
            <div className="flex items-center gap-2">
              <span>Work Description & Highlights</span>
              <span className="text-[#444]">·</span>
              <span>{description.length} chars</span>
            </div>

            {/* Smart Action Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleEnhance()}
                disabled={isLeave || sickLeave || casualLeave || (!description.trim() && allScreenshots.length === 0)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d4fc64]/50 bg-[#d4fc64]/10 hover:bg-[#d4fc64]/20 text-[#d4fc64] text-xs font-mono font-medium transition-all shadow-[0_0_12px_rgba(212,252,100,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Enhance notes and screenshots into a structured work report via OpenRouter AI"
              >
                <span>✨</span>
                <span>Enhance with AI</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAiSettingsOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#262626] bg-[#141414] hover:bg-[#202020] text-[#a3a3a3] hover:text-[#ededed] text-xs font-mono transition-all"
                title="Configure custom system prompt, model & OpenRouter API key"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">AI Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                disabled={!description.trim() && allScreenshots.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-mono font-medium transition-all shadow-[0_0_12px_rgba(37,211,102,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Send report with attached screenshots to multiple contacts on WhatsApp"
              >
                <span>📲</span>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isLeave || sickLeave || casualLeave}
            placeholder={
              isLeave || sickLeave || casualLeave
                ? 'Marked as away on this date.'
                : 'Paste screenshots or type key tasks completed, features shipped, meetings, PRs, or blockers...'
            }
            rows={7}
            className="w-full bg-[#0a0a0a] text-[#ededed] font-mono text-sm p-4 rounded-xl border border-[#242424] focus:border-[#d4fc64] focus:ring-1 focus:ring-[#d4fc64] focus:outline-none resize-none placeholder-[#444] leading-relaxed transition-all disabled:opacity-50"
            spellCheck={false}
          />
        </div>

        {/* Upload Zone */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-2">
            <label className="block">Evidence & Screenshots</label>
            <span>{allScreenshots.length} attached</span>
          </div>

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-[#282828] hover:border-[#d4fc64]/70 bg-[#0a0a0a]/60 hover:bg-[#141414] rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={e => handleImageSelect(e.target.files)}
              className="hidden"
            />
            <div className="text-sm font-medium text-[#ededed] mb-1">
              Click to upload or drag & drop screenshots
            </div>
            <p className="text-xs font-mono text-[#737373]">
              Supports PNG, JPG, WebP · Press <strong className="text-white">Ctrl+V</strong> anywhere to paste screenshots
            </p>
          </div>
        </div>

        {/* Image Grid */}
        {(imagePreviews.length > 0 || existingImages.length > 0) && (
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 flex-1">
              {existingImages.map(image => (
                <div
                  key={image.id}
                  className="relative aspect-video rounded-xl overflow-hidden border border-[#242424] bg-black cursor-zoom-in group"
                  onMouseEnter={() => setHoveredImage(image.image_url)}
                  onMouseLeave={() => setHoveredImage(prev => (prev === image.image_url ? null : prev))}
                  onClick={e => {
                    e.stopPropagation()
                    setLightboxImage(image.image_url)
                  }}
                >
                  <img
                    src={image.image_url}
                    alt="Saved screenshot"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-200 group-hover:scale-105"
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      removeExistingImage(image.id, image.image_url)
                    }}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-[#cb5f5f] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    title="Delete image"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-1.5 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#a3a3a3]">
                    SAVED
                  </div>
                </div>
              ))}

              {imagePreviews.map((preview, index) => (
                <div
                  key={`new-${index}`}
                  className="relative aspect-video rounded-xl overflow-hidden border border-[#d4fc64]/40 bg-black cursor-zoom-in group"
                  onMouseEnter={() => setHoveredImage(preview)}
                  onMouseLeave={() => setHoveredImage(prev => (prev === preview ? null : prev))}
                  onClick={e => {
                    e.stopPropagation()
                    setLightboxImage(preview)
                  }}
                >
                  <img
                    src={preview}
                    alt="New preview"
                    className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      removeImage(index)
                    }}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-[#cb5f5f] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    title="Remove image"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-1.5 left-2 bg-[#d4fc64] text-black font-semibold px-1.5 py-0.5 rounded text-[9px] font-mono">
                    NEW
                  </div>
                </div>
              ))}
            </div>

            {hoveredImage && (
              <div className="hidden md:flex flex-col items-center justify-center w-72 rounded-xl border border-[#242424] bg-[#0c0c0c] p-3">
                <div className="text-[10px] font-mono text-[#737373] uppercase tracking-wider mb-2">
                  Preview
                </div>
                <div className="w-full h-44 rounded-lg bg-black flex items-center justify-center overflow-hidden">
                  <img src={hoveredImage} alt="Zoom preview" className="object-contain w-full h-full" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Commit Button & WhatsApp Send */}
      <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <p className="text-xs text-[#737373] font-mono hidden sm:block">
          {currentWorkUpdate ? 'Saved record exists for this date.' : 'No record committed yet.'}
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsWhatsAppOpen(true)}
            disabled={!description.trim() && allScreenshots.length === 0}
            className="flex-1 sm:flex-none border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-medium px-4 py-2.5 rounded-full transition-all text-xs font-mono flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(37,211,102,0.15)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>📲</span>
            <span>Send WhatsApp</span>
          </button>

          <button
            onClick={handleSave}
            disabled={
              isSaving ||
              (!isLeave &&
                !sickLeave &&
                !casualLeave &&
                !description.trim() &&
                images.length === 0 &&
                existingImages.length === 0)
            }
            className="flex-1 sm:flex-none bg-[#d4fc64] text-black font-semibold px-6 py-2.5 rounded-full hover:bg-[#c8f9b6] transition-all duration-200 text-xs font-mono shadow-[0_0_20px_rgba(212,252,100,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span className="font-mono text-xs animate-pulse">Syncing to cloud...</span>
            ) : (
              <span>{currentWorkUpdate ? 'Save Changes' : 'Record Entry'} →</span>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox Dialog */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative w-[95vw] sm:w-[85vw] h-[80vh] sm:h-[85vh] max-w-6xl rounded-2xl border border-[#242424] bg-[#0a0a0a] p-3 sm:p-4 overflow-hidden flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-[#161616] hover:bg-[#262626] text-white w-9 h-9 rounded-full flex items-center justify-center border border-[#333] transition-colors"
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Expanded preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />

      {/* AI Enhancement Review Modal */}
      <AiEnhanceModal
        isOpen={isAiEnhanceOpen}
        isLoading={isAiLoading}
        error={aiError}
        originalContent={description}
        enhancedContent={enhancedReport}
        modelUsed={modelUsed}
        imageCount={allScreenshots.length}
        onClose={() => setIsAiEnhanceOpen(false)}
        onApply={content => setDescription(content)}
        onAppend={content => setDescription(prev => (prev.trim() ? `${prev.trim()}\n\n${content}` : content))}
        onRegenerate={instruction => handleEnhance(instruction)}
        onOpenSettings={() => setIsAiSettingsOpen(true)}
        onOpenWhatsApp={content => {
          setDescription(content)
          setIsAiEnhanceOpen(false)
          setIsWhatsAppOpen(true)
        }}
      />

      {/* WhatsApp Dispatch Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        selectedDate={selectedDate}
        currentDescription={description}
        userName={userName}
        screenshots={allScreenshots}
      />
    </div>
  )
}
