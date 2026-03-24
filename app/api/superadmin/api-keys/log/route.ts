import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { systemRole?: string; role?: string; id?: string } | undefined
  if (!session || (user?.systemRole !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN')) return null
  return session
}

// GET /api/superadmin/api-keys/log  — Görüntüleme logları
export async function GET(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const page = Number(req.nextUrl.searchParams.get('page') ?? 1)
  const limit = 50
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.apiKeyViewLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.apiKeyViewLog.count(),
  ])

  // userId'ye göre kullanıcı adlarını getir
  const userIds = [...new Set(logs.map((l) => l.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const result = logs.map((l) => ({
    ...l,
    userName: userMap[l.userId]?.name ?? 'Bilinmiyor',
    userEmail: userMap[l.userId]?.email ?? '',
  }))

  return NextResponse.json({ logs: result, total, page, pages: Math.ceil(total / limit) })
}

// POST /api/superadmin/api-keys/log  — Log kaydı oluştur
export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const userId = (session.user as { id?: string }).id!
  const { keyName } = await req.json() as { keyName?: string }

  if (!keyName) return NextResponse.json({ error: 'keyName zorunludur' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? undefined

  const log = await prisma.apiKeyViewLog.create({
    data: { userId, keyName, ip, userAgent },
  })

  return NextResponse.json({ ok: true, id: log.id })
}
