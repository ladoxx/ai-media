import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Props { settings: Record<string, string> }

export async function RecentPostsWidget({ settings }: Props) {
  const count = parseInt(settings.count ?? '5', 10)
  const showImage = settings.show_image !== 'false'

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      ...(settings.category ? { category: { slug: settings.category } } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    take: count,
    select: { id: true, title: true, slug: true, coverImage: true, publishedAt: true, createdAt: true, category: { select: { slug: true } } },
  })

  if (!posts.length) return null

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <h3 className="font-display font-bold text-[var(--text-primary)] text-sm uppercase tracking-widest mb-4">
        📰 Son Yazılar
      </h3>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${post.category.slug}/${post.slug}`}
            className="flex items-center gap-3 group"
          >
            {showImage && post.coverImage && (
              <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <p className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors line-clamp-2 leading-snug">
              {post.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
