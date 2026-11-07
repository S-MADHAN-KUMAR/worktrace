import { NextRequest, NextResponse } from 'next/server'
import { getSql, initializeDatabase, hashPassword, persistDbUrlToEnv } from '@/lib/neon'
import { createSessionCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const password = String(body.password || '')
    const dbUrl = String(body.dbUrl || process.env.DATABASE_URL || '').trim()

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid name (at least 2 characters).' }, { status: 400 })
    }

    if (!password || password.length < 3) {
      return NextResponse.json({ error: 'Please enter a password (at least 3 characters).' }, { status: 400 })
    }

    if (!dbUrl) {
      return NextResponse.json({ error: 'Neon Database URL is required. Please paste your connection string.' }, { status: 400 })
    }

    // Initialize schema in the private Neon DB
    await initializeDatabase(dbUrl)
    const sql = getSql(dbUrl)

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users 
      WHERE LOWER(COALESCE(name, '')) = LOWER(${name})
         OR LOWER(COALESCE(display_name, '')) = LOWER(${name})
         OR LOWER(COALESCE(email, '')) = LOWER(${name})
      LIMIT 1
    `
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'An account with this name already exists in this database. Please sign in.' }, { status: 409 })
    }

    // Create user
    const passwordHash = hashPassword(password)
    const emailVal = name.includes('@') ? name : `${name.replace(/\s+/g, '').toLowerCase()}@worktrace.local`
    const rows = await sql`
      INSERT INTO users (name, display_name, email, password_hash)
      VALUES (${name}, ${name}, ${emailVal}, ${passwordHash})
      RETURNING id, COALESCE(name, display_name, ${name}) as name
    `

    // Persist DB url to .env if provided
    persistDbUrlToEnv(dbUrl)

    const response = NextResponse.json({ ok: true, user: rows[0].name || name })
    createSessionCookie(response, { user: rows[0].name || name, dbUrl })
    return response
  } catch (err: any) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to connect to Neon database. Please check your connection string.' },
      { status: 500 }
    )
  }
}
