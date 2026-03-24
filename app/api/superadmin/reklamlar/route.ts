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
    const ads = await prisma.ad.findMany({
      include: { zone: { select: { id: true, name: true, slug: true, size: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(ads)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, zoneId, type, code, imageUrl, linkUrl, isAbTest, abGroup, startDate, endDate, price } = body

    const ad = await prisma.ad.create({
      data: {
        name,
        zoneId,
        type,
        code: code || '',
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isAbTest: isAbTest ?? false,
        abGroup: abGroup || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        price: price ? parseFloat(price) : null,
        active: true,
      },
      include: { zone: true },
    })

    // Sponsorlu içerik ise gelir kaydı oluştur
    if (type === 'SPONSORED' && price) {
      await prisma.income.create({
        data: {
          source: 'sponsor',
          amount: parseFloat(price),
          currency: 'USD',
          description: `Sponsorlu İçerik: ${name}`,
        },
      })
    }

    return NextResponse.json(ad)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
