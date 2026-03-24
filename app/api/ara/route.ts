import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const kategori = searchParams.get('kategori') ?? ''
  const sayfa = parseInt(searchParams.get('sayfa') ?? '1')
  const limit = 9
  const skip = (sayfa - 1) * limit

  if (!q) {
    return NextResponse.json({ posts: [], total: 0, q: '' })
  }

  const where = {
    status: 'PUBLISHED' as const,
    OR: [
      { title:   { contains: q } },
      { content: { contains: q } },
      { excerpt: { contains: q } },
      { tags: { some: { tag: { name: { contains: q } } } } },
    ],
    ...(kategori ? { category: { slug: kategori } } : {}),
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

  return NextResponse.json({ posts, total, q, sayfa, pages: Math.ceil(total / limit) })
}
