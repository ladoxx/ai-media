import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testPlatform } from '@/lib/ai-router'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as { platformId: string; prompt?: string }

  if (!body.platformId) {
    return NextResponse.json({ error: 'platformId zorunlu' }, { status: 400 })
  }

  const result = await testPlatform(
    body.platformId,
    body.prompt ?? 'Merhaba! Türkçe 2 cümleyle kendini tanıt.',
  )

  return NextResponse.json(result)
}
