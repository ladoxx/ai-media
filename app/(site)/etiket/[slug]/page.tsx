import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { NewsCard } from '@/components/site/NewsCard'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sayfa?: string }>
}

const PER_PAGE = 12

async function getTag(slug: string, page: number) {
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { post: { status: 'PUBLISHED' } },
        include: {
          post: {
            include: {
              category: true,
              author: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
        orderBy: { post: { publishedAt: 'desc' } },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      },
    },
  })
  if (!tag) return null

  const total = await prisma.postTag.count({
    where: { tagId: tag.id, post: { status: 'PUBLISHED' } },
  })

  return { tag, total, pages: Math.ceil(total / PER_PAGE) }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getTag(slug, 1)
  if (!result) return { title: 'Etiket Bulunamadı' }
  const { tag } = result
  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  return {
    title: tag.seoTitle ?? `#${tag.name} Haberleri | Cyba`,
    description: tag.seoDesc ?? tag.description ?? `${tag.name} ile ilgili tüm haberler ve analizler.`,
    alternates: { canonical: `${siteUrl}/etiket/${slug}` },
    openGraph: {
      title: `#${tag.name} — Cyba`,
      description: tag.description ?? `${tag.name} etiketli ${result.total} yazı`,
    },
  }
}

export default async function EtiketPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.sayfa ?? '1', 10))

  const result = await getTag(slug, page)
  if (!result) notFound()

  const { tag, total, pages } = result
  const posts = result.tag.posts.map((pt) => pt.post).filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] text-sm mb-4">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-[var(--text-primary)]">#{tag.name}</span>
        </div>

        <h1 className="text-4xl font-display font-extrabold text-[var(--text-primary)] mb-3">
          <span style={{ color: 'var(--color-accent-tech, #00c896)' }}>#</span>{tag.name}
        </h1>

        {tag.description && (
          <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto mb-3">{tag.description}</p>
        )}

        <p className="text-sm text-[var(--text-muted)]">
          <span style={{ color: 'var(--color-accent-tech, #00c896)' }} className="font-semibold">{total}</span> yazı bulundu
        </p>
      </div>

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-5xl mb-4">🏷️</p>
          <p>Bu etikette henüz yazı yok.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} variant="default" />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {page > 1 && (
                <Link href={`/etiket/${slug}?sayfa=${page - 1}`}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--color-accent-tech,#00c896)] text-sm transition-colors">
                  ← Önceki
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => (
                <Link key={i + 1} href={`/etiket/${slug}?sayfa=${i + 1}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${page === i + 1 ? 'text-[#0d0d14] font-bold' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  style={page === i + 1 ? { background: 'var(--color-accent-tech, #00c896)' } : {}}>
                  {i + 1}
                </Link>
              ))}
              {page < pages && (
                <Link href={`/etiket/${slug}?sayfa=${page + 1}`}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--color-accent-tech,#00c896)] text-sm transition-colors">
                  Sonraki →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
