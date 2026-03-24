import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { THEME_DEFAULTS } from '@/lib/theme-defaults'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET() {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const settings = await prisma.themeSetting.findMany()
  const map: Record<string, string> = {}
  for (const d of THEME_DEFAULTS) map[d.key] = d.value
  for (const s of settings) map[s.key] = s.value
  return NextResponse.json(map)
}

export async function PUT(req: Request) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body: Record<string, string> = await req.json()
  const groupMap: Record<string, string> = {}
  for (const d of THEME_DEFAULTS) groupMap[d.key] = d.group

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.themeSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group: groupMap[key] ?? 'custom' },
      })
    )
  )

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
