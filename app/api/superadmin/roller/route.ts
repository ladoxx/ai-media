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

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// GET — Tüm roller + kullanıcı sayısı + yetkiler
export async function GET() {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const allPermissions = await prisma.permission.findMany({
    where: { module: { not: 'apikey' } },
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  })

  return NextResponse.json({ roles, allPermissions })
}

// POST — Yeni rol oluştur
export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { name, description, permissionIds } = await req.json() as {
    name?: string
    description?: string
    permissionIds?: string[]
  }

  if (!name?.trim()) return NextResponse.json({ error: 'Rol adı zorunludur' }, { status: 400 })

  const slug = slugify(name)
  const existing = await prisma.role.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Bu isimde bir rol zaten var' }, { status: 400 })

  const role = await prisma.role.create({ data: { name, slug, description } })

  // apikey modülü hiçbir role eklenemez
  const safeIds = await Promise.all(
    (permissionIds ?? []).map(async (pid) => {
      const p = await prisma.permission.findUnique({ where: { id: pid } })
      return p?.module !== 'apikey' ? pid : null
    })
  )

  for (const permId of safeIds.filter(Boolean)) {
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permId! } })
  }

  return NextResponse.json({ ok: true, id: role.id }, { status: 201 })
}
