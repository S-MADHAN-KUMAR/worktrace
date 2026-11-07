import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'worktrace_session'
const DAY = 60 * 60 * 24

export interface SessionData {
  authenticated: boolean
  user: string
  dbUrl?: string
  exp: number
}

function secret() {
  return process.env.SESSION_SECRET || 'development-session-secret-change-me'
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

export function createSessionCookie(
  response: NextResponse,
  data?: { user?: string; dbUrl?: string }
) {
  const payload = Buffer.from(
    JSON.stringify({
      authenticated: true,
      user: data?.user || 'User',
      dbUrl: data?.dbUrl,
      exp: Date.now() + DAY * 1000 * 7,
    })
  ).toString('base64url')

  response.cookies.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DAY * 7,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export function getSession(request: NextRequest): SessionData | null {
  const cookie = request.cookies.get(COOKIE_NAME)?.value
  if (!cookie) return null
  const separator = cookie.lastIndexOf('.')
  if (separator < 0) return null
  const payload = cookie.slice(0, separator)
  const signature = cookie.slice(separator + 1)
  const expected = sign(payload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (data.authenticated === true && typeof data.exp === 'number' && data.exp > Date.now()) {
      return data as SessionData
    }
    return null
  } catch {
    return null
  }
}

export function hasValidSession(request: NextRequest): boolean {
  return getSession(request) !== null
}
