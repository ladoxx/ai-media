import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { linkId } = await req.json() as { linkId?: string }
    if (!linkId) return NextResponse.json({ error: 'linkId zorunlu' }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? null
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

    await Promise.all([
      prisma.affiliateClick.create({ data: { linkId, ip, userAgent } }),
      prisma.affiliateLink.update({ where: { id: linkId }, data: { clicks: { increment: 1 } } }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Kayıt hatası' }, { status: 500 })
  }
}
