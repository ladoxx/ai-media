import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug) return NextResponse.redirect(new URL('/', req.url))

  const link = await prisma.affiliateLink.findUnique({ where: { slug } })
  if (!link || !link.active) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Record click
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? null
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

  // Fire and forget — don't delay the redirect
  void Promise.all([
    prisma.affiliateClick.create({ data: { linkId: link.id, ip, userAgent } }),
    prisma.affiliateLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } }),
  ]).catch(() => {})

  return NextResponse.redirect(link.url, { status: 302 })
}
