import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const days = parseInt(searchParams.get('days') ?? '30', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [platforms, recentLogs] = await Promise.all([
    prisma.aiPlatform.findMany({ orderBy: { usedTokens: 'desc' } }),
    prisma.aiLog.findMany({
      where: { createdAt: { gte: since } },
      include: { platform: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  // Per-platform stats
  const platformStats = platforms.map((p) => {
    const logs = recentLogs.filter((l) => l.platformId === p.id)
    const successLogs = logs.filter((l) => l.success)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      active: p.active,
      isPrimary: p.isPrimary,
      isBackup: p.isBackup,
      totalTokens: p.usedTokens,
      recentTokens: logs.reduce((s, l) => s + l.tokens, 0),
      recentCost: logs.reduce((s, l) => s + l.cost, 0),
      requestCount: logs.length,
      successRate: logs.length > 0 ? (successLogs.length / logs.length) * 100 : 0,
      avgDuration: successLogs.length > 0
        ? successLogs.reduce((s, l) => s + l.duration, 0) / successLogs.length
        : 0,
    }
  })

  // Daily usage (last N days)
  const dailyMap: Record<string, { tokens: number; requests: number; cost: number }> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dailyMap[key] = { tokens: 0, requests: 0, cost: 0 }
  }
  for (const log of recentLogs) {
    const key = log.createdAt.toISOString().slice(0, 10)
    if (dailyMap[key]) {
      dailyMap[key].tokens += log.tokens
      dailyMap[key].requests += 1
      dailyMap[key].cost += log.cost
    }
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  return NextResponse.json({
    platformStats,
    daily,
    recentLogs: recentLogs.slice(0, 50).map((l) => ({
      id: l.id,
      platformName: l.platform.name,
      platformSlug: l.platform.slug,
      tokens: l.tokens,
      cost: l.cost,
      duration: l.duration,
      success: l.success,
      prompt: l.prompt.slice(0, 80),
      createdAt: l.createdAt,
    })),
  })
}
