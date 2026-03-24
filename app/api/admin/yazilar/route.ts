import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import slugify from 'slugify'
import { z } from 'zod'

// Upsert tags by name, sync PostTag records, update postCount
export async function syncPostTags(postId: string, tagNames: string[]) {
  const cleaned = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))]

  // Upsert each tag
  const tags = await Promise.all(
    cleaned.map((name) => {
      const slug = slugify(name, { lower: true, strict: true, locale: 'tr' })
      return prisma.tag.upsert({ where: { name }, update: {}, create: { name, slug } })
    })
  )

  // Remove all existing PostTag for this post
  await prisma.postTag.deleteMany({ where: { postId } })

  // Create new PostTag records
  if (tags.length) {
    await prisma.postTag.createMany({ data: tags.map((tag) => ({ postId, tagId: tag.id })) })
  }

  // Recalculate postCount for all affected tags
  await Promise.all(
    tags.map(async (tag) => {
      const count = await prisma.postTag.count({ where: { tagId: tag.id } })
      return prisma.tag.update({ where: { id: tag.id }, data: { postCount: count } })
    })
  )
}

const createPostSchema = z.object({
  title: z.string().min(1, 'Başlık zorunludur'),
  content: z.string().min(1, 'İçerik zorunludur'),
  categoryId: z.string().min(1, 'Kategori zorunludur'),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  tagNames: z.array(z.string()).optional(),
  readTime: z.number().int().positive().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const role = ((session.user as any).systemRole ?? (session.user as any).role) as string

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const page = Math.max(parseInt(searchParams.get('sayfa') ?? '1', 10), 1)
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''
  const categoryId = searchParams.get('category') ?? ''

  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  // EDITOR sees only their own posts; SUPERADMIN/ADMIN sees all
  if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
    where.authorId = userId
  }

  if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    where.status = status
  }

  if (search) {
    where.title = { contains: search }
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        author: { select: { id: true, name: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({ posts, total, page, totalPages })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  const userId = (session.user as any).id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Generate slug
  let baseSlug = slugify(data.title, { lower: true, strict: true, locale: 'tr' })
  if (!baseSlug) baseSlug = `yazi-${Date.now()}`

  // Check uniqueness
  const existing = await prisma.post.findUnique({ where: { slug: baseSlug } })
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

  const publishedAt =
    data.status === 'PUBLISHED' ? new Date() : null

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt ?? null,
      coverImage: data.coverImage ?? null,
      status: data.status,
      categoryId: data.categoryId,
      authorId: userId,
      readTime: data.readTime ?? 3,
      seoTitle: data.seoTitle ?? null,
      seoDesc: data.seoDesc ?? null,
      publishedAt,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
    },
  })

  // Sync tags
  if (data.tagNames?.length) {
    await syncPostTags(post.id, data.tagNames)
  }

  return NextResponse.json(post, { status: 201 })
}
