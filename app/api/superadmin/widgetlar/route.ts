import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const widgets = await prisma.widget.findMany({ orderBy: [{ area: 'asc' }, { order: 'asc' }] })
  return NextResponse.json(widgets)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { name, type, area, settings } = await req.json()
  if (!type || !area) return NextResponse.json({ error: 'type ve area zorunlu' }, { status: 400 })

  // Generate unique slug
  const base = `${type}-${area}`
  const existing = await prisma.widget.findMany({ where: { slug: { startsWith: base } } })
  const slug = `${base}-${existing.length + 1}`

  // Get max order in area
  const maxOrder = await prisma.widget.aggregate({ where: { area }, _max: { order: true } })
  const order = (maxOrder._max.order ?? 0) + 1

  const widget = await prisma.widget.create({
    data: { name: name ?? type, slug, type, area, settings: JSON.stringify(settings ?? {}), order },
  })

  revalidatePath('/', 'layout')
  return NextResponse.json(widget, { status: 201 })
}

export async function PUT(req: NextRequest) {
  // Bulk reorder
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { items } = await req.json() // [{ id, order }]
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items gerekli' }, { status: 400 })

  await Promise.all(
    items.map(({ id, order }: { id: string; order: number }) =>
      prisma.widget.update({ where: { id }, data: { order } })
    )
  )

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
