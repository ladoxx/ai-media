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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAuthorized(req, session)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'automation_schedule',
          'automation_running',
          'automation_run_started',
          'automation_enabled',
        ],
      },
    },
  })

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  const lastLog = await prisma.autoLog.findFirst({
    where: { type: 'automation' },
    orderBy: { createdAt: 'desc' },
  })

  const recentLogs = await prisma.autoLog.findMany({
    where: { type: 'automation' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  let schedule = { sabah: '08:00', oglen: '13:00', aksam: '18:00' }
  if (map.automation_schedule) {
    try { schedule = { ...schedule, ...JSON.parse(map.automation_schedule) } } catch { /* ignore */ }
  }

  // Determine if stale run (> 10 min)
  const running = map.automation_running || 'false'
  const runningCategory = running !== 'false' ? running : null
  let isRunning = !!runningCategory
  if (isRunning && map.automation_run_started) {
    const startedAt = new Date(map.automation_run_started).getTime()
    if (Date.now() - startedAt > 20 * 60 * 1000) {
      isRunning = false // stale — treat as not running
    }
  }

  const enabled = map.automation_enabled !== 'false'

  function getNextRun(): string | null {
    const times = [schedule.sabah, schedule.oglen, schedule.aksam]
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    for (const t of times) {
      const [h, m] = t.split(':').map(Number)
      const runTime = new Date(today.getTime() + h * 3600000 + m * 60000)
      if (runTime > now) return `Bugün ${t}`
    }
    return `Yarın ${times[0]}`
  }

  return NextResponse.json({
    lastRun: lastLog?.createdAt ?? null,
    nextRun: enabled ? getNextRun() : 'Devre dışı',
    active: enabled,
    enabled,
    isRunning,
    runningCategory,
    runStartedAt: map.automation_run_started || null,
    schedule,
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      message: l.message,
      status: l.status,
      createdAt: l.createdAt,
    })),
  })
}

// PATCH: toggle enabled/disabled OR force-reset running state
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAuthorized(req, session)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const body = await req.json() as { enabled?: boolean; resetRunning?: boolean }

  // Force-reset a stale or stuck running state
  if (body.resetRunning) {
    await prisma.setting.upsert({
      where: { key: 'automation_running' },
      update: { value: 'false' },
      create: { key: 'automation_running', value: 'false' },
    })
    await prisma.autoLog.create({
      data: { type: 'automation', status: 'info', message: 'Çalışma durumu zorla sıfırlandı' },
    })
    return NextResponse.json({ ok: true, reset: true })
  }

  const { enabled } = body

  await prisma.setting.upsert({
    where: { key: 'automation_enabled' },
    update: { value: enabled ? 'true' : 'false' },
    create: { key: 'automation_enabled', value: enabled ? 'true' : 'false' },
  })

  await prisma.autoLog.create({
    data: {
      type: 'automation',
      status: 'info',
      message: `Otomasyon ${enabled ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`,
    },
  })

  return NextResponse.json({ ok: true, enabled })
}
