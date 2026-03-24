import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ReadingProgress } from '@/components/site/ReadingProgress'
import { ViewCounter } from '@/components/site/ViewCounter'
import { SocialShare } from '@/components/site/SocialShare'
import { formatDate } from '@/lib/utils'
import { Clock, Eye, ChevronRight, BookOpen } from 'lucide-react'
import { GuideTocSidebar } from '@/components/site/GuideTocSidebar'

interface PageProps {
  params: Promise<{ 'alt-kategori': string; slug: string }>
}

const DIFFICULTY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Başlangıç', color: '#10b981', bg: '#10b98120' },
  intermediate: { label: 'Orta Seviye', color: '#f59e0b', bg: '#f59e0b20' },
  advanced:     { label: 'İleri Seviye', color: '#ef4444', bg: '#ef444420' },
}

function extractTocItems(content: string): Array<{ id: string; text: string; level: number }> {
  const withIds = addIdsToHeadings(content)
  const matches = [...withIds.matchAll(/<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi)]
  return matches.map((m) => ({
    level: parseInt(m[1]),
    id: m[2],
    text: m[3].replace(/<[^>]+>/g, ''),
  }))
}

function addIdsToHeadings(content: string): string {
  let idx = 0
  return content.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, text) => {
    if (attrs.includes('id=')) return `<h${level}${attrs}>${text}</h${level}>`
    const id = `section-${idx++}`
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findFirst({ where: { slug, status: 'PUBLISHED' } })
  if (!post) return { title: 'Rehber Bulunamadı' }

  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return {
    title: `${post.seoTitle ?? post.title} | Cyba`,
    description: post.seoDesc ?? post.excerpt ?? '',
    openGraph: {
      title: post.title,
      description: post.excerpt ?? '',
      type: 'article',
      ...(post.coverImage ? { images: [{ url: post.coverImage, width: 1200, height: 630 }] } : {}),
    },
  }
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { 'alt-kategori': altKategori, slug } = await params

  const [post, trendPosts] = await Promise.all([
    prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        category: { include: { parent: true } },
        author: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      take: 5,
      include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
    }),
  ])

  if (!post) notFound()

  const related = await prisma.post.findMany({
    where: { status: 'PUBLISHED', categoryId: post.categoryId, id: { not: post.id } },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
  })

  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const postUrl = `${siteUrl}/rehberler/${altKategori}/${slug}`
  const tags = post.tags.map((pt) => pt.tag)
  const catPath = post.category.parent
    ? `${post.category.parent.slug}/${post.category.slug}`
    : post.category.slug

  const processedContent = addIdsToHeadings(post.content)
  const tocItems = extractTocItems(post.content)

  // Detect difficulty from tags
  const difficultyTag = post.tags.find((pt) =>
    ['beginner', 'intermediate', 'advanced'].includes(pt.tag.slug)
  )
  const difficulty = difficultyTag?.tag.slug ?? 'beginner'
  const difficultyInfo = DIFFICULTY_LABELS[difficulty] ?? DIFFICULTY_LABELS.beginner

  return (
    <>
      <ReadingProgress color="cat-rehber" />
      <ViewCounter slug={slug} />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] flex-wrap">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link href="/rehberler" className="hover:text-[var(--text-primary)] transition-colors">🧠 Rehberler</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link href={`/${catPath}`} className="hover:text-[var(--text-primary)] transition-colors">
              {post.category.icon} {post.category.name}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-[var(--text-primary)] line-clamp-1">{post.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

          {/* ── Main Content ── */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-600 text-white font-semibold tracking-wider">📚 REHBER</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: difficultyInfo.bg, color: difficultyInfo.color }}
                >
                  {difficultyInfo.label}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-extrabold text-[var(--text-primary)] leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-3 text-base text-[var(--text-muted)] leading-relaxed">{post.excerpt}</p>
              )}
              <div className="mt-4 flex items-center gap-4 flex-wrap text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium text-[var(--text-primary)]">{post.author.name}</span>
                </span>
                <span>📅 {formatDate(post.publishedAt ?? post.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime} dk okuma</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views.toLocaleString('tr-TR')} görüntülenme</span>
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}

            {/* Mobile ToC */}
            {tocItems.length > 0 && (
              <details className="lg:hidden mb-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer font-semibold text-[var(--text-primary)] flex items-center justify-between select-none">
                  <span className="flex items-center gap-2">📑 İçindekiler <span className="text-xs text-[var(--text-muted)]">({tocItems.length} bölüm)</span></span>
                </summary>
                <nav className="px-5 pb-4">
                  <ol className="space-y-2">
                    {tocItems.map((item, i) => (
                      <li key={item.id} style={{ paddingLeft: item.level === 3 ? '1rem' : '0' }}>
                        <a
                          href={`#${item.id}`}
                          className="flex items-start gap-2 text-sm text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                        >
                          <span className="text-blue-400 font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                          <span>{item.text}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </details>
            )}

            {/* Article Content */}
            <div
              className="prose prose-invert max-w-none guide-content"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* Share */}
            <div className="mt-8">
              <SocialShare url={postUrl} title={post.title} />
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[var(--text-muted)] font-mono">Etiketler:</span>
                  {tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/etiket/${tag.slug}`}
                      className="text-xs px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-blue-400 hover:border-blue-400/30 transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Guides */}
            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-display font-bold text-[var(--text-primary)] mb-4">📚 İlgili Rehberler</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {related.map((rp) => {
                    const rpCatPath = rp.category.slug
                    return (
                      <Link
                        key={rp.id}
                        href={`/rehberler/${altKategori}/${rp.slug}`}
                        className="flex gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-blue-400/30 transition-colors group"
                      >
                        {rp.coverImage && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={rp.coverImage} alt={rp.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            {rp.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{rp.readTime} dk okuma</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky Sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* ToC */}
              <GuideTocSidebar tocItems={tocItems} />

              {/* Rehber bilgisi */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Rehber Bilgisi</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Zorluk</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: difficultyInfo.bg, color: difficultyInfo.color }}
                    >
                      {difficultyInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Okuma süresi</span>
                    <span className="font-mono text-[var(--text-primary)]">{post.readTime} dk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Görüntülenme</span>
                    <span className="font-mono text-[var(--text-primary)]">{post.views.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Category link */}
              <Link
                href={`/${catPath}`}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/20 transition-colors"
              >
                <span>{post.category.icon}</span>
                <span>{post.category.name} Rehberleri</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
