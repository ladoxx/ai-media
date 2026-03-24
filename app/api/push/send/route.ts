import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { title, body, url } = await req.json()
  if (!title || !body) return NextResponse.json({ error: 'title ve body zorunlu' }, { status: 400 })

  const result = await sendPushNotification(title, body, url ?? '/')
  return NextResponse.json({ ok: true, ...result })
}
