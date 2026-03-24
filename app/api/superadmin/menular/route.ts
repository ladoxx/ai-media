import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET() {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const menus = await prisma.menu.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json(menus)
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as { name: string; location: string; slug?: string }
  if (!body.name || !body.location) {
    return NextResponse.json({ error: 'Ad ve konum zorunludur' }, { status: 400 })
  }

  const slug = body.slug || body.name.toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const menu = await prisma.menu.create({
    data: { name: body.name, slug, location: body.location },
  })
  return NextResponse.json(menu, { status: 201 })
}
