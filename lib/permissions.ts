import { prisma } from './db'
import type { Session } from 'next-auth'

// ─── Server-side: DB'den yetki kontrolü ──────────────────────────────────────

export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleTemplate: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
      permissions: { include: { permission: true } },
    },
  })

  if (!user) return false
  if (user.systemRole === 'SUPERADMIN') return true
  if (module === 'apikey') return false

  const key = `${module}:${action}`

  // Rol şablonundan gelen yetkiler
  const rolePerms = user.roleTemplate?.permissions.map(
    (rp) => `${rp.permission.module}:${rp.permission.action}`
  ) ?? []

  // Kullanıcıya özel eklenen yetkiler (granted=true)
  const addedPerms = user.permissions
    .filter((up) => up.granted)
    .map((up) => `${up.permission.module}:${up.permission.action}`)

  // Kullanıcıdan özel kaldırılan yetkiler (granted=false)
  const removedPerms = user.permissions
    .filter((up) => !up.granted)
    .map((up) => `${up.permission.module}:${up.permission.action}`)

  const effective = [...new Set([...rolePerms, ...addedPerms])].filter(
    (p) => !removedPerms.includes(p)
  )

  return effective.includes(key)
}

export async function requirePermission(
  userId: string,
  module: string,
  action: string
): Promise<void> {
  const allowed = await hasPermission(userId, module, action)
  if (!allowed) throw new Error('Bu işlem için yetkiniz yok')
}

// ─── Tüm yetkilerini string dizisi olarak hesapla ─────────────────────────────
// lib/auth.ts → JWT callback'inde kullanılır.

export async function calculatePermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleTemplate: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
      permissions: { include: { permission: true } },
    },
  })

  if (!user) return []
  if (user.systemRole === 'SUPERADMIN') return ['*'] // wildcard

  const rolePerms = user.roleTemplate?.permissions.map(
    (rp) => `${rp.permission.module}:${rp.permission.action}`
  ) ?? []

  const addedPerms = user.permissions
    .filter((up) => up.granted)
    .map((up) => `${up.permission.module}:${up.permission.action}`)

  const removedPerms = user.permissions
    .filter((up) => !up.granted)
    .map((up) => `${up.permission.module}:${up.permission.action}`)

  return [...new Set([...rolePerms, ...addedPerms])].filter(
    (p) => !removedPerms.includes(p)
  )
}

// ─── Client-side: Session'dan yetki kontrolü ──────────────────────────────────

export function checkPermission(
  session: Session | null,
  module: string,
  action: string
): boolean {
  if (!session) return false
  const user = session.user as {
    systemRole?: string
    permissions?: string[]
  }
  if (user.systemRole === 'SUPERADMIN') return true
  if (module === 'apikey') return false
  const perms: string[] = user.permissions ?? []
  if (perms.includes('*')) return true
  return perms.includes(`${module}:${action}`)
}
