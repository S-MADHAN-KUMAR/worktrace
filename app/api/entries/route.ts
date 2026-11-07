import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getSql } from '@/lib/neon'
import { hasValidSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  if (!hasValidSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await initializeDatabase(request)
    const sql = getSql(request)
    const start = request.nextUrl.searchParams.get('start')
    const end = request.nextUrl.searchParams.get('end')
    const updates = start && end
      ? await sql`SELECT * FROM work_updates WHERE date >= ${start}::date AND date <= ${end}::date ORDER BY date DESC`
      : await sql`SELECT * FROM work_updates ORDER BY date DESC`
    return NextResponse.json(updates)
  } catch (err: any) {
    console.error('GET /api/entries error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!hasValidSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await initializeDatabase(request)
    const sql = getSql(request)
    const body = await request.json()
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    const leave = Boolean(body.is_leave)
    const sick = Boolean(body.sick_leave)
    const casual = Boolean(body.casual_leave)
    const description = leave || sick || casual ? '' : String(body.description || '').trim().slice(0, 10000)
    const rows = await sql`
      INSERT INTO work_updates (date, description, is_leave, sick_leave, casual_leave, updated_at)
      VALUES (${body.date}, ${description}, ${leave}, ${sick}, ${casual}, NOW())
      ON CONFLICT (date) DO UPDATE SET
        description = EXCLUDED.description,
        is_leave = EXCLUDED.is_leave,
        sick_leave = EXCLUDED.sick_leave,
        casual_leave = EXCLUDED.casual_leave,
        updated_at = NOW()
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err: any) {
    console.error('POST /api/entries error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to save entry' }, { status: 500 })
  }
}
