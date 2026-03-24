import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'SUPERADMIN') return false
  return true
}

export async function GET(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'month'
  const zoneId = searchParams.get('zoneId') || undefined

  const now = new Date()
  let startDate: Date
  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  try {
    const whereClause = {
      createdAt: { gte: startDate },
      ...(zoneId ? { zoneId } : {}),
    }

    // Total clicks
    const totalClicks = await prisma.adClick.count({ where: whereClause })

    // Today's clicks
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayClicks = await prisma.adClick.count({ where: { ...whereClause, createdAt: { gte: todayStart } } })

    // Active ads count
    const activeAds = await prisma.ad.count({ where: { active: true } })

    // Total impressions
    const impressionAgg = await prisma.ad.aggregate({ _sum: { impressions: true } })
    const totalImpressions = impressionAgg._sum.impressions ?? 0
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

    // By zone
    const zones = await prisma.adZone.findMany({
      include: {
        ads: { select: { id: true, name: true, type: true, impressions: true } },
        _count: { select: { clicks: true } },
      },
    })

    const zoneStats = zones.map((z) => {
      const impressions = z.ads.reduce((s, a) => s + a.impressions, 0)
      const clicks = z._count.clicks
      const ctrZ = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0'
      return {
        id: z.id,
        name: z.name,
        slug: z.slug,
        size: z.size,
        position: z.position,
        active: z.active,
        activeAd: z.ads[0]?.name || null,
        impressions,
        clicks,
        ctr: ctrZ,
      }
    })

    // By page (top 10)
    const byPage = await prisma.adClick.groupBy({
      by: ['page'],
      _count: { id: true },
      where: { createdAt: { gte: startDate }, page: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    // By ad
    const adStats = await prisma.ad.findMany({
      select: { id: true, name: true, type: true, impressions: true, _count: { select: { clicks: true } } },
      orderBy: { impressions: 'desc' },
      take: 20,
    })
    const adStatsWithCtr = adStats.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      impressions: a.impressions,
      clicks: a._count.clicks,
      ctr: a.impressions > 0 ? ((a._count.clicks / a.impressions) * 100).toFixed(1) : '0.0',
    }))

    // Daily clicks — last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dailyClicks = await prisma.adClick.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group by day
    const dailyMap: Record<string, number> = {}
    for (const c of dailyClicks) {
      const day = c.createdAt.toISOString().slice(0, 10)
      dailyMap[day] = (dailyMap[day] || 0) + 1
    }
    const dailyData = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      summary: { activeAds, todayClicks, totalClicks, ctr },
      zoneStats,
      byPage: byPage.map((p) => ({ page: p.page, clicks: p._count.id })),
      adStats: adStatsWithCtr,
      dailyData,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
