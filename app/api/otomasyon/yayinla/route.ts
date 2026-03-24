import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthorized(req: NextRequest, session: any): boolean {
  if (session && (session.user as { role?: string })?.role === 'SUPERADMIN') return true
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  return !!(token && token === process.env.AUTOMATION_SECRET)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAuthorized(req, session)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  let body: {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    tags?: string[]
    seoTitle?: string
    seoDesc?: string
    readTime?: number
    category?: string
    coverImage?: string | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { title, slug, excerpt, content, tags = [], seoTitle, seoDesc, readTime, category, coverImage } = body

  if (!title || !slug || !content || !category) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik: title, slug, content, category' }, { status: 400 })
  }

  // Find category (alt kategori de olabilir)
  const cat = await prisma.category.findFirst({
    where: {
      OR: [{ slug: category }, { name: { contains: category } }],
    },
    include: { parent: true },
  })

  if (!cat) {
    return NextResponse.json({ error: `Kategori bulunamadı: ${category}` }, { status: 404 })
  }

  // Find superadmin user for authorship
  const adminUser = await prisma.user.findFirst({
    where: { systemRole: 'SUPERADMIN' },
  })

  if (!adminUser) {
    return NextResponse.json({ error: 'Admin kullanıcı bulunamadı' }, { status: 500 })
  }

  // Ensure unique slug
  let finalSlug = slug
  const existing = await prisma.post.findUnique({ where: { slug: finalSlug } })
  if (existing) {
    finalSlug = `${slug}-${Date.now().toString(36)}`
  }

  // Create post
  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt?.trim() || null,
      content,
      coverImage: coverImage || null,
      seoTitle: seoTitle?.trim() || null,
      seoDesc: seoDesc?.trim() || null,
      readTime: readTime || 4,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: cat.id,
      authorId: adminUser.id,
    },
  })

  // Handle tags
  if (tags.length > 0) {
    const slugify = (await import('slugify')).default
    for (const tagName of tags) {
      const tagSlug = slugify(tagName, { lower: true, strict: true, locale: 'tr' })
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { name: tagName, slug: tagSlug },
      })
      await prisma.postTag.upsert({
        where: { postId_tagId: { postId: post.id, tagId: tag.id } },
        update: {},
        create: { postId: post.id, tagId: tag.id },
      })
    }
    // Update tag post counts
    for (const tagName of tags) {
      const tagSlug = slugify(tagName, { lower: true, strict: true, locale: 'tr' })
      const count = await prisma.postTag.count({
        where: { tag: { slug: tagSlug }, post: { status: 'PUBLISHED' } },
      })
      await prisma.tag.updateMany({ where: { slug: tagSlug }, data: { postCount: count } })
    }
  }

  // Log the publish event
  await prisma.autoLog.create({
    data: {
      type: 'automation',
      status: 'success',
      message: `Otomatik yayın: "${title}" (${category})`,
    },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  // Alt kategori ise: /parent/child/slug, ana kategori ise: /slug/slug
  const catWithParent = cat as typeof cat & { parent?: { slug: string } | null }
  const catPath = catWithParent?.parent
    ? `${catWithParent.parent.slug}/${cat!.slug}`
    : cat!.slug
  const postUrl = `${siteUrl}/${catPath}/${finalSlug}`

  return NextResponse.json({
    success: true,
    postId: post.id,
    slug: finalSlug,
    url: postUrl,
  })
}
