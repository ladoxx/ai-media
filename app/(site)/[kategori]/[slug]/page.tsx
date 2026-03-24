import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Breadcrumb } from '@/components/site/Breadcrumb'
import { Badge } from '@/components/ui/Badge'
import { NewsCard } from '@/components/site/NewsCard'
import { ReadingProgress } from '@/components/site/ReadingProgress'
import { SocialShare } from '@/components/site/SocialShare'
import { ViewCounter } from '@/components/site/ViewCounter'
import { Sidebar } from '@/components/site/Sidebar'
import { TagCloud } from '@/components/site/TagCloud'
import { CommentSection } from '@/components/site/CommentSection'
import { formatDate } from '@/lib/utils'
import { Eye, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCategoryMeta } from '@/lib/categories'

interface PageProps {
  params: Promise<{ kategori: string; slug: string }>
  searchParams: Promise<{ sayfa?: string }>
}

const PER_PAGE = 9

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kategori, slug } = await params

  // Check sub-category first
  const subCat = await prisma.category.findFirst({
    where: { slug, parent: { slug: kategori } },
  })
  if (subCat) {
    return {
      title: `${subCat.name} Haberleri | Cyba`,
      description: subCat.description ?? `Cyba'nda en güncel ${subCat.name} haberleri.`,
    }
  }

  // Then check article
  const post = await prisma.post.findFirst({ where: { slug, status: 'PUBLISHED' } })
  if (!post) return { title: 'Sayfa Bulunamadı' }
  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const url = `${siteUrl}/${kategori}/${slug}`
  return {
    title: `${post.seoTitle ?? post.title} | Cyba`,
    description: post.seoDesc ?? post.excerpt ?? '',
    alternates: { canonical: url },
    openGraph: {
      title: post.title, description: post.excerpt ?? '', url, type: 'article',
      ...(post.coverImage ? { images: [{ url: post.coverImage, width: 1200, height: 630 }] } : {}),
    },
  }
}

export default async function SlugPage({ params, searchParams }: PageProps) {
  const { kategori, slug } = await params
  const { sayfa: sayfaStr } = await searchParams
  const sayfa = parseInt(sayfaStr ?? '1')
  const skip = (sayfa - 1) * PER_PAGE

  // ── 1. Check if slug is a sub-category of kategori ──────────────────────
  const subCat = await prisma.category.findFirst({
    where: { slug, parent: { slug: kategori } },
    include: {
      parent: { include: { children: { orderBy: { menuOrder: 'asc' } } } },
    },
  })

  if (subCat && subCat.parent) {
    const [posts, total, trendPosts] = await Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', categoryId: subCat.id },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: PER_PAGE,
        include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.post.count({ where: { status: 'PUBLISHED', categoryId: subCat.id } }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { views: 'desc' },
        take: 5,
        include: { category: true },
      }),
    ])

    const totalPages = Math.ceil(total / PER_PAGE)
    const parentMeta = getCategoryMeta(subCat.parent.slug)
    const meta = getCategoryMeta(subCat.slug)

    return (
      <div>
        {/* Hero */}
        <div className="border-b border-[var(--border)]" style={{ background: `linear-gradient(135deg, ${meta.hex}18, transparent)` }}>
          <div className="max-w-7xl mx-auto px-4 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
              <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Ana Sayfa</Link>
              <span>/</span>
              <Link href={`/${subCat.parent.slug}`} className="hover:text-[var(--text-primary)] transition-colors">{subCat.parent.icon} {subCat.parent.name}</Link>
              <span>/</span>
              <span style={{ color: meta.hex }}>{subCat.icon} {subCat.name}</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">{subCat.icon}</span>
              <div>
                <h1 className="text-3xl font-display font-extrabold text-[var(--text-primary)]">{subCat.name}</h1>
                {subCat.description && <p className="mt-1 text-sm text-[var(--text-muted)]">{subCat.description}</p>}
                <p className="mt-1 text-xs text-[var(--text-muted)] font-mono">{total} yazı</p>
              </div>
            </div>
            {/* Sibling tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <Link
                href={`/${subCat.parent.slug}`}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] transition-all"
              >
                {subCat.parent.icon} Tümü
              </Link>
              {subCat.parent.children.map((child) => {
                const childMeta = getCategoryMeta(child.slug)
                const isActive = child.slug === slug
                return (
                  <Link
                    key={child.slug}
                    href={`/${subCat.parent!.slug}/${child.slug}`}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={isActive
                      ? { background: childMeta.hex, color: '#0d0d14', borderColor: childMeta.hex }
                      : { borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }
                    }
                  >
                    <span>{childMeta.icon}</span>
                    {child.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <div>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {posts.map((post) => <NewsCard key={post.id} post={post} variant="default" />)}
                </div>
              ) : (
                <div className="py-20 text-center bg-[var(--bg-card)] rounded-2xl border border-dashed border-[var(--border)]">
                  <p className="text-4xl mb-3">{subCat.icon}</p>
                  <p className="font-display font-bold text-[var(--text-primary)] mb-1">Henüz yazı yok</p>
                  <p className="text-sm text-[var(--text-muted)]">Bu kategoride yakında içerikler yayınlanacak.</p>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {sayfa > 1 && (
                    <Link href={`/${kategori}/${slug}?sayfa=${sayfa - 1}`} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Önceki
                    </Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1
                    return (
                      <Link key={p} href={`/${kategori}/${slug}?sayfa=${p}`}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors"
                        style={p === sayfa ? { background: meta.hex, color: '#0d0d14', borderColor: meta.hex } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                      >{p}</Link>
                    )
                  })}
                  {sayfa < totalPages && (
                    <Link href={`/${kategori}/${slug}?sayfa=${sayfa + 1}`} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Sonraki <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>
            <Sidebar trendPosts={trendPosts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, category: { slug: p.category.slug }, createdAt: p.createdAt }))} />
          </div>
        </div>
      </div>
    )
  }

  // ── 2. Article detail ─────────────────────────────────────────────────────
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
      include: { category: true },
    }),
  ])

  if (!post) notFound()

  const related = await prisma.post.findMany({
    where: { status: 'PUBLISHED', categoryId: post.categoryId, id: { not: post.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
  })

  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const postUrl = `${siteUrl}/${kategori}/${slug}`
  const tags = post.tags.map((pt) => pt.tag)
  const catMeta = getCategoryMeta(post.category.slug)

  return (
    <>
      <ReadingProgress color={post.category.color} />
      <ViewCounter slug={slug} />

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[
            ...(post.category.parent ? [{ label: post.category.parent.name, href: `/${post.category.parent.slug}` }] : []),
            { label: post.category.name, href: `/${post.category.parent?.slug ?? post.category.slug}/${post.category.slug}` },
            { label: post.title },
          ]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* ── Sol: Makale içeriği ── */}
          <div>
            {/* Başlık bölümü */}
            <div className="mb-6">
              <Badge category={post.category.color} name={post.category.name} icon={post.category.icon} />
              <h1 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-display font-extrabold text-[var(--text-primary)] leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-3 text-base text-[var(--text-muted)] italic leading-relaxed">{post.excerpt}</p>
              )}
              <div className="mt-4 flex items-center gap-4 flex-wrap text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${catMeta.hex}20` }}>
                    <User className="w-4 h-4" style={{ color: catMeta.hex }} />
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">{post.author.name}</span>
                </span>
                <span className="flex items-center gap-1">📅 {formatDate(post.publishedAt ?? post.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime} dk okuma</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views.toLocaleString('tr-TR')} görüntülenme</span>
              </div>
            </div>

            {/* Cover Image */}
            <div className="relative w-full h-[240px] md:h-[420px] rounded-2xl overflow-hidden mb-8">
              {post.coverImage ? (
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${catMeta.hex}25, ${catMeta.hex}08)` }}>
                  <span className="text-7xl opacity-20 select-none">{post.category.icon}</span>
                </div>
              )}
            </div>
            {/* Makale içeriği */}
            <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />

            {tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-[var(--text-muted)]">Etiketler:</span>
                  {tags.map((tag) => (
                    <Link key={tag.id} href={`/etiket/${tag.slug}`}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-mono"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
              <SocialShare url={postUrl} title={post.title} />
            </div>

            <div className="mt-6 p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] flex items-start gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${catMeta.hex}20` }}>
                {post.author.avatar ? (
                  <Image src={post.author.avatar} alt={post.author.name} width={56} height={56} className="rounded-full" />
                ) : (
                  <User className="w-7 h-7" style={{ color: catMeta.hex }} />
                )}
              </div>
              <div>
                <p className="font-display font-bold text-[var(--text-primary)]">{post.author.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Editör @ Cyba</p>
              </div>
            </div>

            {related.length > 0 && (
              <section className="mt-12 pt-8 border-t border-[var(--border)]">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-6">
                  {post.category.icon} {post.category.name} Kategorisinden Diğerleri
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {related.map((p) => <NewsCard key={p.id} post={p} variant="default" />)}
                </div>
              </section>
            )}

            <CommentSection postId={post.id} initialCount={post.commentCount} />
          </div>

          {/* ── Sağ: Sidebar ── */}
          <div className="space-y-6">
            <Sidebar trendPosts={trendPosts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, category: { slug: p.category.slug }, createdAt: p.createdAt }))} />
            <TagCloud />
          </div>
        </div>
      </div>
    </>
  )
}
