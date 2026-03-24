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
import { Eye, Clock, User } from 'lucide-react'
import { AdZone } from '@/components/site/AdZone'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string) {
  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      category: true,
      author: { select: { id: true, name: true, avatar: true } },
      tags: { include: { tag: true } },
    },
  })
  return post
}

async function getRelated(categoryId: string, excludeId: string) {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED', categoryId, id: { not: excludeId } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: { category: true, author: { select: { id: true, name: true, avatar: true } } },
  })
}

async function getTrend() {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { views: 'desc' },
    take: 5,
    include: { category: true },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Yazı Bulunamadı' }

  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const url = `${siteUrl}/haber/${slug}`

  return {
    title: `${post.seoTitle ?? post.title} | Cyba`,
    description: post.seoDesc ?? post.excerpt ?? '',
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? '',
      url,
      type: 'article',
      ...(post.coverImage ? { images: [{ url: post.coverImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? '',
    },
  }
}

const gradientMap: Record<string, string> = {
  tech:   'from-accent-tech/20 to-dark-bg',
  crypto: 'from-accent-crypto/20 to-dark-bg',
  real:   'from-accent-real/20 to-dark-bg',
  game:   'from-accent-game/20 to-dark-bg',
}

export default async function HaberDetay({ params }: PageProps) {
  const { slug } = await params
  const [post, trendPosts] = await Promise.all([getPost(slug), getTrend()])

  if (!post) notFound()

  const related = await getRelated(post.categoryId, post.id)
  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const postUrl = `${siteUrl}/haber/${slug}`
  const tags = post.tags.map((pt) => pt.tag)

  return (
    <>
      <ReadingProgress color={post.category.color} />
      <ViewCounter slug={slug} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[
            { label: post.category.name, href: `/${post.category.slug}` },
            { label: post.title },
          ]} />
        </div>

        {/* Article Header */}
        <div className="max-w-3xl mb-6">
          <Badge category={post.category.color} name={post.category.name} icon={post.category.icon} />
          <h1 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-[var(--text-primary)] leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-3 text-lg text-[var(--text-muted)] italic leading-relaxed">{post.excerpt}</p>
          )}

          {/* Meta */}
          <div className="mt-5 flex items-center gap-4 flex-wrap text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-accent-tech/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-accent-tech" />
              </div>
              <span className="font-medium text-[var(--text-primary)]">{post.author.name}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>📅</span>
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} dk okuma
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views.toLocaleString('tr-TR')} görüntülenme
            </span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative w-full h-[300px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
          {post.coverImage ? (
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradientMap[post.category.color] ?? 'from-gray-500/20 to-dark-bg'} flex items-center justify-center`}>
              <span className="text-8xl opacity-30">{post.category.icon}</span>
            </div>
          )}
        </div>

        {/* Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div>
            {/* Makale İçi Üst Reklam (2. paragraftan sonra) */}
            <AdZone slug="content-top" className="my-6 flex justify-center" page={`/haber/${slug}`} />

            {/* Article Prose */}
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Makale İçi Alt Reklam */}
            <AdZone slug="content-bottom" className="my-6 flex justify-center" page={`/haber/${slug}`} />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-[var(--text-muted)]">Etiketler:</span>
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/etiket/${tag.slug}`}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:border-accent-tech hover:text-accent-tech transition-colors font-mono"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Social Share */}
            <div className="mt-6 p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
              <SocialShare url={postUrl} title={post.title} />
            </div>

            {/* Author Box */}
            <div className="mt-6 p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] flex items-start gap-4">
              <div className="w-14 h-14 bg-accent-tech/10 rounded-full flex items-center justify-center flex-shrink-0">
                {post.author.avatar ? (
                  <Image src={post.author.avatar} alt={post.author.name} width={56} height={56} className="rounded-full" />
                ) : (
                  <User className="w-7 h-7 text-accent-tech" />
                )}
              </div>
              <div>
                <p className="font-display font-bold text-[var(--text-primary)]">{post.author.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Editör @ Cyba</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Teknoloji, kripto ve finans alanında güncel haberler ve analizler üretiyor.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Sidebar
              trendPosts={trendPosts.map((p) => ({
                id: p.id, title: p.title, slug: p.slug,
                category: { slug: p.category.slug }, createdAt: p.createdAt,
              }))}
            />
            <TagCloud />
          </div>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-[var(--border)]">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-6">
              {post.category.icon} {post.category.name} Kategorisinden Diğerleri
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((p) => (
                <NewsCard key={p.id} post={p} variant="default" />
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        <CommentSection postId={post.id} initialCount={post.commentCount} />
      </div>
    </>
  )
}
