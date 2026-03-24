import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { systemRole?: string; role?: string } | undefined
  if (!session || (user?.systemRole !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN')) return null
  return session
}

// PUT — Rol güncelle
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const { name, description, permissionIds } = await req.json() as {
    name?: string
    description?: string
    permissionIds?: string[]
  }

  const role = await prisma.role.findUnique({ where: { id } })
  if (!role) return NextResponse.json({ error: 'Rol bulunamadı' }, { status: 404 })

  if (name) await prisma.role.update({ where: { id }, data: { name, description } })

  if (permissionIds !== undefined) {
    // Mevcut yetkileri temizle
    await prisma.rolePermission.deleteMany({ where: { roleId: id } })

    // apikey modülü hiçbir role eklenemez
    for (const permId of permissionIds) {
      const p = await prisma.permission.findUnique({ where: { id: permId } })
      if (p && p.module !== 'apikey') {
        await prisma.rolePermission.create({ data: { roleId: id, permissionId: permId } })
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// DELETE — Rol sil
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params

  // Role atanmış kullanıcı varsa silme engelle
  const userCount = await prisma.user.count({ where: { roleId: id } })
  if (userCount > 0) {
    return NextResponse.json(
      { error: `Bu role ${userCount} kullanıcı atanmış. Önce kullanıcıların rolünü değiştirin.` },
      { status: 400 }
    )
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: id } })
  await prisma.role.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
