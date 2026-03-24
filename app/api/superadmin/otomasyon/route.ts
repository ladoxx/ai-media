import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function forbidden() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
}

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPERADMIN') return null
  return session
}

export async function GET() {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const lastLog = await prisma.autoLog.findFirst({
    where: { type: 'automation' },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    lastRun: lastLog?.createdAt ?? null,
    active: true,
    nextRun: null,
  })
}

export async function POST(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const body = await req.json()
  const { category } = body

  if (!category) {
    return NextResponse.json({ error: 'Kategori zorunludur' }, { status: 400 })
  }

  await prisma.autoLog.create({
    data: {
      type: 'automation',
      status: 'success',
      message: `${category} kategorisi manuel çalıştırıldı`,
    },
  })

  return NextResponse.json({ ok: true, message: 'Otomasyon başlatıldı' })
}

export async function PUT(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const body = await req.json()
  const { sabah, oglen, aksam } = body

  await prisma.autoLog.create({
    data: {
      type: 'automation',
      status: 'info',
      message: `Zamanlama güncellendi — Sabah: ${sabah}, Öğlen: ${oglen}, Akşam: ${aksam}`,
    },
  })

  // Persist schedule to settings
  const scheduleValue = JSON.stringify({ sabah, oglen, aksam })
  await prisma.setting.upsert({
    where: { key: 'automation_schedule' },
    update: { value: scheduleValue },
    create: { key: 'automation_schedule', value: scheduleValue },
  })

  return NextResponse.json({ ok: true })
}
