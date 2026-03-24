import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { Sidebar } from '@/components/site/Sidebar'
import { NewsCard } from '@/components/site/NewsCard'
import { NewsletterSection } from '@/components/site/NewsletterSection'
import { ArrowRight } from 'lucide-react'
import { getCategoryMeta } from '@/lib/categories'
import { AdZone } from '@/components/site/AdZone'

// Ana sayfada gösterilecek kategori grupları
const HOME_SECTIONS = [
  { row: 'Finans & Ekonomi', cats: ['borsa', 'kripto', 'turkiye-ekonomisi'] },
  { row: 'Gayrimenkul',      cats: ['konut-projeleri', 'kira-satilik']      },
  { row: 'Teknoloji & Oyun', cats: ['yapay-zeka', 'oyun-haberleri']         },
]

// Rehber alt kategorileri
const GUIDE_CATS = ['nasil-yapilir', 'para-kazanma', 'yatirim-taktikleri']

const getData = unstable_cache(
  async () => {
  const [heroPosts, sectionData, guidePosts] = await Promise.all([
    // Hero: son 3 yayınlanan yazı
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
    }),
    // Her bölüm için kategorilerden 3'er yazı
    Promise.all(
      HOME_SECTIONS.flatMap((s) => s.cats).map((slug) =>
        prisma.post.findMany({
          where: { status: 'PUBLISHED', category: { slug } },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
        }).then((posts) => ({ slug, posts }))
      )
    ),
    // Rehber yazıları
    Promise.all(
      GUIDE_CATS.map((slug) =>
        prisma.post.findMany({
          where: { status: 'PUBLISHED', category: { slug } },
          orderBy: { publishedAt: 'desc' },
          take: 4,
          include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
        }).then((posts) => ({ slug, posts }))
      )
    ),
  ])

  const postMap = Object.fromEntries(sectionData.map(({ slug, posts }) => [slug, posts]))
  return { heroPosts, postMap, guidePosts }
  },
  ['home-page-data'],
  { revalidate: 300, tags: ['posts'] }
)

export default async function HomePage() {
  const { heroPosts, postMap, guidePosts } = await getData()
  const [hero, ...sidePosts] = heroPosts

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">

        {/* ── Son Dakika Bandı ── */}
        <div className="bg-red-500/10 border-b border-red-500/20 h-9 overflow-hidden flex items-center">
          <span className="flex-shrink-0 px-4 py-1 bg-red-500 text-white text-xs font-bold tracking-wider">🔴 SON DAKİKA</span>
          <div className="overflow-hidden flex-1">
            <div className="animate-ticker whitespace-nowrap inline-block">
              {heroPosts.map((p) => (
                <Link key={p.id} href={`/${p.category.slug}/${p.slug}`} className="inline-block px-6 text-xs text-[var(--text-primary)] hover:text-red-400 transition-colors">
                  {p.title}
                </Link>
              ))}
              {heroPosts.map((p) => (
                <Link key={p.id + 'dup'} href={`/${p.category.slug}/${p.slug}`} className="inline-block px-6 text-xs text-[var(--text-primary)] hover:text-red-400 transition-colors">
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* ── Hero Section ── */}
          {hero ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
              <div className="lg:col-span-2">
                <NewsCard post={hero} variant="hero" />
              </div>
              <div className="flex flex-col gap-4">
                {sidePosts.length > 0 ? sidePosts.map((post) => (
                  <NewsCard key={post.id} post={post} variant="side" />
                )) : (
                  <div className="h-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] flex items-center justify-center">
                    <p className="text-sm text-[var(--text-muted)]">Yeni haberler gelecek…</p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="mb-10 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-12 text-center">
              <p className="text-4xl mb-4">🧭</p>
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Haberler Yakında</h2>
              <p className="text-[var(--text-muted)]">İlk haberler çok yakında yayınlanacak.</p>
            </section>
          )}

          {/* ── Main Content + Sidebar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-12">

              {/* ── Finans & Ekonomi ── */}
              <SectionGroup
                title="💰 Finans & Ekonomi"
                parentSlug="finans"
                cats={[
                  { slug: 'borsa',             posts: postMap['borsa']             ?? [] },
                  { slug: 'kripto',            posts: postMap['kripto']            ?? [] },
                  { slug: 'turkiye-ekonomisi', posts: postMap['turkiye-ekonomisi'] ?? [] },
                ]}
              />

              {/* ── Gayrimenkul ── */}
              <SectionGroup
                title="🏡 Gayrimenkul"
                parentSlug="gayrimenkul"
                cats={[
                  { slug: 'konut-projeleri', posts: postMap['konut-projeleri'] ?? [] },
                  { slug: 'kira-satilik',    posts: postMap['kira-satilik']    ?? [] },
                ]}
              />

              {/* ── Teknoloji & Oyun ── */}
              <SectionGroup
                title="🤖 Teknoloji & Oyun"
                parentSlug="teknoloji"
                cats={[
                  { slug: 'yapay-zeka',    posts: postMap['yapay-zeka']    ?? [] },
                  { slug: 'oyun-haberleri', posts: postMap['oyun-haberleri'] ?? [] },
                ]}
              />

              {/* Ana Sayfa Arası Reklam */}
              <div className="flex justify-center my-6">
                <AdZone slug="homepage-middle" />
              </div>

              {/* ── Rehberler (farklı tasarım) ── */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">🧠 Rehberler & Taktikler</h2>
                    <div className="h-px w-16 bg-gradient-to-r from-[#f59e0b]/60 to-transparent" />
                  </div>
                  <Link href="/rehberler" className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    Tümü <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {guidePosts.map(({ slug, posts }) => {
                    const meta = getCategoryMeta(slug)
                    return (
                      <div key={slug} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                        <div className="px-4 py-3 border-b border-[var(--border)]" style={{ borderLeft: `3px solid ${meta.hex}` }}>
                          <Link href={`/rehberler/${slug}`} className="flex items-center gap-2 font-semibold text-sm text-[var(--text-primary)] hover:opacity-80 transition-opacity">
                            <span>{meta.icon}</span> {meta.name}
                          </Link>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                          {posts.length > 0 ? posts.map((post) => (
                            <Link
                              key={post.id}
                              href={`/rehberler/${slug}/${post.slug}`}
                              className="block px-4 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors line-clamp-2"
                            >
                              {post.title}
                            </Link>
                          )) : (
                            <p className="px-4 py-6 text-xs text-[var(--text-muted)] text-center">Yakında içerik gelecek</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

            </div>

            {/* Sidebar */}
            <Sidebar
              trendPosts={heroPosts.map((p) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                category: { slug: p.category.slug },
                createdAt: p.createdAt,
              }))}
            />
          </div>

          {/* ── Newsletter ── */}
          <NewsletterSection />
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Yardımcı bileşen: kategori grubu bölümü
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionGroup({
  title,
  parentSlug,
  cats,
}: {
  title: string
  parentSlug: string
  cats: Array<{ slug: string; posts: any[] }>
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">{title}</h2>
        <Link href={`/${parentSlug}`} className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          Tümü <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-8">
        {cats.map(({ slug, posts }) => {
          const meta = getCategoryMeta(slug)
          return (
            <div key={slug}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{meta.icon}</span>
                <Link href={`/${parentSlug}/${slug}`} className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  {meta.name}
                </Link>
                <div className="h-px flex-1 opacity-30" style={{ background: meta.hex }} />
              </div>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post) => (
                    <NewsCard key={post.id} post={post} variant="default" />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)]">Bu kategoride henüz haber yok.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
