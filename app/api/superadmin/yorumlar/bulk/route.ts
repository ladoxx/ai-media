import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function PUT(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { ids, status } = await req.json()
  if (!ids?.length || !status) return NextResponse.json({ error: 'ids ve status gerekli' }, { status: 400 })

  const prevComments = await prisma.comment.findMany({ where: { id: { in: ids } }, select: { id: true, status: true, postId: true } })
  await prisma.comment.updateMany({ where: { id: { in: ids } }, data: { status, isSpam: status === 'SPAM' } })

  // Sync commentCount
  for (const prev of prevComments) {
    const wasApproved = prev.status === 'APPROVED'
    const nowApproved = status === 'APPROVED'
    if (nowApproved && !wasApproved) {
      await prisma.post.update({ where: { id: prev.postId }, data: { commentCount: { increment: 1 } } })
    } else if (!nowApproved && wasApproved) {
      await prisma.post.update({ where: { id: prev.postId }, data: { commentCount: { decrement: 1 } } })
    }
  }

  return NextResponse.json({ ok: true, updated: ids.length })
}

export async function DELETE(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { ids } = await req.json()
  if (!ids?.length) return NextResponse.json({ error: 'ids gerekli' }, { status: 400 })

  const prevComments = await prisma.comment.findMany({ where: { id: { in: ids } }, select: { status: true, postId: true } })
  await prisma.comment.deleteMany({ where: { parentId: { in: ids } } })
  await prisma.comment.deleteMany({ where: { id: { in: ids } } })

  for (const prev of prevComments) {
    if (prev.status === 'APPROVED') {
      await prisma.post.update({ where: { id: prev.postId }, data: { commentCount: { decrement: 1 } } })
    }
  }

  return NextResponse.json({ ok: true, deleted: ids.length })
}
