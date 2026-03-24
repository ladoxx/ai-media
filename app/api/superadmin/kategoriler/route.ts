import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function POST(req: NextRequest) {
  if (!await checkSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as { name: string; slug: string; icon?: string; color?: string }
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'İsim ve slug zorunlu' }, { status: 400 })
  }

  const existing = await prisma.category.findUnique({ where: { slug: body.slug } })
  if (existing) return NextResponse.json({ error: 'Bu slug zaten kullanılıyor' }, { status: 409 })

  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      icon: body.icon ?? '📰',
      color: body.color ?? 'tech',
    },
  })
  return NextResponse.json({ category }, { status: 201 })
}
