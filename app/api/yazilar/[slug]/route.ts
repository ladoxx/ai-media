import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      category: true,
      author: { select: { id: true, name: true, avatar: true } },
    },
  })

  if (!post) {
    return NextResponse.json({ error: 'Yazı bulunamadı.' }, { status: 404 })
  }

  return NextResponse.json({ post })
}

// POST → increment view count
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  await prisma.post.updateMany({
    where: { slug, status: 'PUBLISHED' },
    data: { views: { increment: 1 } },
  })
  return NextResponse.json({ ok: true })
}
