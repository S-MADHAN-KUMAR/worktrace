import { NextRequest, NextResponse } from 'next/server'
import { hasValidSession } from '@/lib/session'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/ai'

export async function POST(request: NextRequest) {
  if (!hasValidSession(request)) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const systemPrompt = typeof body.systemPrompt === 'string' && body.systemPrompt.trim()
      ? body.systemPrompt.trim()
      : DEFAULT_SYSTEM_PROMPT
    const model = typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : 'google/gemini-2.0-flash-001'

    const userApiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY || ''

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OpenRouter API key is required. Click "⚙️ AI Prompt Settings" in the header to enter your API key, or set OPENROUTER_API_KEY in your server environment.',
        },
        { status: 400 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Please enter your work notes or bullet points in the description box before clicking Enhance.' },
        { status: 400 }
      )
    }

    // Pure text enhancement - no image payload sent to OpenRouter
    const userMessageContent = `Here are my raw work notes and tasks for today:\n\n${content}\n\nPlease transform these notes into a polished, structured, and professional Daily Work Report.`

    const payload = {
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessageContent,
        },
      ],
      temperature: 0.7,
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://worktrace.app',
        'X-Title': 'Worktrace Workspace Reporting',
      },
      body: JSON.stringify(payload),
    })

    if (!openRouterResponse.ok) {
      const errorJson = await openRouterResponse.json().catch(() => ({}))
      const errorMsg =
        errorJson?.error?.message ||
        errorJson?.message ||
        `OpenRouter responded with HTTP status ${openRouterResponse.status}`

      return NextResponse.json(
        { error: `AI Enhancement Error: ${errorMsg}` },
        { status: openRouterResponse.status >= 400 && openRouterResponse.status < 500 ? openRouterResponse.status : 502 }
      )
    }

    const data = await openRouterResponse.json()
    const enhancedContent = data.choices?.[0]?.message?.content

    if (!enhancedContent) {
      return NextResponse.json(
        { error: 'OpenRouter returned an empty response. Please try again or switch model.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      enhancedContent,
      model: data.model || model,
      usage: data.usage || null,
    })
  } catch (err: unknown) {
    console.error('Enhance API error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
