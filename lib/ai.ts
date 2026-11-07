export interface AiConfig {
  apiKey: string
  model: string
  systemPrompt: string
  temperature: number
}

export const DEFAULT_MODELS = [
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash (Recommended)',
    description: 'Ultra-fast multimodal vision & reasoning at near-zero cost.',
    supportsVision: true,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Latest Google Flash model with advanced reasoning.',
    supportsVision: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'High-speed OpenAI multimodal vision and structured reporting.',
    supportsVision: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Top-tier technical writing, architecture analysis, and code synthesis.',
    supportsVision: true,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    description: 'Exceptional open-weights reasoning for development notes.',
    supportsVision: false,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Powerful open-source model for detailed task summarization.',
    supportsVision: false,
  },
]

export const DEFAULT_SYSTEM_PROMPT = `You are an elite executive technical assistant and work report specialist.
Your objective is to transform raw daily developer/employee notes and screenshot evidence into a polished, structured, and professional Daily Work Report.

Guidelines:
1. Carefully analyze any screenshots provided (terminal outputs, code diffs, GitHub PRs, design mockups, tickets, bug reports) to extract technical specifics, feature names, bug IDs, and metrics.
2. Structure the report clearly:
   🎯 Summary & Key Highlights: 1-2 sentence executive overview of what was accomplished.
   🚀 Completed Tasks & Shipped Work: Action-oriented bullet points specifying what was built, fixed, or delivered.
   🛠 Technical Details & Proof: Specific components, files, APIs, test results, or screenshot evidence.
   🚧 In Progress & Next Priorities: Current focus and immediate roadmap for tomorrow.
   ⚠️ Blockers / Dependencies: Any roadblocks, or "None" if all clear.
3. Keep the tone concise, authoritative, and impact-driven. Remove casual filler or typos.
4. Output cleanly in markdown format, ready for management review or client updates.`

export const PROMPT_PRESETS: Record<string, { name: string; prompt: string }> = {
  standard: {
    name: 'Executive Technical (Recommended)',
    prompt: DEFAULT_SYSTEM_PROMPT,
  },
  concise: {
    name: 'Concise Bullet Points',
    prompt: `You are a concise work log summarizer.
Take the user's notes and screenshot evidence and produce a tight, bulleted work report.
Rules:
- Max 5-7 punchy bullet points.
- Use bold action verbs (Shipped, Resolved, Implemented, Refactored).
- Include technical names and screenshot findings.
- No conversational filler. Just high-impact bullets.`,
  },
  whatsapp: {
    name: 'WhatsApp / Chat Friendly',
    prompt: `You are a professional assistant preparing a daily work update formatted specifically for WhatsApp and Slack.
Rules:
- Use emojis at the start of sections (🚀, 🎯, 🛠, 📌, ⚠️).
- Use WhatsApp markdown (*bold* for emphasis).
- Keep paragraphs short and scannable on mobile screens.
- Synthesize all text notes and attached screenshots into a clean, impressive update ready to send to team leads or clients.`,
  },
  client: {
    name: 'Client-Facing Progress',
    prompt: `You are a client relationship and project delivery specialist.
Transform the technical notes and screenshots into a polite, clear, and business-friendly progress update for stakeholders and clients.
Highlight business value, completed deliverables, upcoming milestones, and assurance of quality.`,
  },
}

const STORAGE_KEY = 'worktrace_ai_config_v1'

export function getStoredAiConfig(): AiConfig {
  if (typeof window === 'undefined') {
    return {
      apiKey: '',
      model: 'google/gemini-2.0-flash-001',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.7,
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        apiKey: parsed.apiKey || '',
        model: parsed.model || 'google/gemini-2.0-flash-001',
        systemPrompt: parsed.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.7,
      }
    }
  } catch (err) {
    console.error('Failed to parse AI config from localStorage:', err)
  }

  return {
    apiKey: '',
    model: 'google/gemini-2.0-flash-001',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
  }
}

export function saveStoredAiConfig(config: Partial<AiConfig>): AiConfig {
  const current = getStoredAiConfig()
  const updated: AiConfig = {
    apiKey: config.apiKey !== undefined ? config.apiKey.trim() : current.apiKey,
    model: config.model !== undefined ? config.model.trim() : current.model,
    systemPrompt: config.systemPrompt !== undefined ? config.systemPrompt : current.systemPrompt,
    temperature: typeof config.temperature === 'number' ? config.temperature : current.temperature,
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to save AI config to localStorage:', err)
    }
  }

  return updated
}

/**
 * Downscale and compress an image (File or Data URL) to make it lightweight
 * and fast for OpenRouter multimodal APIs (avoids large base64 payload timeouts).
 */
export async function optimizeImageForAi(
  source: File | string,
  maxDimension = 1400,
  quality = 0.82
): Promise<string> {
  if (typeof window === 'undefined') return ''

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      let width = img.naturalWidth || img.width
      let height = img.naturalHeight || img.height

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(typeof source === 'string' ? source : '')
        return
      }

      // Draw white background in case of transparent PNG for JPEG compression
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      try {
        const optimized = canvas.toDataURL('image/jpeg', quality)
        resolve(optimized)
      } catch {
        resolve(typeof source === 'string' ? source : '')
      }
    }

    img.onerror = () => {
      resolve(typeof source === 'string' ? source : '')
    }

    if (typeof source === 'string') {
      img.src = source
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        img.src = String(reader.result)
      }
      reader.onerror = () => resolve('')
      reader.readAsDataURL(source)
    }
  })
}
