import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const COMMENT_SETTING_KEYS = [
  'comment_enabled', 'comment_auto_approve', 'comment_registered_only',
  'comment_close_days', 'comment_honeypot', 'comment_ip_limit',
  'comment_word_filter', 'comment_banned_words', 'comment_notify_enabled',
  'comment_notify_email', 'comment_order', 'comment_per_page',
  'comment_show_avatar', 'comment_show_likes',
]

const COMMENT_DEFAULTS: Record<string, string> = {
  comment_enabled: 'true',
  comment_auto_approve: 'false',
  comment_registered_only: 'false',
  comment_close_days: '30',
  comment_honeypot: 'true',
  comment_ip_limit: '5',
  comment_word_filter: 'true',
  comment_banned_words: 'spam,casino,bahis,kumar,porn,hack',
  comment_notify_enabled: 'true',
  comment_notify_email: '',
  comment_order: 'newest',
  comment_per_page: '10',
  comment_show_avatar: 'true',
  comment_show_likes: 'true',
}

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET() {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const settings = await prisma.setting.findMany({ where: { key: { in: COMMENT_SETTING_KEYS } } })
  const map = { ...COMMENT_DEFAULTS }
  for (const s of settings) map[s.key] = s.value
  return NextResponse.json(map)
}

export async function PUT(req: Request) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body: Record<string, string> = await req.json()
  await Promise.all(
    Object.entries(body)
      .filter(([key]) => COMMENT_SETTING_KEYS.includes(key))
      .map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
      )
  )
  return NextResponse.json({ ok: true })
}
