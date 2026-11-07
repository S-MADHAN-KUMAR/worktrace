import { NextRequest, NextResponse } from 'next/server'
import { getSql, initializeDatabase, hashPassword, persistDbUrlToEnv } from '@/lib/neon'
import { createSessionCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dbUrl = String(body.dbUrl || process.env.DATABASE_URL || '').trim()

    if (!dbUrl) {
      return NextResponse.json(
        { error: 'Neon Database URL is required. Please provide your connection string.' },
        { status: 400 }
      )
    }

    // Direct DB connection verification endpoint
    if (body.action === 'verify_db') {
      await initializeDatabase(dbUrl)
      persistDbUrlToEnv(dbUrl)
      const sql = getSql(dbUrl)
      const userCount = await sql`SELECT COUNT(*)::int as count FROM users`
      return NextResponse.json({
        ok: true,
        userCount: userCount[0]?.count || 0,
        message: 'Neon database connected and schema initialized successfully.',
      })
    }

    const name = String(body.name || '').trim()
    const password = String(body.password || '')

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and Password are required.' }, { status: 400 })
    }

    // Connect to private Neon DB
    await initializeDatabase(dbUrl)
    const sql = getSql(dbUrl)

    // Lookup user in private DB
    const users = await sql`
      SELECT * FROM users 
      WHERE LOWER(COALESCE(name, '')) = LOWER(${name})
         OR LOWER(COALESCE(display_name, '')) = LOWER(${name})
         OR LOWER(COALESCE(email, '')) = LOWER(${name})
      LIMIT 1
    `

    if (!users || users.length === 0) {
      const allUsers = await sql`SELECT COUNT(*)::int as count FROM users`
      const total = allUsers[0]?.count || 0
      if (total === 0) {
        return NextResponse.json(
          {
            error: 'No accounts found in this database yet. Please click "Create Account" below to register.',
            requiresRegistration: true,
          },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: 'Invalid name or password.' }, { status: 401 })
    }

    const user = users[0]
    const suppliedHash = hashPassword(password)

    if (user.password_hash !== suppliedHash) {
      return NextResponse.json({ error: 'Invalid name or password.' }, { status: 401 })
    }

    // Persist active DB URL
    persistDbUrlToEnv(dbUrl)

    const finalName = user.name || user.display_name || user.email || name
    const response = NextResponse.json({ authenticated: true, user: finalName })
    createSessionCookie(response, { user: finalName, dbUrl })
    return response
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to connect to Neon database. Please verify your connection string.' },
      { status: 500 }
    )
  }
}
