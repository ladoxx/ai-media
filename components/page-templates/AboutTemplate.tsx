import type { Page } from '@/app/generated/prisma/client'
import Link from 'next/link'

interface Props { page: Page }

export function AboutTemplate({ page }: Props) {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-accent-tech/10 via-[var(--bg-card)] to-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🧭</div>
          <h1 className="font-display font-extrabold text-4xl text-[var(--text-primary)] mb-4">{page.title}</h1>
          {page.excerpt && <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto">{page.excerpt}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article
          className="prose prose-invert max-w-none prose-headings:font-display prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {/* CTA */}
        <div className="mt-12 text-center py-10 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-3">İletişime Geçin</h2>
          <p className="text-[var(--text-muted)] mb-6">Reklam, işbirliği veya içerik önerileri için bize ulaşın.</p>
          <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-tech text-dark-bg font-semibold rounded-xl hover:bg-accent-tech/90 transition-colors">
            İletişim Formu →
          </Link>
        </div>
      </div>
    </div>
  )
}
