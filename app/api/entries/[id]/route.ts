import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getSql } from '@/lib/neon'
import { hasValidSession } from '@/lib/session'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await initializeDatabase(request)
    const sql = getSql(request)
    const { id } = await context.params
    const rows = await sql`SELECT * FROM work_update_images WHERE work_update_id = ${id}::uuid ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (err: any) {
    console.error('GET /api/entries/[id] error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to fetch images' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await initializeDatabase(request)
    const sql = getSql(request)
    const { id } = await context.params
    await sql`DELETE FROM work_update_images WHERE id = ${id}::uuid`
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    console.error('DELETE /api/entries/[id] error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to delete image' }, { status: 500 })
  }
}
