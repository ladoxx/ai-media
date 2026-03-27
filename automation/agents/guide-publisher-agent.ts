import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { prisma } from '@/lib/db'
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

function replaceAffiliateLinks(content: string, affiliateLinks: Array<{ slug: string; url: string; name: string }>): string {
  let result = content
  const linkMap = new Map(affiliateLinks.map((l) => [l.slug.toLowerCase(), l]))

  result = result.replace(/\[AFFILIATE_LINK:([^\]]+)\]/gi, (_, platform: string) => {
    const key = platform.trim().toLowerCase()
    const link = linkMap.get(key)
    if (link) {
      return `<a href="/git/${link.slug}" class="affiliate-link" target="_blank" rel="noopener">${link.name}</a>`
    }
    // If no matching link, remove the placeholder
    return platform.trim()
  })

  return result
}

function buildJsonLd(guideSeo: PipelineData['guideSeo'], siteUrl: string, postUrl: string): string {
  const schemas: object[] = []

  if (guideSeo?.howToSchema && Object.keys(guideSeo.howToSchema).length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      ...guideSeo.howToSchema,
    })
  }

  if (guideSeo?.faqSchema && (guideSeo.faqSchema as { questions?: unknown[] }).questions?.length) {
    const faq = guideSeo.faqSchema as { questions: Array<{ question: string; answer: string }> }
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.questions.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    })
  }

  if (schemas.length === 0) return ''
  return `<script type="application/ld+json">${JSON.stringify(schemas)}</script>`
}

export class GuidePublisherAgent extends BaseAgent {
  slug = 'guide-publisher'
  name = 'Guide Publisher Ajanı'
  role = 'guide-publisher'
  order = 5
  isCritical = true

  async process(input: PipelineData): Promise<PipelineData> {
    const draft = input.guideDraft
    const edited = input.guideEdited
    const seo = input.guideSeo

    if (!draft) {
      throw new Error('Guide Publisher için içerik bulunamadı')
    }

    const title = draft.title
    const excerpt = edited?.excerpt || draft.excerpt
    const readTime = seo?.readTime || draft.estimatedReadTime || 8
    const seoTitle = seo?.seoTitle || title
    const seoDesc = seo?.seoDescription || excerpt
    const tags = seo?.tags || input.guideTopic?.keywords || []
    const tocItems = edited?.tocItems || draft.tocItems || []

    // Get affiliate links for placeholder replacement
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: { active: true },
      select: { slug: true, url: true, name: true },
    })

    let rawContent = seo?.optimizedContent || edited?.content || draft.content

    // Replace affiliate placeholders with real links
    rawContent = replaceAffiliateLinks(rawContent, affiliateLinks)

    // Inject inline images between H2 sections
    const injectedContent = injectInlineImages(rawContent, input.media?.inlineImages || [])

    // Build JSON-LD schemas
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const jsonLd = buildJsonLd(seo, siteUrl, '')

    // Prepend ToC HTML if we have toc items
    let tocHtml = ''
    if (tocItems.length > 0) {
      tocHtml = `<nav class="guide-toc" aria-label="İçindekiler"><ol>${tocItems.map((item) => `<li>${item}</li>`).join('')}</ol></nav>`
    }

    const finalContent = jsonLd + tocHtml + injectedContent

    // Find category in DB
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
    let baseSlug = slugifySimple(title)
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
        content: finalContent,
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

    // Log
    await prisma.autoLog.create({
      data: {
        type: 'guide-pipeline',
        status: 'success',
        message: `Guide yayın: "${title}" (${input.category})`,
      },
    })

    // Invalidate Next.js page cache so new post appears immediately
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const secret = process.env.AUTOMATION_SECRET
    if (secret) {
      fetch(`${appUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: '{}',
      }).catch(() => {})
    }

    // Build post URL
    const catAny = cat as typeof cat & { parent?: { slug: string } | null }
    const catPath = catAny.parent
      ? `${catAny.parent.slug}/${cat.slug}`
      : cat.slug
    const postUrl = `${siteUrl}/${catPath}/${baseSlug}`

    input.published = {
      postId: post.id,
      url: postUrl,
      title: title.trim(),
    }

    console.log(`     📤 Rehber yayınlandı: ${postUrl}`)

    return input
  }
}
