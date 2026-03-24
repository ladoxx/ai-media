import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkSpam } from '@/lib/spam-check'
import { sendNewCommentNotification } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId gerekli' }, { status: 400 })

  const comments = await prisma.comment.findMany({
    where: { postId, status: 'APPROVED', parentId: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, content: true, likes: true, createdAt: true,
      replies: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, content: true, likes: true, createdAt: true },
      },
    },
  })

  return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { postId, name, email, content, parentId, honeypot } = body

  if (!postId || !name?.trim() || !email?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? undefined
  const userAgent = req.headers.get('user-agent') ?? undefined

  const spam = await checkSpam({ content, ip, honeypot })

  // Auto-approval setting
  const autoApprove = await prisma.setting.findUnique({ where: { key: 'comment_auto_approve' } })
  const requireApproval = autoApprove?.value !== 'true'

  const status = spam.isSpam ? 'SPAM' : requireApproval ? 'PENDING' : 'APPROVED'

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, title: true, slug: true } })
  if (!post) return NextResponse.json({ error: 'Yazı bulunamadı' }, { status: 404 })

  await prisma.comment.create({
    data: {
      postId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      content: content.trim(),
      status: status as 'SPAM' | 'PENDING' | 'APPROVED',
      ip,
      userAgent,
      parentId: parentId ?? null,
      isSpam: spam.isSpam,
    },
  })

  if (status === 'APPROVED') {
    await prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } })
  }

  // Send admin notification (non-blocking, fire and forget)
  if (!spam.isSpam) {
    sendNewCommentNotification({
      name,
      email,
      content,
      postTitle: post.title,
      postSlug: post.slug,
    }).catch(() => {})
    createNotification(
      'NEW_COMMENT',
      'Yeni Yorum',
      `${name}, "${post.title}" yazısına yorum yaptı. Onay bekliyor.`,
      '/superadmin/yorumlar'
    )
  }

  // Never reveal spam detection to sender (honeypot tuzak)
  const message = spam.isSpam || requireApproval
    ? 'Yorumunuz onay bekliyor.'
    : 'Yorumunuz yayınlandı!'

  return NextResponse.json({ ok: true, message, status })
}
