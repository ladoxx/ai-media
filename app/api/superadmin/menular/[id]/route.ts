import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const menu = await prisma.menu.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  if (!menu) return NextResponse.json({ error: 'Menü bulunamadı' }, { status: 404 })
  return NextResponse.json(menu)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as { name?: string; location?: string }

  const menu = await prisma.menu.update({
    where: { id },
    data: {
      ...(body.name ? { name: body.name } : {}),
      ...(body.location ? { location: body.location } : {}),
    },
  })
  return NextResponse.json(menu)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  // Delete children first (self-referential), then parents, then menu
  await prisma.menuItem.deleteMany({ where: { menuId: id, parentId: { not: null } } })
  await prisma.menuItem.deleteMany({ where: { menuId: id } })
  await prisma.menu.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
