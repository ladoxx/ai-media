import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'SUPERADMIN') return false
  return true
}

export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    const tests = await prisma.ad.findMany({
      where: { isAbTest: true },
      include: {
        zone: { select: { id: true, name: true, slug: true } },
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by zone, pairing A and B
    const grouped: Record<string, { zone: { id: string; name: string; slug: string }; a?: typeof tests[0]; b?: typeof tests[0] }> = {}
    for (const ad of tests) {
      const key = ad.zoneId
      if (!grouped[key]) grouped[key] = { zone: ad.zone }
      if (ad.abGroup === 'A') grouped[key].a = ad
      if (ad.abGroup === 'B') grouped[key].b = ad
    }

    return NextResponse.json(Object.values(grouped))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    const { zoneId, adAId, adBId } = await req.json()

    // Mark both ads as A/B test participants
    await Promise.all([
      prisma.ad.update({ where: { id: adAId }, data: { isAbTest: true, abGroup: 'A', active: true } }),
      prisma.ad.update({ where: { id: adBId }, data: { isAbTest: true, abGroup: 'B', active: true } }),
    ])

    return NextResponse.json({ ok: true, zoneId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    const { winnerAdId, loserAdId, action } = await req.json()

    if (action === 'apply') {
      // Apply winner: keep it active, deactivate loser, remove A/B flag
      await Promise.all([
        prisma.ad.update({ where: { id: winnerAdId }, data: { isAbTest: false, abGroup: null, active: true } }),
        prisma.ad.update({ where: { id: loserAdId }, data: { isAbTest: false, abGroup: null, active: false } }),
      ])
    } else if (action === 'stop') {
      // Stop test without applying
      await Promise.all([
        prisma.ad.update({ where: { id: winnerAdId }, data: { isAbTest: false, abGroup: null } }),
        prisma.ad.update({ where: { id: loserAdId }, data: { isAbTest: false, abGroup: null } }),
      ])
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
