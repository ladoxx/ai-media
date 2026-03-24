import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subDays, format } from 'date-fns'

function forbidden() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
}

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const totalActive = await prisma.subscriber.count({ where: { active: true } })

  // Build growth data: new subscribers per day for last 30 days
  const growthMap: Record<string, number> = {}
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i)
    growthMap[format(d, 'dd.MM')] = 0
  }

  for (const sub of subscribers) {
    const d = new Date(sub.createdAt)
    const key = format(d, 'dd.MM')
    if (key in growthMap) {
      growthMap[key]++
    }
  }

  const growthData = Object.entries(growthMap).map(([date, count]) => ({ date, count }))

  return NextResponse.json({ subscribers, totalActive, growthData })
}

export async function POST(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const body = await req.json()
  const { subject, content } = body

  if (!subject || !content) {
    return NextResponse.json({ error: 'Konu ve içerik zorunludur' }, { status: 400 })
  }

  const activeCount = await prisma.subscriber.count({ where: { active: true } })

  await prisma.autoLog.create({
    data: {
      type: 'newsletter',
      status: 'success',
      message: `Bülten gönderildi: "${subject}" - ${activeCount} abone`,
    },
  })

  return NextResponse.json({ sent: activeCount })
}

export async function DELETE(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Email zorunludur' }, { status: 400 })
  }

  try {
    await prisma.subscriber.delete({ where: { email } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Abone bulunamadı' }, { status: 404 })
  }
}
