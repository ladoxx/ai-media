import { prisma } from '@/lib/db'
import Link from 'next/link'

interface Props { settings: Record<string, string> }

export async function TrendingWidget({ settings }: Props) {
  const count = parseInt(settings.count ?? '5', 10)
  const title = settings.title ?? 'Trend Haberler'

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { views: 'desc' },
    take: count,
    select: { id: true, title: true, slug: true, views: true, category: { select: { slug: true } } },
  })

  if (!posts.length) return null

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <h3 className="font-display font-bold text-[var(--text-primary)] text-sm uppercase tracking-widest mb-4">
        🔥 {title}
      </h3>
      <ol className="space-y-3">
        {posts.map((post, i) => (
          <li key={post.id} className="flex gap-3">
            <span className="text-2xl font-display font-extrabold text-[var(--border)] flex-shrink-0 w-7 leading-none">{i + 1}</span>
            <div>
              <Link href={`/${post.category.slug}/${post.slug}`} className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--color-accent-tech,#00c896)] transition-colors line-clamp-2 leading-snug">
                {post.title}
              </Link>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{post.views.toLocaleString('tr-TR')} görüntülenme</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
