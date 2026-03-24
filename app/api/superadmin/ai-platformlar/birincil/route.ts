import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function PUT(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as { primaryId?: string; backupId?: string }

  // Unset all primary/backup flags first
  if (body.primaryId !== undefined) {
    await prisma.aiPlatform.updateMany({ where: { isPrimary: true }, data: { isPrimary: false } })
    if (body.primaryId) {
      await prisma.aiPlatform.update({
        where: { id: body.primaryId },
        data: { isPrimary: true, active: true },
      })
    }
  }

  if (body.backupId !== undefined) {
    await prisma.aiPlatform.updateMany({ where: { isBackup: true }, data: { isBackup: false } })
    if (body.backupId) {
      await prisma.aiPlatform.update({
        where: { id: body.backupId },
        data: { isBackup: true, active: true },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
