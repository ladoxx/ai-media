import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { syncPostTags } from '../route'

interface Params {
  params: Promise<{ id: string }>
}

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().min(1).optional(),
  tagNames: z.array(z.string()).optional(),
  readTime: z.number().int().positive().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDesc: z.string().nullable().optional(),
})

async function getPostWithAuth(id: string, session: { user: { id?: string; role?: string } | undefined }) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  })

  if (!post) return { post: null, error: 'Yazı bulunamadı', status: 404 as const }

  const userId = (session!.user as any).id
  const role = (session!.user as any).role as string

  if (role === 'EDITOR' && post.authorId !== userId) {
    return { post: null, error: 'Bu yazıya erişim yetkiniz yok', status: 403 as const }
  }

  return { post, error: null, status: 200 as const }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

  const { id } = await params
  const { post, error, status } = await getPostWithAuth(id, session)
  if (!post) return NextResponse.json({ error }, { status })

  // Return flat tags array for editor convenience
  return NextResponse.json({
    ...post,
    tags: post.tags.map((pt) => pt.tag),
  })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

  const { id } = await params
  const { post, error, status } = await getPostWithAuth(id, session)
  if (!post) return NextResponse.json({ error }, { status })

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 }) }

  const parsed = updatePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const data = parsed.data
  let publishedAt = post.publishedAt
  if (data.status === 'PUBLISHED' && post.publishedAt === null) publishedAt = new Date()

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.content !== undefined) updateData.content = data.content
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
  if (data.status !== undefined) updateData.status = data.status
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
  if (data.readTime !== undefined) updateData.readTime = data.readTime
  if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle
  if (data.seoDesc !== undefined) updateData.seoDesc = data.seoDesc
  updateData.publishedAt = publishedAt

  const updated = await prisma.post.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
    },
  })

  if (data.tagNames !== undefined) {
    await syncPostTags(id, data.tagNames)
  }

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

  const { id } = await params
  const { post, error, status } = await getPostWithAuth(id, session)
  if (!post) return NextResponse.json({ error }, { status })

  await prisma.postTag.deleteMany({ where: { postId: id } })
  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
