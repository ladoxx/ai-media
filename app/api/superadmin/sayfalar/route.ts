import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const template = searchParams.get('template')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (template) where.template = template

  const pages = await prisma.page.findMany({
    where,
    orderBy: [{ menuOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, title: true, slug: true, status: true, template: true,
      showInMenu: true, menuOrder: true, publishedAt: true, updatedAt: true,
    },
  })

  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    title: string; content: string; slug?: string; excerpt?: string
    status?: string; template?: string; showInMenu?: boolean; menuOrder?: number
    seoTitle?: string; seoDesc?: string; ogImage?: string
  }

  if (!body.title) {
    return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400 })
  }

  const slug = body.slug || slugify(body.title)

  const page = await prisma.page.create({
    data: {
      title: body.title,
      slug,
      content: body.content,
      excerpt: body.excerpt || null,
      status: (body.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') ?? 'DRAFT',
      template: body.template ?? 'default',
      showInMenu: body.showInMenu ?? false,
      menuOrder: body.menuOrder ?? 0,
      seoTitle: body.seoTitle || null,
      seoDesc: body.seoDesc || null,
      ogImage: body.ogImage || null,
      publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
    },
  })

  // Create initial revision
  await prisma.pageRevision.create({
    data: {
      pageId: page.id,
      title: page.title,
      content: page.content,
      createdBy: (session.user as { email?: string }).email ?? 'superadmin',
    },
  })

  return NextResponse.json(page, { status: 201 })
}
