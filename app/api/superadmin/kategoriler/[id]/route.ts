import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await checkSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  const body = await req.json() as { name?: string; slug?: string; icon?: string; color?: string }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.slug && { slug: body.slug }),
      ...(body.icon && { icon: body.icon }),
      ...(body.color && { color: body.color }),
    },
  })
  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await checkSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params

  const count = await prisma.post.count({ where: { categoryId: id } })
  if (count > 0) {
    return NextResponse.json({ error: 'Yazısı olan kategori silinemez' }, { status: 400 })
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
