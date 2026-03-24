import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

// POST: add a single item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id: menuId } = await params
  const body = await req.json() as {
    label: string; url: string; type?: string; target?: string; icon?: string; parentId?: string
  }

  // Get max order for this menu at root level
  const maxOrder = await prisma.menuItem.aggregate({
    where: { menuId, parentId: body.parentId ?? null },
    _max: { order: true },
  })

  const item = await prisma.menuItem.create({
    data: {
      menuId,
      label: body.label,
      url: body.url,
      type: body.type ?? 'custom',
      target: body.target ?? '_self',
      icon: body.icon ?? null,
      parentId: body.parentId ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })
  return NextResponse.json(item, { status: 201 })
}

// PUT: bulk save all items (reorder + nest)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id: menuId } = await params
  const body = await req.json() as Array<{
    id: string; label: string; url: string; type: string; target: string
    icon: string | null; order: number; parentId: string | null
  }>

  // Upsert each item
  await prisma.$transaction(
    body.map((item) =>
      prisma.menuItem.upsert({
        where: { id: item.id },
        update: {
          label: item.label,
          url: item.url,
          type: item.type,
          target: item.target,
          icon: item.icon,
          order: item.order,
          parentId: item.parentId,
        },
        create: {
          id: item.id,
          menuId,
          label: item.label,
          url: item.url,
          type: item.type,
          target: item.target,
          icon: item.icon,
          order: item.order,
          parentId: item.parentId,
        },
      })
    )
  )

  // Delete items not in the list
  const incomingIds = body.map((i) => i.id)
  await prisma.menuItem.deleteMany({
    where: { menuId, id: { notIn: incomingIds } },
  })

  return NextResponse.json({ ok: true })
}
