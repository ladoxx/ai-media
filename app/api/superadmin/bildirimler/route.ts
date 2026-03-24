import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const PER_PAGE = 20

  const typeMap: Record<string, string[]> = {
    comments:   ['NEW_COMMENT'],
    subscribers:['NEW_SUBSCRIBER'],
    automation: ['AUTOMATION_SUCCESS', 'AUTOMATION_ERROR'],
    system:     ['SYSTEM_ERROR', 'LOW_DISK'],
  }

  const where = filter !== 'all' && typeMap[filter]
    ? { type: { in: typeMap[filter] as any } }
    : {}

  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { read: false } }),
  ])

  return NextResponse.json({ notifications, total, unread, pages: Math.ceil(total / PER_PAGE) })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const body = await req.json().catch(() => ({}))

  if (body.markAllRead) {
    await prisma.notification.updateMany({ data: { read: true } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({}, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const body = await req.json().catch(() => ({}))
  if (body.deleteAll) {
    await prisma.notification.deleteMany({})
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({}, { status: 400 })
}
