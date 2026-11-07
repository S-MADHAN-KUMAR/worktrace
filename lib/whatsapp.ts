export interface WhatsAppRecipient {
  id: string
  name: string
  phone: string
  selected?: boolean
}

const CONTACTS_STORAGE_KEY = 'worktrace_whatsapp_recipients_v1'

export const DEFAULT_SAMPLE_CONTACTS: WhatsAppRecipient[] = [
  { id: '1', name: 'Project Lead', phone: '+91 98765 43210', selected: true },
]

export function cleanPhoneNumber(phone: string): string {
  // Strip everything except digits
  let cleaned = phone.replace(/[^0-9]/g, '')
  // If it starts with 0, remove the leading 0 (common local format)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  return cleaned
}

export function formatDisplayPhone(phone: string): string {
  const cleaned = cleanPhoneNumber(phone)
  if (!cleaned) return phone
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `+${cleaned}`
  }
  return `+${cleaned}`
}

export function getSavedRecipients(): WhatsAppRecipient[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed to load WhatsApp recipients:', err)
  }

  return []
}

export function saveRecipients(recipients: WhatsAppRecipient[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(recipients))
  } catch (err) {
    console.error('Failed to save WhatsApp recipients:', err)
  }
}

/**
 * Format markdown/text for WhatsApp readability:
 * - Bold headings (*Heading*)
 * - Clean bullet points (•)
 * - Appends header with Date & Author
 */
export function formatReportForWhatsApp(params: {
  dateStr: string
  content: string
  userName?: string
}): string {
  const { dateStr, content, userName } = params

  let formatted = content.trim()

  // Replace markdown headers (### Header -> *Header*)
  formatted = formatted.replace(/^#{1,6}\s*(.+)$/gm, '*$1*')

  // Clean markdown bullets (- item or * item -> • item)
  formatted = formatted.replace(/^\s*[-*]\s+/gm, '• ')

  // Preserve bold formatting (**text** -> *text*)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*')

  const header = [
    `📊 *DAILY WORK REPORT*`,
    `📅 *Date:* ${dateStr}`,
    userName ? `👤 *Reported by:* ${userName}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
  ]
    .filter(Boolean)
    .join('\n')

  const footer = `\n━━━━━━━━━━━━━━━━━━━━\n_Sent via Worktrace_`

  return `${header}\n\n${formatted}\n${footer}`
}

export function buildWhatsAppWebUrl(phone: string, text: string): string {
  const cleaned = cleanPhoneNumber(phone)
  return `https://web.whatsapp.com/send?phone=${encodeURIComponent(cleaned)}&text=${encodeURIComponent(text)}`
}

export function buildWhatsAppAppUrl(phone: string, text: string): string {
  const cleaned = cleanPhoneNumber(phone)
  return `whatsapp://send?phone=${encodeURIComponent(cleaned)}&text=${encodeURIComponent(text)}`
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Copy an image to the system clipboard as image/png so the user
 * can immediately press Ctrl+V in WhatsApp Web / Desktop to attach it.
 */
export async function copyImageToClipboard(imageUrl: string | Blob): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard?.write) {
    return false
  }

  try {
    let srcUrl = ''
    if (typeof imageUrl === 'string') {
      srcUrl = imageUrl
    } else {
      srcUrl = URL.createObjectURL(imageUrl)
    }

    // Windows / Chromium strictly requires image/png format for ClipboardItem
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas context unavailable'))
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('Failed to create png blob'))
        }, 'image/png')
      }
      img.onerror = () => reject(new Error('Failed to load image for clipboard'))
      img.src = srcUrl
    })

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob }),
    ])
    return true
  } catch (err) {
    console.warn('Clipboard write image failed:', err)
    return false
  }
}

/**
 * Trigger native OS share sheet (works on mobile and Windows 10/11 Edge/Chrome)
 * which can attach actual file blobs directly to WhatsApp!
 */
export async function shareViaNativeSheet(options: {
  title: string
  text: string
  files?: File[]
}): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.share) {
    return false
  }

  try {
    const data: ShareData = {
      title: options.title,
      text: options.text,
    }

    if (options.files && options.files.length > 0 && navigator.canShare) {
      if (navigator.canShare({ files: options.files })) {
        data.files = options.files
      }
    }

    await navigator.share(data)
    return true
  } catch (err: unknown) {
    // User cancelled share dialog or unsupported
    if (err instanceof Error && err.name !== 'AbortError') {
      console.warn('Native share failed:', err)
    }
    return false
  }
}
