import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const schema = z.object({
  ad:    z.string().min(2, 'Ad en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  konu:  z.string().min(3, 'Konu seçiniz.'),
  mesaj: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır.'),
  kvkk:  z.boolean().refine((v) => v, 'KVKK onayı gereklidir.'),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { ad, email, konu, mesaj } = parsed.data

  // Log the contact form submission
  await prisma.autoLog.create({
    data: {
      type:    'contact',
      status:  'received',
      message: `[${konu}] ${ad} <${email}>: ${mesaj.substring(0, 200)}`,
    },
  })

  return NextResponse.json({ message: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.' }, { status: 201 })
}
