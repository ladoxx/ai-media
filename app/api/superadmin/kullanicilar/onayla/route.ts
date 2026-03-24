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

// POST /api/superadmin/kullanicilar/onayla
// Body: { userId }
export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const approverId = (session.user as { id?: string }).id!
  const { userId } = await req.json() as { userId?: string }

  if (!userId) return NextResponse.json({ error: 'userId zorunludur' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  await prisma.user.update({
    where: { id: userId },
    data: { active: true, approvedBy: approverId, approvedAt: new Date() },
  })

  await prisma.autoLog.create({
    data: {
      type: 'user',
      status: 'success',
      message: `Kullanıcı onaylandı: ${user.email}`,
    },
  })

  // Bildirim oluştur
  try {
    await prisma.notification.create({
      data: {
        type: 'NEW_USER',
        title: 'Kullanıcı Onaylandı',
        message: `${user.name} (${user.email}) hesabı onaylandı ve sisteme erişim sağlandı.`,
      },
    })
  } catch {
    // Bildirim başarısız olursa devam et
  }

  return NextResponse.json({ ok: true })
}
