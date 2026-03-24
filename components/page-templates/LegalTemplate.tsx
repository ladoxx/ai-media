import type { Page } from '@/app/generated/prisma/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Props { page: Page }

export function LegalTemplate({ page }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-[var(--border)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-full text-xs text-[var(--text-muted)] mb-4">
          <span>⚖️</span> Yasal Belge
        </div>
        <h1 className="font-display font-extrabold text-3xl text-[var(--text-primary)] mb-2">{page.title}</h1>
        {page.updatedAt && (
          <p className="text-sm text-[var(--text-muted)]">
            Son güncelleme: {format(new Date(page.updatedAt), 'd MMMM yyyy', { locale: tr })}
          </p>
        )}
      </div>

      {/* Content */}
      <article
        className="prose prose-invert max-w-none prose-headings:font-display prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-[var(--text-muted)] prose-p:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  )
}
