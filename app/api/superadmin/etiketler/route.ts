import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import slugify from 'slugify'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search  = searchParams.get('q') ?? ''
  const sort    = searchParams.get('sort') ?? 'name'
  const order   = searchParams.get('order') === 'desc' ? 'desc' : 'asc'
  const page    = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = 50

  const where = search ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] } : {}

  const orderBy: Record<string, string> = {}
  if (['name', 'postCount', 'createdAt'].includes(sort)) orderBy[sort] = order

  const [total, tags] = await Promise.all([
    prisma.tag.count({ where }),
    prisma.tag.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage }),
  ])

  // Monthly count
  const thisMonth = new Date()
  thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)
  const addedThisMonth = await prisma.tag.count({ where: { createdAt: { gte: thisMonth } } })

  // Top tag
  const topTag = await prisma.tag.findFirst({ orderBy: { postCount: 'desc' }, select: { name: true } })

  return NextResponse.json({ tags, total, pages: Math.ceil(total / perPage), addedThisMonth, topTag: topTag?.name })
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { name, description, seoTitle, seoDesc } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'İsim zorunludur' }, { status: 400 })

  const slug = slugify(name.trim(), { lower: true, strict: true, locale: 'tr' })
  const existing = await prisma.tag.findFirst({ where: { OR: [{ name: name.trim() }, { slug }] } })
  if (existing) return NextResponse.json({ error: 'Bu etiket zaten mevcut' }, { status: 409 })

  const tag = await prisma.tag.create({ data: { name: name.trim(), slug, description, seoTitle, seoDesc } })
  revalidatePath('/', 'layout')
  return NextResponse.json(tag, { status: 201 })
}
