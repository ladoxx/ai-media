import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { post: { status: 'PUBLISHED' } },
        include: {
          post: {
            include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
          },
        },
        orderBy: { post: { publishedAt: 'desc' } },
      },
    },
  })
  if (!tag) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(tag)
}
