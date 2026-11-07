import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = getSession(request)
  const defaultDbUrl = process.env.DATABASE_URL || ''
  return NextResponse.json({
    authenticated: Boolean(session),
    user: session?.user || null,
    hasConfiguredDb: Boolean(defaultDbUrl),
    dbPreview: defaultDbUrl ? defaultDbUrl.replace(/:[^:@]+@/, ':***@') : null,
  })
}
