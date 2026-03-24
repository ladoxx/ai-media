import type { Page } from '@/app/generated/prisma/client'
import Link from 'next/link'

interface Props { page: Page }

export function AdvertisingTemplate({ page }: Props) {
  return (
    <div>
      <div className="bg-gradient-to-br from-accent-crypto/10 via-[var(--bg-card)] to-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="text-4xl mb-4">📢</div>
          <h1 className="font-display font-extrabold text-4xl text-[var(--text-primary)] mb-3">{page.title}</h1>
          {page.excerpt && <p className="text-lg text-[var(--text-muted)]">{page.excerpt}</p>}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <article
          className="prose prose-invert max-w-none prose-headings:font-display prose-table:w-full"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
        <div className="mt-10 text-center py-8 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <p className="text-[var(--text-muted)] mb-4">Reklam ve işbirliği teklifleri için:</p>
          <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-crypto text-dark-bg font-semibold rounded-xl hover:bg-accent-crypto/90 transition-colors">
            Teklif Al →
          </Link>
        </div>
      </div>
    </div>
  )
}
