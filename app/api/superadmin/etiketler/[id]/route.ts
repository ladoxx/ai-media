import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import slugify from 'slugify'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  const { name, slug: rawSlug, description, seoTitle, seoDesc } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'İsim zorunludur' }, { status: 400 })

  const slug = rawSlug?.trim()
    ? slugify(rawSlug.trim(), { lower: true, strict: true, locale: 'tr' })
    : slugify(name.trim(), { lower: true, strict: true, locale: 'tr' })

  const tag = await prisma.tag.update({ where: { id }, data: { name: name.trim(), slug, description, seoTitle, seoDesc } })
  revalidatePath('/', 'layout')
  return NextResponse.json(tag)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  await prisma.postTag.deleteMany({ where: { tagId: id } })
  await prisma.tag.delete({ where: { id } })
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
