import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: 'Geçersiz subscription' }, { status: 400 })
  }

  // Check if push is enabled
  const setting = await prisma.setting.findUnique({ where: { key: 'notif_push_enabled' } })
  if (setting?.value === 'false') {
    return NextResponse.json({ error: 'Push bildirimleri devre dışı' }, { status: 403 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { p256dh: body.keys.p256dh, auth: body.keys.auth },
    create: { endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.endpoint) return NextResponse.json({ error: 'endpoint gerekli' }, { status: 400 })

  await prisma.pushSubscription.delete({ where: { endpoint: body.endpoint } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
