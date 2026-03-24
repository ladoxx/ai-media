import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { prisma } from '@/lib/db'
import { isSeenBefore, markAsSeen } from '../utils/db'
import { injectInlineImages } from '../utils/content'

function slugifySimple(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

export class PublisherAgent extends BaseAgent {
  slug = 'publisher'
  name = 'Publisher Ajanı'
  role = 'publisher'
  order = 6
  isCritical = true

  async process(input: PipelineData): Promise<PipelineData> {
    if (!input.seo && !input.edited && !input.draft) {
      throw new Error('Publisher için içerik bulunamadı')
    }

    const rawContent = input.seo?.optimizedContent || input.edited?.content || input.draft?.content!
    const content = injectInlineImages(rawContent, input.media?.inlineImages || [])
    const title = input.seo?.seoTitle || input.edited?.title || input.draft?.title!
    const excerpt = input.seo?.seoDescription || input.edited?.excerpt || input.draft?.excerpt || ''
    const tags = input.seo?.tags || []
    const readTime = input.seo?.readTime || 4
    const seoTitle = input.seo?.seoTitle || title
    const seoDesc = input.seo?.seoDescription || excerpt

    // Find category in DB (by slug, checking parent + children)
    const cat = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: input.category },
          { name: { contains: input.category } },
        ],
      },
      include: { parent: true },
    })

    if (!cat) {
      throw new Error(`Kategori bulunamadı: ${input.category}`)
    }

    const adminUser = await prisma.user.findFirst({ where: { systemRole: 'SUPERADMIN' } })
    if (!adminUser) {
      throw new Error('Admin kullanıcı bulunamadı')
    }

    // Ensure unique slug
    let baseSlug = input.draft?.slug || slugifySimple(title)
    const existing = await prisma.post.findUnique({ where: { slug: baseSlug } })
    if (existing) {
      baseSlug = `${baseSlug}-${Date.now().toString(36)}`
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        slug: baseSlug,
        excerpt: excerpt.trim() || null,
        content,
        coverImage: input.media?.coverPath || null,
        seoTitle: seoTitle.trim() || null,
        seoDesc: seoDesc.trim() || null,
        readTime,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: cat.id,
        authorId: adminUser.id,
      },
    })

    // Handle tags
    if (tags.length > 0) {
      const slugifyTag = (t: string) => t.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

      for (const tagName of tags) {
        const tagSlug = slugifyTag(tagName)
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
        const count = await prisma.postTag.count({
          where: { tag: { slug: tagSlug }, post: { status: 'PUBLISHED' } },
        })
        await prisma.tag.updateMany({ where: { slug: tagSlug }, data: { postCount: count } })
      }
    }

    // Mark source news as seen
    for (const item of input.selectedNews || []) {
      if (!isSeenBefore(item.url, item.title)) {
        markAsSeen(item.url, item.title)
      }
    }

    // Log
    await prisma.autoLog.create({
      data: {
        type: 'multi-agent',
        status: 'success',
        message: `Pipeline yayın: "${title}" (${input.category})`,
      },
    })

    // Invalidate Next.js page cache so new post appears immediately
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const secret = process.env.AUTOMATION_SECRET
    if (secret) {
      fetch(`${appUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ tags: ['posts'] }),
      }).catch(() => {})
    }

    // Build post URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const catPath = (cat as typeof cat & { parent?: { slug: string } | null }).parent
      ? `${(cat as typeof cat & { parent?: { slug: string } | null }).parent!.slug}/${cat.slug}`
      : cat.slug
    const postUrl = `${siteUrl}/${catPath}/${baseSlug}`

    input.published = {
      postId: post.id,
      url: postUrl,
      title: title.trim(),
    }

    console.log(`     📤 Yayınlandı: ${postUrl}`)

    return input
  }
}
