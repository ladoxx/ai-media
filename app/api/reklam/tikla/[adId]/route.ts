import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  const { adId } = await params
  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') || null

  try {
    const ad = await prisma.ad.findUnique({ where: { id: adId }, include: { zone: true } })
    if (!ad) return NextResponse.redirect(new URL('/', req.url))

    // Record click
    await prisma.adClick.create({
      data: {
        adId,
        zoneId: ad.zoneId,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: req.headers.get('user-agent') || null,
        page,
      },
    })

    // Affiliate click also recorded in AffiliateClick if it's a link
    if (ad.type === 'AFFILIATE_BANNER' && ad.linkUrl) {
      // Optionally find matching AffiliateLink by URL
      const affLink = await prisma.affiliateLink.findFirst({ where: { url: ad.linkUrl } })
      if (affLink) {
        await prisma.affiliateClick.create({
          data: {
            linkId: affLink.id,
            ip: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
            userAgent: req.headers.get('user-agent') || null,
          },
        })
        await prisma.affiliateLink.update({ where: { id: affLink.id }, data: { clicks: { increment: 1 } } })
      }
    }

    const target = ad.linkUrl || '/'
    return NextResponse.redirect(target, { status: 302 })
  } catch (e) {
    console.error('Ad click error:', e)
    return NextResponse.redirect(new URL('/', req.url))
  }
}
