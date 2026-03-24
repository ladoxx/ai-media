import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const kategori = searchParams.get('kategori')
  const sayfa = parseInt(searchParams.get('sayfa') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')
  const durum = searchParams.get('durum')
  const skip = (sayfa - 1) * limit

  const where: Record<string, unknown> = {}

  // Public endpoint: only PUBLISHED unless admin
  const session = await getServerSession(authOptions)
  const isAdmin = !!session

  if (!isAdmin) {
    where.status = 'PUBLISHED'
  } else if (durum) {
    where.status = durum
  }

  if (kategori) {
    where.category = { slug: kategori }
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        category: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({
    posts,
    pagination: {
      total,
      page: sayfa,
      limit,
      pages: Math.ceil(total / limit),
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const data = body as {
    title: string
    slug: string
    content: string
    excerpt?: string
    coverImage?: string
    status?: string
    categoryId: string
    tags?: string
    readTime?: number
    seoTitle?: string
    seoDesc?: string
  }

  if (!data.title || !data.slug || !data.categoryId) {
    return NextResponse.json({ error: 'Başlık, slug ve kategori zorunludur' }, { status: 400 })
  }

  // Check slug uniqueness
  const existing = await prisma.post.findUnique({ where: { slug: data.slug } })
  if (existing) {
    data.slug = `${data.slug}-${Date.now()}`
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 })

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content ?? '',
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      status: (data.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') ?? 'DRAFT',
      categoryId: data.categoryId,
      authorId: userId,
      readTime: data.readTime ?? 3,
      seoTitle: data.seoTitle,
      seoDesc: data.seoDesc,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
    include: { category: true },
  })

  return NextResponse.json({ post }, { status: 201 })
}
