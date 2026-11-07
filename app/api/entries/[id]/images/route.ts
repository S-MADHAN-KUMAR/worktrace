import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getSql } from '@/lib/neon'
import { hasValidSession } from '@/lib/session'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await initializeDatabase(request)
    const sql = getSql(request)
    const { id } = await context.params
    const body = await request.json()
    const dataUrl = String(body.image_url || '')
    if (!/^data:image\/(?:png|jpeg|jpg|gif|webp);base64,[a-zA-Z0-9+/=\r\n]+$/.test(dataUrl)) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    }
    const rows = await sql`
      INSERT INTO work_update_images (work_update_id, image_url)
      VALUES (${id}::uuid, ${dataUrl})
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (err: any) {
    console.error('POST /api/entries/[id]/images error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to save image' }, { status: 500 })
  }
}
