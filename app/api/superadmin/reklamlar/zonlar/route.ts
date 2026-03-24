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
    const zones = await prisma.adZone.findMany({
      include: {
        ads: { where: { active: true }, select: { id: true, name: true, type: true } },
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(zones)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    const body = await req.json()
    const { id, active } = body
    const zone = await prisma.adZone.update({ where: { id }, data: { active } })
    return NextResponse.json(zone)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
