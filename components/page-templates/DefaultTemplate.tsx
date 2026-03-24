import type { Page } from '@/app/generated/prisma/client'
import { Sidebar } from '@/components/site/Sidebar'
import { prisma } from '@/lib/db'

interface Props { page: Page }

export async function DefaultTemplate({ page }: Props) {
  const trendPosts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { views: 'desc' },
    take: 5,
    include: { category: true },
  })

  return (
    <div>
      <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="font-display font-extrabold text-3xl text-[var(--text-primary)]">{page.title}</h1>
          {page.excerpt && <p className="mt-2 text-[var(--text-muted)]">{page.excerpt}</p>}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          <article
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <Sidebar
            trendPosts={trendPosts.map((p) => ({
              id: p.id, title: p.title, slug: p.slug,
              category: { slug: p.category.slug }, createdAt: p.createdAt,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
