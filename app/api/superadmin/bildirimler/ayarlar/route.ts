import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const NOTIF_KEYS = [
  'notif_email_enabled',
  'notif_email_new_comment',
  'notif_email_new_subscriber',
  'notif_email_auto_error',
  'notif_email_system_error',
  'notif_admin_email',
  'notif_email_digest',
  'notif_push_enabled',
  'notif_push_delay',
  'notif_push_max_shows',
  'notif_bell_new_comment',
  'notif_bell_new_subscriber',
  'notif_bell_auto_success',
  'notif_bell_auto_error',
  'notif_bell_affiliate',
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const rows = await prisma.setting.findMany({ where: { key: { in: NOTIF_KEYS } } })
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const body = await req.json()

  await Promise.all(
    NOTIF_KEYS.map((key) => {
      if (!(key in body)) return null
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key]) },
        create: { key, value: String(body[key]) },
      })
    }).filter(Boolean)
  )

  return NextResponse.json({ ok: true })
}
