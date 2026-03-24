import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendPushNotification } from '@/lib/push'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const [total, recent] = await Promise.all([
    prisma.pushSubscription.count(),
    prisma.pushSubscription.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  return NextResponse.json({ total, recent })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { title, body, url } = await req.json()
  if (!title || !body) return NextResponse.json({ error: 'title ve body zorunlu' }, { status: 400 })

  const result = await sendPushNotification(title, body, url ?? '/')
  return NextResponse.json({ ok: true, ...result })
}
