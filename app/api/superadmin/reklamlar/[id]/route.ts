import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'SUPERADMIN') return false
  return true
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  try {
    const ad = await prisma.ad.findUnique({ where: { id }, include: { zone: true } })
    if (!ad) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json(ad)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  try {
    const body = await req.json()
    const { name, zoneId, type, code, imageUrl, linkUrl, active, isAbTest, abGroup, startDate, endDate, price } = body

    const ad = await prisma.ad.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(zoneId !== undefined && { zoneId }),
        ...(type !== undefined && { type }),
        ...(code !== undefined && { code }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(active !== undefined && { active }),
        ...(isAbTest !== undefined && { isAbTest }),
        ...(abGroup !== undefined && { abGroup }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
      },
      include: { zone: true },
    })
    return NextResponse.json(ad)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  try {
    await prisma.adClick.deleteMany({ where: { adId: id } })
    await prisma.ad.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
