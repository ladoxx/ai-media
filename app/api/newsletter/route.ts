import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { createNotification } from '@/lib/notifications'

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email } = parsed.data

  const existing = await prisma.subscriber.findUnique({ where: { email } })
  if (existing) {
    if (existing.active) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı.' }, { status: 409 })
    }
    await prisma.subscriber.update({ where: { email }, data: { active: true } })
    return NextResponse.json({ message: 'Tekrar hoş geldiniz!' })
  }

  await prisma.subscriber.create({ data: { email } })
  const total = await prisma.subscriber.count({ where: { active: true } })
  createNotification('NEW_SUBSCRIBER', 'Yeni Abone', `${email} bültene abone oldu. Toplam: ${total} abone.`, '/superadmin/newsletter')
  return NextResponse.json({ message: 'Başarıyla abone oldunuz!' }, { status: 201 })
}
