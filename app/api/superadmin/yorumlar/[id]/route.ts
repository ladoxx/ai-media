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
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      post: { select: { id: true, title: true, slug: true } },
      replies: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!comment) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(comment)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  const { status, content } = await req.json()

  const prev = await prisma.comment.findUnique({ where: { id }, select: { status: true, postId: true } })
  if (!prev) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (status) {
    data.status = status
    data.isSpam = status === 'SPAM'
  }
  if (content) data.content = content

  await prisma.comment.update({ where: { id }, data })

  // Sync commentCount on the post
  if (status && status !== prev.status) {
    const wasApproved = prev.status === 'APPROVED'
    const nowApproved = status === 'APPROVED'
    if (nowApproved && !wasApproved) {
      await prisma.post.update({ where: { id: prev.postId }, data: { commentCount: { increment: 1 } } })
    } else if (!nowApproved && wasApproved) {
      await prisma.post.update({ where: { id: prev.postId }, data: { commentCount: { decrement: 1 } } })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params

  const comment = await prisma.comment.findUnique({ where: { id }, select: { status: true, postId: true } })
  if (!comment) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  // Delete replies first (SQLite no cascade)
  await prisma.comment.deleteMany({ where: { parentId: id } })
  await prisma.comment.delete({ where: { id } })

  if (comment.status === 'APPROVED') {
    await prisma.post.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } })
  }

  return NextResponse.json({ ok: true })
}
