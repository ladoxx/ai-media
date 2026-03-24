import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { NewsCard } from '@/components/site/NewsCard'
import { Sidebar } from '@/components/site/Sidebar'
import { PageRenderer } from '@/components/page-templates/PageRenderer'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCategoryMeta } from '@/lib/categories'
import { AdZone } from '@/components/site/AdZone'

interface PageProps {
  params: Promise<{ kategori: string }>
  searchParams: Promise<{ sayfa?: string; alt?: string }>
}

const PER_PAGE = 9

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kategori } = await params

  const cat = await prisma.category.findUnique({ where: { slug: kategori } })
  if (cat) {
    return {
      title: `${cat.name} Haberleri | Cyba`,
      description: cat.description ?? `Cyba'nda en güncel ${cat.name} haberleri ve analizleri.`,
    }
  }

  const page = await prisma.page.findUnique({ where: { slug: kategori } })
  if (page) {
    return {
      title: `${page.seoTitle ?? page.title} | Cyba`,
      description: page.seoDesc ?? page.excerpt ?? undefined,
    }
  }

  return { title: 'Sayfa Bulunamadı' }
}

export default async function KategoriVeyaSayfa({ params, searchParams }: PageProps) {
  const { kategori } = await params
  const { sayfa: sayfaStr } = await searchParams
  const sayfa = parseInt(sayfaStr ?? '1')
  const skip = (sayfa - 1) * PER_PAGE

  // 1. Try as category
  const cat = await prisma.category.findUnique({
    where: { slug: kategori },
    include: { children: { orderBy: { menuOrder: 'asc' } } },
  })

  if (cat) {
    // Hem bu kategori hem de alt kategorilerin ID'leri
    const catIds = [cat.id, ...cat.children.map((c) => c.id)]

    const [posts, total, trendPosts] = await Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', categoryId: { in: catIds } },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: PER_PAGE,
        include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.post.count({ where: { status: 'PUBLISHED', categoryId: { in: catIds } } }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { views: 'desc' },
        take: 5,
        include: { category: true },
      }),
    ])

    const totalPages = Math.ceil(total / PER_PAGE)
    const meta = getCategoryMeta(cat.slug)

    return (
      <div>
        {/* ── Kategori Hero ── */}
        <div className="border-b border-[var(--border)]" style={{ background: `linear-gradient(135deg, ${meta.hex}18, transparent)` }}>
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">{cat.icon}</span>
              <div>
                <h1 className="text-3xl font-display font-extrabold text-[var(--text-primary)]">
                  {cat.name}
                </h1>
                {cat.description && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{cat.description}</p>
                )}
                <p className="mt-1 text-xs text-[var(--text-muted)] font-mono">{total} yazı</p>
              </div>
            </div>

            {/* Alt kategori tabları */}
            {cat.children.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <Link
                  href={`/${cat.slug}`}
                  className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                  style={{ borderColor: meta.hex, color: meta.hex, background: `${meta.hex}15` }}
                >
                  Tümü
                </Link>
                {cat.children.map((child) => {
                  const childMeta = getCategoryMeta(child.slug)
                  return (
                    <Link
                      key={child.slug}
                      href={`/${cat.slug}/${child.slug}`}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all bg-[var(--bg-card)]"
                    >
                      <span>{childMeta.icon}</span>
                      {child.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kategori Üst Reklam */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <AdZone slug="category-top" className="flex justify-center" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <div>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {posts.map((post) => (
                    <NewsCard key={post.id} post={post} variant="default" />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-[var(--bg-card)] rounded-2xl border border-dashed border-[var(--border)]">
                  <p className="text-4xl mb-3">{cat.icon}</p>
                  <p className="font-display font-bold text-[var(--text-primary)] mb-1">Henüz yazı yok</p>
                  <p className="text-sm text-[var(--text-muted)]">Bu kategoride yakında içerikler yayınlanacak.</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {sayfa > 1 && (
                    <Link href={`/${kategori}?sayfa=${sayfa - 1}`} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Önceki
                    </Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1
                    return (
                      <Link
                        key={p}
                        href={`/${kategori}?sayfa=${p}`}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors border"
                        style={p === sayfa
                          ? { background: meta.hex, color: '#0d0d14', borderColor: meta.hex }
                          : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
                        }
                      >
                        {p}
                      </Link>
                    )
                  })}
                  {sayfa < totalPages && (
                    <Link href={`/${kategori}?sayfa=${sayfa + 1}`} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Sonraki <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Sidebar trendPosts={trendPosts.map((p) => ({
              id: p.id, title: p.title, slug: p.slug,
              category: { slug: p.category.slug }, createdAt: p.createdAt,
            }))} />
          </div>
        </div>
      </div>
    )
  }

  // 2. Try as DB page
  const page = await prisma.page.findUnique({ where: { slug: kategori } })
  if (!page || page.status !== 'PUBLISHED') notFound()

  return <PageRenderer page={page} />
}
