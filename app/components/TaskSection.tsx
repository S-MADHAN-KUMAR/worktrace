'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

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
}

export default function TaskSection({ selectedDate, workUpdates, onUpdate }: TaskSectionProps) {
  const [description, setDescription] = useState('')
  const [isLeave, setIsLeave] = useState(false)
  const [sickLeave, setSickLeave] = useState(false)
  const [casualLeave, setCasualLeave] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<WorkUpdateImage[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [pasteNotification, setPasteNotification] = useState<string | null>(null)
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const currentWorkUpdate = selectedDate
    ? workUpdates.find(update => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const updateDateStr = update.date.split('T')[0]
      return updateDateStr === dateStr
    })
    : null

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
  }, [selectedDate, currentWorkUpdate?.id])

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
        setPasteNotification(`${files.length} IMG_BUFFERED`)
        setTimeout(() => setPasteNotification(null), 3000)
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

  const loadExistingImages = async (workUpdateId: string) => {
    try {
      const { data, error } = await supabase
        .from('work_update_images')
        .select('*')
        .eq('work_update_id', workUpdateId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingImages(data || [])
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }

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
        setHoveredImage(current => current === target ? null : current)
        setLightboxImage(current => current === target ? null : current)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeExistingImage = async (imageId: string, imageUrl: string) => {
    try {
      const urlObj = new URL(imageUrl)
      const pathParts = urlObj.pathname.split('/')
      const workUpdatesIndex = pathParts.findIndex(part => part === 'work-updates')

      if (workUpdatesIndex === -1 || workUpdatesIndex === pathParts.length - 1) {
        throw new Error('Invalid image URL format')
      }

      const filePath = pathParts.slice(workUpdatesIndex + 1).join('/')

      const { error: storageError } = await supabase.storage
        .from('work-updates')
        .remove([filePath])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('work_update_images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      setHoveredImage(current => current === imageUrl ? null : current)
      setLightboxImage(current => current === imageUrl ? null : current)
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error removing image:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-[#CCFF00]', 'bg-[#CCFF00]/10')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-[#CCFF00]', 'bg-[#CCFF00]/10')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-[#CCFF00]', 'bg-[#CCFF00]/10')
    }

    const files = e.dataTransfer.files
    handleImageSelect(files)
  }

  const uploadImage = async (file: File, workUpdateId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${selectedDate?.toISOString().split('T')[0]}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('work-updates')
      .upload(filePath, file, { upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('work-updates')
      .getPublicUrl(filePath)

    const { error: dbError } = await supabase
      .from('work_update_images')
      .insert({
        work_update_id: workUpdateId,
        image_url: publicUrl
      })

    if (dbError) throw dbError

    return publicUrl
  }

  const handleSave = async () => {
    if (!selectedDate) return

    setIsSaving(true)

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      if (currentWorkUpdate) {
        const updateData: { description: string; is_leave: boolean; sick_leave: boolean; casual_leave: boolean; updated_at?: string } = {
          description: (isLeave || sickLeave || casualLeave) ? '' : (description.trim() || ''),
          is_leave: isLeave,
          sick_leave: sickLeave,
          casual_leave: casualLeave
        }

        const { error: updateError } = await supabase
          .from('work_updates')
          .update(updateData)
          .eq('id', currentWorkUpdate.id)

        if (updateError) {
          throw new Error(updateError.message || 'Failed to update work update')
        }

        if (images.length > 0) {
          for (const image of images) {
            await uploadImage(image, currentWorkUpdate.id)
          }
        }
      } else {
        const insertData: { date: string; description: string; is_leave: boolean; sick_leave: boolean; casual_leave: boolean } = {
          date: dateStr,
          description: (isLeave || sickLeave || casualLeave) ? '' : (description.trim() || ''),
          is_leave: isLeave,
          sick_leave: sickLeave,
          casual_leave: casualLeave
        }

        const { data: newWorkUpdate, error: insertError } = await supabase
          .from('work_updates')
          .insert(insertData)
          .select()
          .single()

        if (insertError) {
          throw new Error(insertError.message || 'Failed to create work update')
        }

        if (images.length > 0 && newWorkUpdate) {
          for (const image of images) {
            await uploadImage(image, newWorkUpdate.id)
          }
        }
      }

      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      setImages([])
      setImagePreviews([])
      onUpdate()
    } catch (error: any) {
      console.error('Error saving work update:', error)
      alert(error?.message || 'Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedDate) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#050505] border border-[#1F1F1F]">
        <div className="w-16 h-16 border border-[#333] flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-grid opacity-20"></div>
          <span className="text-[#333] font-mono text-2xl">X</span>
        </div>
        <h3 className="text-xl font-bold font-tech text-white mb-2 uppercase tracking-widest">Target_Date_Required</h3>
        <p className="text-gray-500 font-mono text-xs max-w-xs mx-auto">
          &lt; ERROR: No_Selection &gt; Initialize protocol by selecting a temporal node from the chronological grid.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative p-6 bg-[#050505] relative overflow-hidden group/container">
      {/* Decorative BG */}
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      {pasteNotification && (
        <div className="absolute top-4 right-4 bg-[#CCFF00] text-black px-4 py-2 text-xs font-mono font-bold z-50 animate-pulse border border-black">
          &gt; {pasteNotification}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1F1F1F]">
        <div>
          <h2 className="text-2xl font-black font-tech text-white uppercase tracking-tighter">
            {format(selectedDate, 'EEEE, MMM d')}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-pulse"></span>
            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">
              Entry_Mode: {isLeave ? 'LEAVE' : sickLeave ? 'SICK_LEAVE' : casualLeave ? 'CASUAL_LEAVE' : 'ACTIVE_LOG'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className={`
             relative cursor-pointer flex items-center gap-2 px-3 py-2 border transition-all duration-300
             ${isLeave ? 'border-red-500 bg-red-500/10' : 'border-[#333] hover:border-red-500'}
          `}>
            <input
              type="checkbox"
              checked={isLeave}
              onChange={(e) => {
                const checked = e.target.checked
                setIsLeave(checked)
                if (checked) {
                  setSickLeave(false)
                  setCasualLeave(false)
                  setDescription('')
                }
              }}
              className="hidden"
            />
            <div className={`w-3 h-3 border ${isLeave ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}></div>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLeave ? 'text-red-500' : 'text-gray-400'}`}>
              Leave
            </span>
          </label>

          <label className={`
             relative cursor-pointer flex items-center gap-2 px-3 py-2 border transition-all duration-300
             ${sickLeave ? 'border-orange-500 bg-orange-500/10' : 'border-[#333] hover:border-orange-500'}
          `}>
            <input
              type="checkbox"
              checked={sickLeave}
              onChange={(e) => {
                const checked = e.target.checked
                setSickLeave(checked)
                if (checked) {
                  setIsLeave(false)
                  setCasualLeave(false)
                  setDescription('')
                }
              }}
              className="hidden"
            />
            <div className={`w-3 h-3 border ${sickLeave ? 'bg-orange-500 border-orange-500' : 'border-gray-500'}`}></div>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${sickLeave ? 'text-orange-500' : 'text-gray-400'}`}>
              Sick
            </span>
          </label>

          <label className={`
             relative cursor-pointer flex items-center gap-2 px-3 py-2 border transition-all duration-300
             ${casualLeave ? 'border-purple-500 bg-purple-500/10' : 'border-[#333] hover:border-purple-500'}
          `}>
            <input
              type="checkbox"
              checked={casualLeave}
              onChange={(e) => {
                const checked = e.target.checked
                setCasualLeave(checked)
                if (checked) {
                  setIsLeave(false)
                  setSickLeave(false)
                  setDescription('')
                }
              }}
              className="hidden"
            />
            <div className={`w-3 h-3 border ${casualLeave ? 'bg-purple-500 border-purple-500' : 'border-gray-500'}`}></div>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${casualLeave ? 'text-purple-500' : 'text-gray-400'}`}>
              Casual
            </span>
          </label>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        <div className="relative">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-2 flex justify-between">
            <span>&gt; Input_Log_Stream</span>
            <span className="text-[#CCFF00] opacity-50">{description.length} CHARS</span>
          </label>
          <div className="relative group">
            {/* Corner Brackets */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#333] group-hover:border-[#CCFF00] transition-colors"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-[#333] group-hover:border-[#CCFF00] transition-colors"></div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLeave || sickLeave || casualLeave}
              placeholder={isLeave || sickLeave || casualLeave ? ">>> HARDWARE_STATUS: STANDBY_MODE..." : ">>> IDENTITY: ENG_USER\n>>> ACTION: LOG_WORK..."}
              rows={8}
              className="w-full bg-[#080808] text-[#CCFF00] font-mono text-sm p-4 border border-[#1F1F1F] focus:border-[#CCFF00] focus:outline-none resize-none placeholder-gray-800 leading-relaxed selection:bg-[#CCFF00] selection:text-black"
              spellCheck={false}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-2">
            &gt; Visual_Assets_Buffer
          </label>
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group relative border border-dashed border-[#333] p-8 text-center cursor-pointer hover:bg-[#111] hover:border-[#CCFF00] transition-all duration-300"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageSelect(e.target.files)}
              className="hidden"
            />
            <div className="text-gray-600 mb-2 group-hover:text-[#CCFF00] transition-colors">
              [ UPLOAD_ZONE ]
            </div>
            <p className="text-[10px] font-mono text-gray-700 group-hover:text-gray-500">
              DRAG_DROP // CLIPBOARD_PASTE_SUPPORTED
            </p>
          </div>
        </div>

        {(imagePreviews.length > 0 || existingImages.length > 0) && (
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {existingImages.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square group overflow-hidden border border-[#333] cursor-zoom-in"
                  onMouseEnter={() => setHoveredImage(image.image_url)}
                  onMouseLeave={() => setHoveredImage(prev => prev === image.image_url ? null : prev)}
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(image.image_url); }}
                >
                  <img
                    src={image.image_url}
                    alt="Existing"
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeExistingImage(image.id, image.image_url); }}
                    className="absolute top-1 right-1 bg-black text-red-500 text-xs w-5 h-5 flex items-center justify-center hover:bg-red-500 hover:text-black"
                  >
                    X
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black px-1 text-[8px] font-mono text-[#CCFF00]">SERVER</div>
                </div>
              ))}
              {imagePreviews.map((preview, index) => (
                <div
                  key={`new-${index}`}
                  className="relative aspect-square group overflow-hidden border border-[#CCFF00]/50 cursor-zoom-in"
                  onMouseEnter={() => setHoveredImage(preview)}
                  onMouseLeave={() => setHoveredImage(prev => prev === preview ? null : prev)}
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(preview); }}
                >
                  <img
                    src={preview}
                    alt="New preview"
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    className="absolute top-1 right-1 bg-black text-red-500 text-xs w-5 h-5 flex items-center justify-center hover:bg-red-500 hover:text-black"
                  >
                    X
                  </button>
                  <div className="absolute bottom-1 left-1 bg-[#CCFF00] text-black px-1 text-[8px] font-mono font-bold">BUFFER</div>
                </div>
              ))}
            </div>

            <div className="hidden md:flex flex-col items-center justify-center min-w-[18rem] max-w-sm border border-[#1F1F1F] bg-[#0F0F0F]/70 p-4">
              {hoveredImage ? (
                <>
                  <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">Zoom_Preview</div>
                  <div className="w-full h-[16rem] border border-[#1F1F1F] bg-black/40 flex items-center justify-center overflow-hidden">
                    <img src={hoveredImage} alt="Zoom preview" className="object-contain w-full h-full" />
                  </div>
                </>
              ) : (
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest text-center">
                  Hover image tile for zoomed view
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-[#1F1F1F]">
        <button
          onClick={handleSave}
          disabled={isSaving || (!isLeave && !sickLeave && !casualLeave && !description.trim() && images.length === 0 && existingImages.length === 0)}
          className="btn-cyber-filled w-full flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isSaving ? (
            <span className="font-mono animate-pulse">PROCESSING_DATA...</span>
          ) : (
            <>
              <span className="font-mono text-xs">{currentWorkUpdate ? '>> UPDATE_LOG' : '>> EXECUTE_COMMIT'}</span>
              <div className="w-2 h-2 bg-black group-hover:animate-ping"></div>
            </>
          )}
        </button>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative w-[80vw] h-[80vh] max-w-5xl border border-[#1F1F1F] bg-[#050505]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 bg-black text-[#CCFF00] w-8 h-8 flex items-center justify-center border border-[#1F1F1F] hover:bg-[#CCFF00] hover:text-black transition-colors"
            >
              X
            </button>
            <img src={lightboxImage} alt="Expanded preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
