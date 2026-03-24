import Link from 'next/link'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'

const getPopularTags = unstable_cache(
  async () =>
    prisma.tag.findMany({
      where: { postCount: { gt: 0 } },
      orderBy: { postCount: 'desc' },
      take: 20,
      select: { id: true, name: true, slug: true, postCount: true },
    }),
  ['sidebar-tags'],
  { revalidate: 3600, tags: ['tags'] },
)

function tagSize(count: number, max: number): string {
  const ratio = count / max
  if (ratio > 0.7) return 'text-xl font-bold'
  if (ratio > 0.4) return 'text-base font-semibold'
  if (ratio > 0.2) return 'text-sm font-medium'
  return 'text-xs'
}

export async function TagCloud() {
  const tags = await getPopularTags()
  if (!tags.length) return null

  const maxCount = tags[0].postCount

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-widest">
        🏷️ Popüler Etiketler
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/etiket/${tag.slug}`}
            className={`${tagSize(tag.postCount, maxCount)} text-[var(--text-muted)] hover:text-[var(--color-accent-tech,#00c896)] transition-colors leading-tight`}
            title={`${tag.postCount} yazı`}
          >
            #{tag.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
