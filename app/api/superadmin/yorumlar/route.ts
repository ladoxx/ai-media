import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status  = searchParams.get('status') ?? undefined
  const search  = searchParams.get('q') ?? undefined
  const page    = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = 20

  const where: Record<string, unknown> = {}
  if (status && status !== 'all') where.status = status.toUpperCase()
  if (search) {
    where.OR = [
      { content: { contains: search } },
      { name: { contains: search } },
      { post: { title: { contains: search } } },
    ]
  }

  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        post: { select: { id: true, title: true, slug: true } },
      },
    }),
  ])

  // Status counts
  const [pending, approved, rejected, spam] = await Promise.all([
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
    prisma.comment.count({ where: { status: 'REJECTED' } }),
    prisma.comment.count({ where: { status: 'SPAM' } }),
  ])

  return NextResponse.json({
    comments,
    total,
    pages: Math.ceil(total / perPage),
    counts: { pending, approved, rejected, spam },
  })
}
