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
    const config = await prisma.adSenseConfig.findFirst()
    return NextResponse.json(config || { publisherId: '', autoAdsOn: false, active: false })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    const { publisherId, autoAdsOn, active } = await req.json()
    const existing = await prisma.adSenseConfig.findFirst()

    const config = existing
      ? await prisma.adSenseConfig.update({
          where: { id: existing.id },
          data: {
            ...(publisherId !== undefined && { publisherId }),
            ...(autoAdsOn !== undefined && { autoAdsOn }),
            ...(active !== undefined && { active }),
          },
        })
      : await prisma.adSenseConfig.create({
          data: { publisherId: publisherId || '', autoAdsOn: autoAdsOn ?? false, active: active ?? false },
        })

    return NextResponse.json(config)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
