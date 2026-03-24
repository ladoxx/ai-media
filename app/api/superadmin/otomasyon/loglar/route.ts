import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function forbidden() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPERADMIN') return forbidden()

  const status = req.nextUrl.searchParams.get('status')
  const where = status ? { status } : {}

  const logs = await prisma.autoLog.findMany({
    where,
    take: 100,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(logs)
}
