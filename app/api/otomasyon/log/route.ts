import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthorized(req: NextRequest, session: any): boolean {
  if (session && (session.user as { role?: string })?.role === 'SUPERADMIN') return true
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  return !!(token && token === process.env.AUTOMATION_SECRET)
}

// GET: last 100 logs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAuthorized(req, session)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')
  const since = searchParams.get('since') // ISO timestamp

  const logs = await prisma.autoLog.findMany({
    where: {
      type: 'automation',
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(logs)
}

// POST: record a log entry (from automation process)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAuthorized(req, session)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  let body: { message?: string; type?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { message, type = 'automation', status } = body

  if (!message) {
    return NextResponse.json({ error: 'message zorunlu' }, { status: 400 })
  }

  // Determine status from message content if not provided
  let logStatus = status
  if (!logStatus) {
    if (message.includes('❌') || message.toLowerCase().includes('hata')) {
      logStatus = 'error'
    } else if (message.includes('✅') || message.includes('✓') || message.includes('Tamamlandı')) {
      logStatus = 'success'
    } else {
      logStatus = 'info'
    }
  }

  const log = await prisma.autoLog.create({
    data: { type, status: logStatus, message },
  })

  return NextResponse.json({ ok: true, id: log.id })
}
