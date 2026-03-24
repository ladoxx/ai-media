import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const page = await prisma.page.findUnique({
    where: { id },
    include: { revisions: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })

  if (!page) return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
  return NextResponse.json(page)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as {
    title?: string; content?: string; slug?: string; excerpt?: string
    status?: string; template?: string; showInMenu?: boolean; menuOrder?: number
    seoTitle?: string; seoDesc?: string; ogImage?: string; saveRevision?: boolean
  }

  const existing = await prisma.page.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })

  const wasPublished = existing.status === 'PUBLISHED'
  const willPublish = body.status === 'PUBLISHED'

  const page = await prisma.page.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
      ...(body.status !== undefined ? { status: body.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } : {}),
      ...(body.template !== undefined ? { template: body.template } : {}),
      ...(body.showInMenu !== undefined ? { showInMenu: body.showInMenu } : {}),
      ...(body.menuOrder !== undefined ? { menuOrder: body.menuOrder } : {}),
      ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
      ...(body.seoDesc !== undefined ? { seoDesc: body.seoDesc } : {}),
      ...(body.ogImage !== undefined ? { ogImage: body.ogImage } : {}),
      ...(!wasPublished && willPublish ? { publishedAt: new Date() } : {}),
    },
  })

  // Save revision if content or title changed
  if (body.saveRevision !== false && (body.content || body.title)) {
    await prisma.pageRevision.create({
      data: {
        pageId: id,
        title: page.title,
        content: page.content,
        createdBy: (session.user as { email?: string }).email ?? 'superadmin',
      },
    })

    // Keep only latest 10 revisions
    const revisions = await prisma.pageRevision.findMany({
      where: { pageId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    if (revisions.length > 10) {
      const toDelete = revisions.slice(10).map((r) => r.id)
      await prisma.pageRevision.deleteMany({ where: { id: { in: toDelete } } })
    }
  }

  return NextResponse.json(page)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  await prisma.pageRevision.deleteMany({ where: { pageId: id } })
  await prisma.page.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
