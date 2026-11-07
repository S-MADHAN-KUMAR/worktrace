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
    description: 'Ultra-fast, accurate technical reasoning at near-zero cost.',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Latest Google Flash model with advanced reasoning.',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'High-speed OpenAI model for structured technical reporting.',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Top-tier technical writing, architecture analysis, and polish.',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    description: 'Exceptional open-weights model for developer notes.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Powerful open-source model for detailed task summarization.',
  },
]

export const DEFAULT_SYSTEM_PROMPT = `You are an elite executive technical assistant and work report specialist.
Your objective is to transform raw daily developer/employee notes into a polished, structured, and professional Daily Work Report.

Guidelines:
1. Structure the report clearly:
   🎯 Summary & Key Highlights: 1-2 sentence executive overview of what was accomplished.
   🚀 Completed Tasks & Shipped Work: Action-oriented bullet points specifying what was built, fixed, or delivered.
   🛠 Technical Details & Proof: Specific components, files, APIs, test results, or tools used.
   🚧 In Progress & Next Priorities: Current focus and immediate roadmap for tomorrow.
   ⚠️ Blockers / Dependencies: Any roadblocks, or "None" if all clear.
2. Keep the tone concise, authoritative, and impact-driven. Remove casual filler or typos.
3. Output cleanly in markdown format, ready for management review or client updates.`

export const PROMPT_PRESETS: Record<string, { name: string; prompt: string }> = {
  standard: {
    name: 'Executive Technical (Recommended)',
    prompt: DEFAULT_SYSTEM_PROMPT,
  },
  concise: {
    name: 'Concise Bullet Points',
    prompt: `You are a concise work log summarizer.
Take the user's raw notes and produce a tight, bulleted work report.
Rules:
- Max 5-7 punchy bullet points.
- Use bold action verbs (Shipped, Resolved, Implemented, Refactored).
- Include technical component names and metrics where provided.
- No conversational filler. Just high-impact bullets.`,
  },
  whatsapp: {
    name: 'WhatsApp / Chat Friendly',
    prompt: `You are a professional assistant preparing a daily work update formatted specifically for WhatsApp and Slack.
Rules:
- Use emojis at the start of sections (🚀, 🎯, 🛠, 📌, ⚠️).
- Use WhatsApp markdown (*bold* for emphasis).
- Keep paragraphs short and scannable on mobile screens.
- Synthesize all text notes into a clean, impressive update ready to send to team leads or clients.`,
  },
  client: {
    name: 'Client-Facing Progress',
    prompt: `You are a client relationship and project delivery specialist.
Transform the technical notes into a polite, clear, and business-friendly progress update for stakeholders and clients.
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
