import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ zoneSlug: string }> }
) {
  const { zoneSlug } = await params

  try {
    const zone = await prisma.adZone.findUnique({
      where: { slug: zoneSlug, active: true },
      include: {
        ads: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!zone || zone.ads.length === 0) {
      return NextResponse.json(null)
    }

    let ad = zone.ads[0]

    // A/B test logic
    const abAds = zone.ads.filter((a) => a.isAbTest)
    if (abAds.length >= 2) {
      const cookieStore = await cookies()
      const abCookie = cookieStore.get(`ab_${zone.slug}`)?.value
      const group = abCookie || (Math.random() < 0.5 ? 'A' : 'B')
      ad = abAds.find((a) => a.abGroup === group) || abAds[0]

      // Set cookie if not set
      const res = NextResponse.json(ad)
      if (!abCookie) {
        res.cookies.set(`ab_${zone.slug}`, group, { maxAge: 60 * 60 * 24 * 30, path: '/' })
      }

      // Fire-and-forget: don't block response for impression tracking
      prisma.ad.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } }).catch(() => {})
      return res
    }

    // Single ad: fire-and-forget impression tracking
    prisma.ad.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } }).catch(() => {})

    return NextResponse.json(ad)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
