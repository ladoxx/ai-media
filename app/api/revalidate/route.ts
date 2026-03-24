import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || token !== process.env.AUTOMATION_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as { tags?: string[] }
  const tags = body.tags?.length ? body.tags : ['posts']

  for (const tag of tags) {
    revalidateTag(tag)
  }

  return NextResponse.json({ ok: true, revalidated: tags })
}
