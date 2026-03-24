import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { itemId } = await params
  const body = await req.json() as {
    label?: string; url?: string; target?: string; icon?: string
  }

  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: body,
  })
  return NextResponse.json(item)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { itemId } = await params
  // Remove children first
  await prisma.menuItem.deleteMany({ where: { parentId: itemId } })
  await prisma.menuItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
