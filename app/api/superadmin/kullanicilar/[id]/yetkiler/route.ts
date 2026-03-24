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

// GET /api/superadmin/kullanicilar/[id]/yetkiler
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roleTemplate: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
      permissions: { include: { permission: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  // Tüm mevcut yetkiler
  const allPermissions = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] })

  const rolePerms = user.roleTemplate?.permissions.map((rp) => ({
    id: rp.permission.id,
    key: `${rp.permission.module}:${rp.permission.action}`,
  })) ?? []

  const customPerms = user.permissions.map((up) => ({
    id: up.permission.id,
    key: `${up.permission.module}:${up.permission.action}`,
    granted: up.granted,
  }))

  return NextResponse.json({
    userId: user.id,
    systemRole: user.systemRole,
    roleId: user.roleId,
    roleName: user.roleTemplate?.name ?? null,
    rolePerms,
    customPerms,
    allPermissions: allPermissions.filter((p) => p.module !== 'apikey'),
  })
}

// PUT /api/superadmin/kullanicilar/[id]/yetkiler
// Body: { roleId, addedPerms: string[], removedPerms: string[], systemRole }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as {
    systemRole?: string
    roleId?: string | null
    addedPerms?: string[]    // ["content:view", ...]
    removedPerms?: string[]
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  // Temel rol güncelle
  const updateData: Record<string, unknown> = {}
  if (body.systemRole && ['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(body.systemRole)) {
    updateData.systemRole = body.systemRole
  }
  if ('roleId' in body) {
    updateData.roleId = body.roleId ?? null
  }
  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id }, data: updateData })
  }

  // Özel yetkileri güncelle: önce temizle, sonra yeniden yaz
  await prisma.userPermission.deleteMany({ where: { userId: id } })

  const allAdded = body.addedPerms ?? []
  const allRemoved = body.removedPerms ?? []

  // Eklenen yetkiler (granted=true)
  for (const key of allAdded) {
    const [module, action] = key.split(':')
    const perm = await prisma.permission.findUnique({ where: { module_action: { module, action } } })
    if (perm && perm.module !== 'apikey') {
      await prisma.userPermission.create({ data: { userId: id, permissionId: perm.id, granted: true } })
    }
  }

  // Kaldırılan yetkiler (granted=false) — sadece şablon yetkilerini override eder
  for (const key of allRemoved) {
    const [module, action] = key.split(':')
    const perm = await prisma.permission.findUnique({ where: { module_action: { module, action } } })
    if (perm && perm.module !== 'apikey') {
      // Zaten eklenmemişse kaldırma kaydı yaz
      const exists = await prisma.userPermission.findUnique({
        where: { userId_permissionId: { userId: id, permissionId: perm.id } },
      })
      if (!exists) {
        await prisma.userPermission.create({ data: { userId: id, permissionId: perm.id, granted: false } })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
