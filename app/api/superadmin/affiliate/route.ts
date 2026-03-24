import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const links = await prisma.affiliateLink.findMany({
    orderBy: { clicks: 'desc' },
    include: {
      _count: { select: { history: true } },
      history: { where: { createdAt: { gte: monthStart } }, select: { id: true } },
    },
  })

  const result = links.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    url: l.url,
    keywords: l.keywords,
    commission: l.commission,
    clicks: l.clicks,
    clicksThisMonth: l.history.length,
    active: l.active,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    name: string; url: string; keywords: string; commission?: number; slug?: string
  }

  if (!body.name || !body.url) {
    return NextResponse.json({ error: 'name ve url zorunlu' }, { status: 400 })
  }

  const slug = body.slug || makeSlug(body.name)

  const link = await prisma.affiliateLink.create({
    data: {
      name: body.name,
      slug,
      url: body.url,
      keywords: body.keywords ?? '',
      commission: Number(body.commission ?? 0),
    },
  })

  return NextResponse.json(link, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    id: string; name?: string; url?: string; keywords?: string; commission?: number
    active?: boolean; slug?: string
  }

  if (!body.id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  const link = await prisma.affiliateLink.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.url !== undefined ? { url: body.url } : {}),
      ...(body.keywords !== undefined ? { keywords: body.keywords } : {}),
      ...(body.commission !== undefined ? { commission: Number(body.commission) } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
    },
  })

  return NextResponse.json(link)
}

export async function DELETE(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  // Delete clicks history first
  await prisma.affiliateClick.deleteMany({ where: { linkId: id } })
  await prisma.affiliateLink.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
